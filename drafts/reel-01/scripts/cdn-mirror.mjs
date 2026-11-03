// Serve le librerie CDN dell'app da node_modules quando la rete blocca unpkg/jsdelivr/gstatic.
// Blocca anche analytics/chat (Sentry, GA4, Pixel, Crisp): niente bolla chat né tracking nelle registrazioni.
// Attivo solo se CDN_MIRROR=<cartella con node_modules> è impostato.
import fs from 'node:fs';
import path from 'node:path';

const MAP = [
  [/unpkg\.com\/react@[^/]+\/umd\/react\.production\.min\.js/, 'react/umd/react.production.min.js'],
  [/unpkg\.com\/react-dom@[^/]+\/umd\/react-dom\.production\.min\.js/, 'react-dom/umd/react-dom.production.min.js'],
  [/unpkg\.com\/@babel\/standalone@[^/]+\/babel\.min\.js/, '@babel/standalone/babel.min.js'],
  [/cdn\.jsdelivr\.net\/npm\/chart\.js@[^/]+\/dist\/chart\.umd\.min\.js/, 'chart.js/dist/chart.umd.js'],
  [/cdn\.jsdelivr\.net\/npm\/@emailjs\/browser@[^/]+\/dist\/email\.min\.js/, '@emailjs/browser/dist/email.min.js'],
  [/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[\w-]+-compat\.js)/, (m) => 'firebase/' + m[1]],
];
const BLOCK = /sentry-cdn\.com|sentry\.io|googletagmanager\.com|google-analytics\.com|facebook\.(com|net)|connect\.facebook|crisp\.chat/;

export async function mirrorCdn(ctx) {
  const root = process.env.CDN_MIRROR;
  if (!root) return;
  await ctx.route(BLOCK, (r) => r.abort());
  await ctx.route(/unpkg\.com|cdn\.jsdelivr\.net|gstatic\.com\/firebasejs/, (r) => {
    const url = r.request().url();
    for (const [re, rel] of MAP) {
      const m = url.match(re);
      if (!m) continue;
      const file = path.join(root, 'node_modules', typeof rel === 'function' ? rel(m) : rel);
      return r.fulfill({status: 200, contentType: 'application/javascript', body: fs.readFileSync(file)});
    }
    console.warn('CDN non mappato:', url);
    return r.abort();
  });
}
