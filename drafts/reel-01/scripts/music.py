"""Base musicale originale generata in codice (nessun sample, nessun diritto di terzi).
120 BPM, La minore (Am–F–C–G), cassa dritta, clap su 2 e 4, hi-hat in levare, basso a ottavi, pad con ducking.
Output: public/audio/music.wav (durata = DURATION di src/timeline.ts). Uso: .kokoro/venv/bin/python -I scripts/music.py
"""
import os, re
import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUR = int(re.search(r'DURATION = (\d+)', open(os.path.join(ROOT, 'src/timeline.ts')).read())[1]) / 30
SR, BPM = 48000, 120
BEAT = 60 / BPM
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def lp(x, f, o=2): b, a = butter(o, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def add(buf, x, t):
    i = int(t * SR); x = x[: max(0, len(buf) - i)]; buf[i : i + len(x)] += x
def note(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, n, det=0.0):
    t = np.arange(n) / SR
    return sum(2 * ((t * f * (1 + d)) % 1) - 1 for d in (-det, 0, det)) / 3

kick_t = np.arange(int(0.35 * SR)) / SR
kick = np.sin(2 * np.pi * (45 * kick_t + (120 - 45) / 30 * (1 - np.exp(-30 * kick_t)))) * np.exp(-kick_t * 9)
kick += 0.4 * np.exp(-kick_t * 200) * rng.standard_normal(len(kick_t)) * 0.3
clap_t = np.arange(int(0.25 * SR)) / SR
clap = bp(rng.standard_normal(len(clap_t)), 900, 3500) * np.exp(-clap_t * 18)
hat_t = np.arange(int(0.06 * SR)) / SR
hat = hp(rng.standard_normal(len(hat_t)), 7000) * np.exp(-hat_t * 70)

drums, bass, pad = np.zeros(N), np.zeros(N), np.zeros(N)
CHORDS = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [52, 55, 60]), (55, [55, 59, 62])]  # Am F C G
bar = 4 * BEAT
nbars = int(np.ceil(DUR / bar))
end_drums = DUR - 3.0  # finale: restano pad e basso
for b in range(nbars):
    root, ch = CHORDS[b % 4]
    t0 = b * bar
    for k in range(4):
        tb = t0 + k * BEAT
        if tb < end_drums:
            add(drums, kick * 0.9, tb)
            if k in (1, 3): add(drums, clap * 0.35, tb)
            add(drums, hat * (0.22 if b > 0 else 0.12), tb + BEAT / 2)
            if b >= 2: add(drums, hat * 0.08, tb + BEAT / 4); add(drums, hat * 0.08, tb + 3 * BEAT / 4)
    for k in range(8):  # basso a ottavi
        n = int(BEAT / 2 * SR * 0.9)
        x = lp(saw(note(root - 12), n, 0.003), 500) * np.minimum(1, np.arange(n) / 200) * np.exp(-np.arange(n) / SR * 4)
        add(bass, x * 0.5, t0 + k * BEAT / 2)
    n = int(bar * SR)
    env = np.minimum(1, np.arange(n) / (0.25 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.2 * SR))
    add(pad, lp(sum(saw(note(m), n, 0.006) for m in ch) / 3, 1800) * env * 0.35, t0)

# ducking del pad e del basso sulla cassa (pompa "sidechain")
phase = (t_all % BEAT) / BEAT
duck = np.where(t_all < end_drums, 0.45 + 0.55 * np.minimum(1, phase / 0.45), 1)
mix = drums + (bass + pad) * duck
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= 0.89 / np.max(np.abs(mix))
st = np.stack([mix, np.roll(mix, 24) * 0.98], axis=1)  # leggera apertura stereo
sf.write(os.path.join(ROOT, 'public/audio/music.wav'), st.astype(np.float32), SR, subtype='PCM_16')
print(f'→ public/audio/music.wav ({DUR:.0f}s, {BPM} BPM)')
