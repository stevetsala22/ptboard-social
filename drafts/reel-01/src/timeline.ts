// Timeline unica: scene (tagli) + frasi della voce. Frame a 30fps.
// Le frasi seguono la durata naturale della voce; i tempi parola sono in
// public/audio/alignment.json (scripts/voice-kokoro.py o scripts/voice.mjs).

// Durata totale in frame (34s): letta anche da scripts/voice-kokoro.py e scripts/mix.sh
export const DURATION = 1020;

export type Scene = {id: string; from: number; to: number};

export const SCENES: Scene[] = [
  // tagli allineati alle parole della voce (public/audio/alignment.json)
  {id: 'hook-clock', from: 0, to: 48}, //          "Undici di sera."
  {id: 'hook-excel', from: 48, to: 129}, //        "E tu sei ancora su Excel…"
  {id: 'problem-stack', from: 129, to: 238}, //    "Anamnesi, test, schede, PDF…"
  {id: 'problem-hours', from: 238, to: 300}, //    "ore perse ogni settimana."
  {id: 'app-eval-a', from: 300, to: 352}, //       "Con PT Board fai la…"
  {id: 'app-eval-b', from: 352, to: 404}, //       "…valutazione in pochi minuti."
  {id: 'app-generate', from: 404, to: 462}, //     "E la scheda si crea da sola:"
  {id: 'app-scheda', from: 462, to: 569}, //       "su misura per obiettivo, livello e limitazioni."
  {id: 'app-linee', from: 569, to: 668}, //        "Basata su linee guida NSCA e ACSM."
  {id: 'app-pdf', from: 668, to: 717}, //          "Pronta in PDF."
  {id: 'client-timer', from: 717, to: 822}, //     "Il tuo cliente… timer di recupero"
  {id: 'client-log', from: 822, to: 885}, //       "e storico degli allenamenti."
  {id: 'cta', from: 885, to: 1020}, //             "PT Board. Provalo gratis: link in bio."
];

export type Line = {text: string; from: number; to: number};

export const LINES: Line[] = [
  {text: 'Undici di sera. E tu sei ancora su Excel a fare schede?', from: 6, to: 124},
  {text: 'Anamnesi, test, schede, PDF da mandare… ore perse ogni settimana.', from: 129, to: 295},
  {text: 'Con PT Board fai la valutazione in pochi minuti.', from: 300, to: 397},
  {text: 'E la scheda si crea da sola: su misura per obiettivo, livello e limitazioni.', from: 404, to: 563},
  {text: 'Basata su linee guida NSCA e ACSM. Pronta in PDF.', from: 569, to: 711},
  {text: 'Il tuo cliente la riceve con un link: timer di recupero e storico degli allenamenti.', from: 717, to: 873},
  {text: 'PT Board. Provalo gratis: link in bio.', from: 885, to: 987},
];
