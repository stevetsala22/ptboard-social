#!/usr/bin/env bash
# Scarica da npm le librerie che l'app carica da CDN (stesse versioni di index.html) in .cdn/
# Serve solo se la rete blocca unpkg/jsdelivr/gstatic. Poi: CDN_MIRROR=.cdn node --env-file=.env scripts/record.mjs
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .cdn && cd .cdn
[ -f package.json ] || echo '{"private":true}' > package.json
npm i --no-audit --no-fund react@18.3.1 react-dom@18.3.1 @babel/standalone@7.23.9 chart.js@4.4.0 firebase@10.7.0 @emailjs/browser@4
