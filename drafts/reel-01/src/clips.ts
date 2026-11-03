// Configurazione delle registrazioni reali (Playwright, viewport 390x844 @2x).
// src: file in public/clips/ (generato da scripts/record.mjs). Finché manca, la scena mostra un segnaposto.
// zoom: keyframe {f: frame relativo alla scena, s: scala, x/y: punto focale in coordinate 390x844}
// taps: tocchi evidenziati {f, x, y} in coordinate 390x844

export type Zoom = {f: number; s: number; x: number; y: number};
export type Tap = {f: number; x: number; y: number};
export type Clip = {src?: string; startSec?: number; title: string; sub?: string; zoom: Zoom[]; taps: Tap[]};

export const CLIPS: Record<string, Clip> = {
  'app-eval-a': {title: 'Valutazione rapida', zoom: [{f: 0, s: 1, x: 195, y: 422}, {f: 90, s: 1.25, x: 195, y: 300}], taps: [{f: 30, x: 195, y: 380}]},
  'app-eval-b': {title: 'In pochi minuti', zoom: [{f: 0, s: 1.3, x: 195, y: 350}, {f: 90, s: 1.05, x: 195, y: 500}], taps: [{f: 25, x: 120, y: 420}, {f: 55, x: 270, y: 520}]},
  'app-generate': {title: 'Si crea da sola', zoom: [{f: 0, s: 1, x: 195, y: 422}, {f: 75, s: 1.35, x: 195, y: 600}], taps: [{f: 18, x: 195, y: 700}]},
  'app-scheda': {title: 'Obiettivo · Livello · Limitazioni', sub: 'Linee guida NSCA · ACSM', zoom: [{f: 0, s: 1.2, x: 195, y: 250}, {f: 90, s: 1.2, x: 195, y: 650}], taps: []},
  'app-pdf': {title: 'Pronta in PDF', zoom: [{f: 0, s: 1, x: 195, y: 422}, {f: 75, s: 1.3, x: 195, y: 400}], taps: [{f: 15, x: 300, y: 160}]},
  'client-timer': {title: 'Timer di recupero', zoom: [{f: 0, s: 1, x: 195, y: 500}, {f: 75, s: 1.4, x: 195, y: 790}], taps: [{f: 12, x: 300, y: 420}]},
  'client-log': {title: 'Storico allenamenti', zoom: [{f: 0, s: 1.25, x: 195, y: 600}, {f: 75, s: 1.05, x: 195, y: 422}], taps: [{f: 20, x: 195, y: 780}]},
};
