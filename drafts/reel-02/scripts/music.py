"""Musica + effetti originali generati in codice (nessun sample, nessun diritto di terzi).
Output: public/audio/music.wav (base, va in ducking sotto la voce) e public/audio/sfx.wav (effetti, non in ducking).
Sezioni e tempi da src/timeline.ts e src/Reel.tsx (cronometro). Uso: .kokoro/venv/bin/python -I scripts/music.py
"""
import os, re
import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = open(os.path.join(ROOT, 'src/timeline.ts')).read()
rl = open(os.path.join(ROOT, 'src/Reel.tsx')).read()
FPS = 30
DUR = int(re.search(r'DURATION = (\d+)', tl)[1]) / FPS
SC = {m[0]: (int(m[1]) / FPS, int(m[2]) / FPS) for m in re.findall(r"\{id: '([\w-]+)', from: (\d+), to: (\d+)\}", tl)}
num = lambda k: float(re.search(rf'const {k} = ([\d.]+)', rl)[1])
T_START, T_STOP, RACE_SRC, RACE_RATE = num('T_START'), num('T_STOP'), num('RACE_SRC'), num('RACE_RATE')

SR, BPM = 48000, 120
BEAT = 60 / BPM
N = int(DUR * SR)
rng = np.random.default_rng(11)
t_all = np.arange(N) / SR

def lp(x, f, o=2): b, a = butter(o, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def add(buf, x, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]; buf[i : i + len(x)] += x * g
def note(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, n, det=0.0):
    t = np.arange(n) / SR
    return sum(2 * ((t * f * (1 + d)) % 1) - 1 for d in (-det, 0, det)) / 3
def env_t(sec): return np.arange(int(sec * SR)) / SR

kt = env_t(0.35)
kick = np.sin(2 * np.pi * (45 * kt + (130 - 45) / 28 * (1 - np.exp(-28 * kt)))) * np.exp(-kt * 9)
ct = env_t(0.25); clap = bp(rng.standard_normal(len(ct)), 900, 3800) * np.exp(-ct * 17)
ht = env_t(0.06); hat = hp(rng.standard_normal(len(ht)), 7500) * np.exp(-ht * 70)

hook0, hook1 = SC['hook']; race0, race1 = SC['race']; stop0, stop1 = SC['stop']; cta0, cta1 = SC['cta']
drums, bass, pad = np.zeros(N), np.zeros(N), np.zeros(N)
CH = [(57, [57, 60, 64, 69]), (53, [53, 57, 60, 65]), (48, [52, 55, 60, 64]), (55, [55, 59, 62, 67])]
bar = 4 * BEAT
for b in range(int(np.ceil(DUR / bar))):
    root, ch = CH[b % 4]; t0 = b * bar
    n = int(bar * SR)
    e = np.minimum(1, np.arange(n) / (0.3 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.2 * SR))
    add(pad, lp(sum(saw(note(m), n, 0.007) for m in ch) / 4, 2200) * e, t0, 0.32)
    for k in range(4):
        tb = t0 + k * BEAT
        full = (race0 <= tb < stop0) or (stop1 <= tb < cta1 - 1.0)
        light = hook0 <= tb < hook1
        if full:
            add(drums, kick, tb, 0.95)
            if k in (1, 3): add(drums, clap, tb, 0.38)
            add(drums, hat, tb + BEAT / 2, 0.22)
            add(drums, hat, tb + BEAT / 4, 0.08); add(drums, hat, tb + 3 * BEAT / 4, 0.08)
        elif light:
            add(drums, hat, tb + BEAT / 2, 0.12)
    for k in range(8):
        tb = t0 + k * BEAT / 2
        if (race0 <= tb < stop0) or (stop1 <= tb < cta1 - 1.0):
            n2 = int(BEAT / 2 * SR * 0.9)
            x = lp(saw(note(root - 12), n2, 0.003), 520) * np.minimum(1, np.arange(n2) / 200) * np.exp(-np.arange(n2) / SR * 4)
            add(bass, x, tb, 0.55)

phase = (t_all % BEAT) / BEAT
pump = ((t_all >= race0) & (t_all < stop0)) | ((t_all >= stop1) & (t_all < cta1 - 1.0))
duck = np.where(pump, 0.45 + 0.55 * np.minimum(1, phase / 0.45), 1)
# nell'hook il pad è filtrato e cresce; nello stop resta solo il pad
hook_mask = t_all < hook1
pad_h = lp(pad, 700)
pad = np.where(hook_mask, pad_h * np.clip(t_all / hook1, 0.3, 1), pad)
music = drums + (bass + pad) * duck
fin = int((cta1 - 1.0) * SR)  # accordo finale lungo
add(music, lp(sum(saw(note(m), int(1.0 * SR), 0.007) for m in [57, 64, 69, 72]) / 4, 2500) * np.exp(-env_t(1.0) * 2.5), cta1 - 1.0, 0.5)

# ── effetti ──
sfx = np.zeros(N)
def riser(t_end, dur):
    t = env_t(dur)
    noise = rng.standard_normal(len(t))
    x = np.concatenate([bp(noise[i:i + 2400], 300 + 6000 * (i / len(t)) ** 2, 800 + 9000 * (i / len(t)) ** 2) for i in range(0, len(t), 2400)])[: len(t)]
    add(sfx, x * (t / dur) ** 2, t_end - dur, 0.5)
def impact(t):
    e = env_t(0.9)
    x = np.sin(2 * np.pi * (38 * e + 60 / 14 * (1 - np.exp(-14 * e)))) * np.exp(-e * 4) + lp(rng.standard_normal(len(e)), 1200) * np.exp(-e * 10) * 0.6
    add(sfx, x, t, 0.9)
def tick(t, g=0.35):
    e = env_t(0.03); add(sfx, bp(rng.standard_normal(len(e)), 2500, 6000) * np.exp(-e * 220), t, g)
def ding(t):
    e = env_t(2.0); add(sfx, sum(np.sin(2 * np.pi * f * e) * a for f, a in [(1568, 1), (3136, 0.35), (4704, 0.12)]) * np.exp(-e * 2.2), t, 0.45)
def pop(t):
    e = env_t(0.12); add(sfx, np.sin(2 * np.pi * (500 + 900 * e / 0.12) * e) * np.exp(-e * 35), t, 0.4)
def whoosh(t):
    e = env_t(0.45); w = np.sin(np.pi * e / 0.45) ** 2
    add(sfx, bp(rng.standard_normal(len(e)), 500, 5000) * w, t - 0.2, 0.35)

riser(race0, 1.2); impact(race0)
for k in range(int(T_STOP - T_START) + 1):  # un tick per ogni secondo REALE del cronometro
    t = race0 + (k + T_START - RACE_SRC) / RACE_RATE
    if t < stop0: tick(t)
riser(stop0, 1.0); impact(stop0); ding(stop0)
s0 = SC['scheda'][0]
for f in (29, 51, 71, 124): pop(s0 + f / FPS)
for k in ('pdf', 'client', 'cta'): whoosh(SC[k][0])
impact(cta0)

def norm(x, peak): return x * (peak / max(1e-9, np.max(np.abs(x))))
music = np.tanh(music * 1.2) / np.tanh(1.2)
st = lambda x: np.stack([x, np.roll(x, 24) * 0.98], axis=1).astype(np.float32)
sf.write(os.path.join(ROOT, 'public/audio/music.wav'), st(norm(music, 0.89)), SR, subtype='PCM_16')
sf.write(os.path.join(ROOT, 'public/audio/sfx.wav'), st(norm(sfx, 0.89)), SR, subtype='PCM_16')
print(f'→ music.wav + sfx.wav ({DUR:.1f}s)')
