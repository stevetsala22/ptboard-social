// Genera la voce con ElevenLabs, frase per frase, e la posiziona ai tempi di src/timeline.ts.
// Output: public/audio/voice.wav (30s) + public/audio/alignment.json (tempi parola → sottotitoli).
// Uso: node --env-file=.env scripts/voice.mjs
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
if (!KEY || !VOICE) throw new Error('Manca ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID in .env');
const FPS = 30;
const api = (p, opt = {}) =>
  fetch('https://api.elevenlabs.io/v1' + p, {...opt, headers: {'xi-api-key': KEY, 'content-type': 'application/json', ...(opt.headers || {})}}).then(async (r) => {
    if (!r.ok) throw new Error(`${p} → ${r.status} ${await r.text()}`);
    return r.json();
  });

// 1) Uso commerciale: il piano Free non lo consente
const sub = await api('/user/subscription');
console.log('Piano ElevenLabs:', sub.tier);
if (!sub.tier || sub.tier === 'free') throw new Error('Il piano Free non consente uso commerciale: serve almeno Starter.');

// 2) Frasi dalla timeline (stesso testo dei sottotitoli)
const src = fs.readFileSync('src/timeline.ts', 'utf8');
const LINES = [...src.matchAll(/\{text: '([^']+)', from: (\d+), to: (\d+)\}/g)].map((m) => ({text: m[1], from: +m[2], to: +m[3]}));
fs.mkdirSync('out/voice', {recursive: true});

const words = [];
const parts = [];
for (const [i, l] of LINES.entries()) {
  const j = await api(`/text-to-speech/${VOICE}/with-timestamps?output_format=pcm_44100`, {
    method: 'POST',
    body: JSON.stringify({
      text: l.text,
      model_id: 'eleven_multilingual_v2',
      language_code: 'it',
      voice_settings: {stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: 1.08},
      previous_text: LINES[i - 1]?.text,
      next_text: LINES[i + 1]?.text,
    }),
  });
  const pcm = `out/voice/l${i}.pcm`;
  fs.writeFileSync(pcm, Buffer.from(j.audio_base64, 'base64'));
  const durSec = fs.statSync(pcm).size / 2 / 44100;
  const slot = (l.to - l.from) / FPS;
  // se la frase sfora lo slot la acceleriamo leggermente (max 12%), mai tagliata
  const tempo = durSec > slot ? Math.min(1.12, durSec / slot) : 1;
  if (durSec / tempo > slot + 0.05) console.warn(`⚠ Frase ${i} lunga ${durSec.toFixed(2)}s, slot ${slot.toFixed(2)}s: allargare lo slot in timeline.ts`);
  parts.push({pcm, from: l.from, tempo});

  // caratteri → parole
  const a = j.alignment;
  let cur = null;
  a.characters.forEach((ch, k) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur), (cur = null);
      return;
    }
    const s = l.from + Math.round((a.character_start_times_seconds[k] / tempo) * FPS);
    const e = l.from + Math.round((a.character_end_times_seconds[k] / tempo) * FPS);
    if (!cur) cur = {w: '', from: s, to: e};
    cur.w += ch;
    cur.to = e;
  });
  if (cur) words.push(cur);
  console.log(`✓ ${i}: ${durSec.toFixed(2)}s (slot ${slot.toFixed(2)}s, tempo ${tempo.toFixed(2)})`);
}

fs.writeFileSync('public/audio/alignment.json', JSON.stringify({words}, null, 1));

// 3) Montaggio della traccia voce a 30s esatti
const args = ['-y', '-loglevel', 'error'];
parts.forEach((p) => args.push('-f', 's16le', '-ar', '44100', '-ac', '1', '-i', p.pcm));
const f = parts.map((p, i) => `[${i}]atempo=${p.tempo},adelay=${Math.round((p.from / FPS) * 1000)}[a${i}]`).join(';');
args.push('-filter_complex', `${f};${parts.map((_, i) => `[a${i}]`).join('')}amix=inputs=${parts.length}:normalize=0,apad,atrim=0:30[v]`, '-map', '[v]', '-ar', '48000', 'public/audio/voice.wav');
execFileSync('ffmpeg', args, {stdio: 'inherit'});
console.log('→ public/audio/voice.wav + alignment.json');
