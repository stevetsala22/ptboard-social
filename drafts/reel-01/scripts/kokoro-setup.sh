#!/usr/bin/env bash
# Voce alternativa a ElevenLabs: Kokoro-82M (Apache-2.0, uso commerciale consentito), offline.
# Scarica tutto da npm/PyPI (niente Hugging Face): pesi ONNX q8 da kokoro-q8-shards,
# voci italiane (if_sara, im_nicola) da kokoro-js, runtime + espeak-ng (it) da kokoro-onnx.
# Output in .kokoro/ (gitignored). Poi: .kokoro/venv/bin/python -I scripts/voice-kokoro.py
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .kokoro && cd .kokoro
npm pack --silent kokoro-q8-shards@1.0.0 kokoro-js@1.2.1 >/dev/null
mkdir -p shards kjs
tar xzf kokoro-q8-shards-1.0.0.tgz -C shards --strip-components=1
tar xzf kokoro-js-1.2.1.tgz -C kjs --strip-components=1
cat shards/kokoro-q8.part{0,1,2,3,4,5}.bin > model_quantized.onnx
echo "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478  model_quantized.onnx" | sha256sum -c -
[ -d venv ] || python3 -m venv venv
venv/bin/pip install -q kokoro-onnx==0.6.1 soundfile
venv/bin/python -I -c "
import numpy as np
np.savez('voices-it.npz', **{v: np.fromfile(f'kjs/voices/{v}.bin', dtype=np.float32).reshape(-1, 1, 256) for v in ['if_sara', 'im_nicola']})"
rm -rf shards kjs *.tgz
echo "✓ .kokoro pronto"
