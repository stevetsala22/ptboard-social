// Reel 02 — "Cronometro alla mano". Frame a 30fps.
// DURATION letto anche da scripts/voice-kokoro.py, scripts/mix.sh, scripts/music.py
export const DURATION = 825;

export type Scene = {id: string; from: number; to: number};
export const SCENES: Scene[] = [
  {id: 'hook', from: 0, to: 123}, //      "Quanto ci metti a fare una scheda su misura? Cronometro alla mano."
  {id: 'race', from: 123, to: 330}, //    registrazione reale accelerata, cronometro in tempo reale
  {id: 'stop', from: 330, to: 390}, //    "Diciassette secondi."
  {id: 'scheda', from: 390, to: 570}, //  "Su misura per obiettivo, livello e limitazioni…"
  {id: 'pdf', from: 570, to: 618}, //     "PDF in un tap."
  {id: 'client', from: 618, to: 678}, //  "E il cliente la apre dal telefono."
  {id: 'cta', from: 678, to: 825},
];

export type Line = {text: string; from: number; to: number};
export const LINES: Line[] = [
  {text: 'Quanto ci metti a fare una scheda su misura?', from: 4, to: 78},
  {text: 'Cronometro alla mano.', from: 81, to: 125},
  {text: 'Dati del cliente, obiettivo, screening PAR-Q…', from: 138, to: 238},
  {text: 'e genera.', from: 300, to: 328},
  {text: 'Diciassette secondi.', from: 336, to: 382},
  {text: 'Su misura per obiettivo, livello e limitazioni, con linee guida NSCA e ACSM.', from: 393, to: 569},
  {text: 'PDF in un tap. E il cliente la apre dal telefono.', from: 576, to: 680},
  {text: 'PT Board. Provalo gratis per quindici giorni: link in bio.', from: 687, to: 821},
];
