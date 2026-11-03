#!/usr/bin/env bash
# Mix finale: voce pulita + musica con ducking -18dB sul parlato, loudness -14 LUFS / -1 dBTP.
# Uso: scripts/mix.sh [public/audio/music.mp3]
# Input:  out/video-raw.mp4 (render Remotion muto), public/audio/voice.wav, musica opzionale
# Output: reel.mp4 (voce+musica), reel-voce.mp4 (solo voce)
set -euo pipefail
cd "$(dirname "$0")/.."
VIDEO=out/video-raw.mp4
VOICE=public/audio/voice.wav
MUSIC=${1:-public/audio/music.mp3}
MUSIC_OFFSET=${MUSIC_OFFSET:-0}   # secondi da saltare nel brano per far cadere il drop sul taglio 0
# durata del reel in secondi, da src/timeline.ts (DURATION in frame a 30fps)
DUR=$(node -e 'const s=require("fs").readFileSync("src/timeline.ts","utf8");process.stdout.write(String(+s.match(/DURATION = (\d+)/)[1]/30))')
FADE_ST=$(node -e "process.stdout.write(String($DUR-1.4))")

# Pulizia voce (serve soprattutto per l'opzione "voce registrata al telefono")
VCLEAN="highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,equalizer=f=3500:t=q:w=1:g=2"

# Finestre di parlato dalla timeline → espressione di ducking con rampe (150ms in, 300ms out)
DUCK=$(node -e '
const s=require("fs").readFileSync("src/timeline.ts","utf8");
const L=[...s.matchAll(/text: \x27[^\x27]+\x27, from: (\d+), to: (\d+)\}/g)].map(m=>[m[1]/30,m[2]/30]).filter(([a,b])=>b-a<10);
const terms=L.map(([a,b])=>`clip((t-${(a-0.15).toFixed(2)})/0.15\\,0\\,1)*clip((${(b+0.3).toFixed(2)}-t)/0.3\\,0\\,1)`);
let e=terms[0]; for(const t of terms.slice(1)) e=`max(${e}\\,${t})`;
process.stdout.write(e);')
# -18 dB = 0.126 → attenuazione 0.874 quando c'è parlato
MDUCK="volume=eval=frame:volume='1-0.874*${DUCK}'"

loudnorm2() { # $1 = filtergraph input label chain file, two-pass loudnorm su file wav
  local in=$1 out=$2
  local j; j=$(ffmpeg -hide_banner -i "$in" -af loudnorm=I=-14:TP=-1:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  local mi mtp mlra mth off
  mi=$(echo "$j" | sed -n 's/.*"input_i" : "\(.*\)".*/\1/p'); mtp=$(echo "$j" | sed -n 's/.*"input_tp" : "\(.*\)".*/\1/p')
  mlra=$(echo "$j" | sed -n 's/.*"input_lra" : "\(.*\)".*/\1/p'); mth=$(echo "$j" | sed -n 's/.*"input_thresh" : "\(.*\)".*/\1/p')
  off=$(echo "$j" | sed -n 's/.*"target_offset" : "\(.*\)".*/\1/p')
  ffmpeg -y -loglevel error -i "$in" -af "loudnorm=I=-14:TP=-1:LRA=9:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true,aresample=48000" -c:a pcm_s16le "$out"
}

mkdir -p out
ffmpeg -y -loglevel error -i "$VOICE" -af "$VCLEAN,apad,atrim=0:$DUR" -ar 48000 out/voice-clean.wav

# Solo voce
loudnorm2 out/voice-clean.wav out/mix-voce.wav

# Voce + musica
if [ -f "$MUSIC" ]; then
  ffmpeg -y -loglevel error -i out/voice-clean.wav -ss "$MUSIC_OFFSET" -i "$MUSIC" -filter_complex \
    "[1:a]aresample=48000,atrim=0:$DUR,asetpts=N/SR/TB,volume=-8dB,$MDUCK,afade=t=out:st=$FADE_ST:d=1.4[m];[0:a][m]amix=inputs=2:normalize=0[o]" \
    -map "[o]" out/mix-pre.wav
  loudnorm2 out/mix-pre.wav out/mix-full.wav
else
  echo "⚠ Nessuna musica ($MUSIC): reel.mp4 non generato"
fi

mux() { ffmpeg -y -loglevel error -i "$VIDEO" -i "$1" -map 0:v -map 1:a -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 18 -r 30 -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$2"; }
mux out/mix-voce.wav reel-voce.mp4
[ -f out/mix-full.wav ] && mux out/mix-full.wav reel.mp4

for f in reel.mp4 reel-voce.mp4; do
  [ -f "$f" ] || continue
  echo "== $f"; ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,width,height,r_frame_rate -of compact "$f"
  ffmpeg -hide_banner -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
done
