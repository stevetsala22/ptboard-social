// Registrazioni reali dell'app (scripts/record.mjs → public/clips/*.mp4, 780x1688 = 390x844 @2x).
// startSec: secondo di partenza nel file (vedi public/clips/markers.json); rate: velocità di riproduzione.
// zoom: keyframe {f: frame relativo alla scena, s: scala, x/y: punto focale in coordinate 390x844, ty: spostamento verticale in px video}
// taps: tocchi sintetici {f, x, y} — vuoti: i tocchi veri sono già impressi nella registrazione.

export type Zoom = {f: number; s: number; x: number; y: number; ty?: number};
export type Tap = {f: number; x: number; y: number};
export type Clip = {src?: string; startSec?: number; rate?: number; title: string; sub?: string; zoom: Zoom[]; taps: Tap[]};

export const CLIPS: Record<string, Clip> = {
  'app-eval-a': {src: 'clips/pt.mp4', startSec: 18.6, rate: 1.6, title: 'Valutazione rapida', zoom: [{f: 0, s: 1, x: 195, y: 422}, {f: 52, s: 1.3, x: 195, y: 260}], taps: []},
  'app-eval-b': {src: 'clips/pt.mp4', startSec: 24.4, rate: 2, title: 'In pochi minuti', zoom: [{f: 0, s: 1.15, x: 195, y: 360}, {f: 52, s: 1.25, x: 195, y: 460}], taps: []},
  'app-generate': {src: 'clips/pt.mp4', startSec: 28.4, rate: 1.2, title: 'Si crea da sola', zoom: [{f: 0, s: 1.2, x: 195, y: 700}, {f: 58, s: 1.05, x: 195, y: 520}], taps: []},
  'app-scheda': {src: 'clips/pt.mp4', startSec: 33.9, rate: 0.8, title: 'Obiettivo · Livello · Limitazioni', zoom: [{f: 0, s: 1.15, x: 195, y: 420}, {f: 107, s: 1.25, x: 195, y: 450}], taps: []},
  'app-linee': {src: 'clips/pt.mp4', startSec: 36.75, rate: 0.75, title: 'Linee guida NSCA · ACSM', zoom: [{f: 0, s: 1.25, x: 195, y: 450}, {f: 99, s: 1.15, x: 195, y: 600}], taps: []},
  'app-pdf': {src: 'clips/pdf.mp4', startSec: 0, rate: 1, title: 'Pronta in PDF', zoom: [{f: 0, s: 1.15, x: 195, y: 330}, {f: 49, s: 1.4, x: 195, y: 380}], taps: []},
  'client-timer': {src: 'clips/client.mp4', startSec: 3.4, rate: 1.2, title: 'Timer di recupero', zoom: [{f: 0, s: 1.3, x: 195, y: 420}, {f: 26, s: 1.3, x: 195, y: 420}, {f: 45, s: 1.1, x: 195, y: 810, ty: -846}, {f: 105, s: 1.1, x: 195, y: 810, ty: -846}], taps: []},
  'client-log': {src: 'clips/client.mp4', startSec: 9, rate: 1.4, title: 'Storico allenamenti', zoom: [{f: 0, s: 1.1, x: 195, y: 500}, {f: 18, s: 1.15, x: 195, y: 740, ty: -692}, {f: 63, s: 1.15, x: 195, y: 740, ty: -692}], taps: []},
};
