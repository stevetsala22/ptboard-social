"""Voce con Kokoro-82M (offline). Stessi output di voice.mjs:
public/audio/voice.wav (30s, 48kHz) + public/audio/alignment.json (tempi parola in frame → sottotitoli).
Setup: scripts/kokoro-setup.sh   Uso: .kokoro/venv/bin/python -I scripts/voice-kokoro.py [voce] [velocità]

Tempi: ogni inciso (spezzato su , . : ? …) viene sintetizzato a parte → inizio/fine esatti;
dentro l'inciso le parole sono ripartite in proporzione ai fonemi.
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = os.path.join(ROOT, '.kokoro')
VOICE = sys.argv[1] if len(sys.argv) > 1 else 'im_nicola'
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.15
FPS, SR = 30, 24000
DUR = int(re.search(r'DURATION = (\d+)', open(os.path.join(ROOT, 'src/timeline.ts'), encoding='utf8').read())[1]) / FPS

# Grafia "parlata" per sigle e parole inglesi (il sottotitolo resta quello scritto)
SAY = {
    'excel': 'Ècsel', 'pt': 'Pi Ti', 'board': 'Bòrd', 'pdf': 'pi di èffe',
    'nsca': 'ènne èsse ci a', 'acsm': 'a ci èsse èmme', 'link': 'linc', 'bio': 'bàio',
}
PAUSE = {',': 0.10, ':': 0.16, '.': 0.24, '?': 0.24, '…': 0.22}

src = open(os.path.join(ROOT, 'src/timeline.ts'), encoding='utf8').read()
LINES = [dict(text=m[0], start=int(m[1]), end=int(m[2])) for m in re.findall(r"\{text: '([^']+)', from: (\d+), to: (\d+)\}", src)]

kk = Kokoro(os.path.join(K, 'model_quantized.onnx'), os.path.join(K, 'voices-it.npz'))

def spoken(w):
    core = re.sub(r'[^\wÀ-ÿ]', '', w)
    return SAY.get(core.lower(), core)

def synth(text, speed):
    a, sr = kk.create(text, voice=VOICE, speed=speed, lang='it', trim=True)
    assert sr == SR
    return a.astype(np.float32)

def nphon(text):
    try:
        return max(1, len(kk.tokenizer.phonemize(text, 'it').replace(' ', '')))
    except Exception:
        return max(1, len(text))

def build_line(line, speed):
    words = line['text'].split()
    clauses, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r'[,.:?…]$', w):
            clauses.append(cur); cur = []
    if cur: clauses.append(cur)
    audio, timed, t = [], [], 0.0
    for ci, cl in enumerate(clauses):
        a = synth(' '.join(spoken(w) for w in cl), speed)
        d = len(a) / SR
        weights = [nphon(spoken(w)) for w in cl]
        tot, acc = sum(weights), 0.0
        for w, wt in zip(cl, weights):
            timed.append((w, t + d * acc / tot, t + d * (acc + wt) / tot)); acc += wt
        audio.append(a); t += d
        if ci < len(clauses) - 1:
            p = PAUSE.get(cl[-1][-1], 0.06)
            audio.append(np.zeros(int(p * SR), np.float32)); t += p
    return np.concatenate(audio), timed

out = np.zeros(int(DUR * SR), np.float32)
words = []
for i, l in enumerate(LINES):
    slot = (l['end'] - l['start']) / FPS
    sp = SPEED
    a, timed = build_line(l, sp)
    while len(a) / SR > slot and sp < 1.3:  # non sfora mai lo slot: accelera un poco
        sp = round(sp + 0.05, 2)
        a, timed = build_line(l, sp)
    if len(a) / SR > slot:
        print(f'⚠ frase {i} lunga {len(a)/SR:.2f}s, slot {slot:.2f}s: allargare lo slot in timeline.ts')
    s0 = int(l['start'] / FPS * SR)
    a = a[: len(out) - s0]
    out[s0 : s0 + len(a)] += a
    for w, a0, a1 in timed:
        words.append(dict(w=w, **{'from': l['start'] + round(a0 * FPS), 'to': l['start'] + round(a1 * FPS)}))
    print(f'✓ {i}: {len(a)/SR:.2f}s / slot {slot:.2f}s (velocità {sp})')

os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
tmp = os.path.join(ROOT, 'out/voice-24k.wav')
sf.write(tmp, out, SR)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ar', '48000', os.path.join(ROOT, 'public/audio/voice.wav')], check=True)
json.dump({'voice': f'kokoro:{VOICE}', 'words': words}, open(os.path.join(ROOT, 'public/audio/alignment.json'), 'w'), ensure_ascii=False, indent=1)
print('→ public/audio/voice.wav + alignment.json')
