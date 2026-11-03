// Timeline unica: scene (tagli) + frasi della voce. Frame a 30fps.
// I tempi delle parole sono stimati; quando c'è la voce vera vengono sostituiti
// dagli allineamenti esportati in public/audio/alignment.json (vedi scripts/voice.mjs).

export type Scene = {id: string; from: number; to: number};

export const SCENES: Scene[] = [
  {id: 'hook-clock', from: 0, to: 45},
  {id: 'hook-excel', from: 45, to: 90},
  {id: 'problem-stack', from: 90, to: 180},
  {id: 'problem-hours', from: 180, to: 240},
  {id: 'app-eval-a', from: 240, to: 330},
  {id: 'app-eval-b', from: 330, to: 420},
  {id: 'app-generate', from: 420, to: 495},
  {id: 'app-scheda', from: 495, to: 585},
  {id: 'app-pdf', from: 585, to: 660},
  {id: 'client-timer', from: 660, to: 735},
  {id: 'client-log', from: 735, to: 810},
  {id: 'cta', from: 810, to: 900},
];

export type Line = {text: string; from: number; to: number};

export const LINES: Line[] = [
  {text: 'Undici di sera. E tu sei ancora su Excel a fare schede?', from: 6, to: 86},
  {text: 'Anamnesi, test, schede, PDF da mandare… ore perse ogni settimana.', from: 96, to: 236},
  {text: 'Con PT Board fai la valutazione in pochi minuti.', from: 252, to: 405},
  {text: 'E la scheda si crea da sola: su misura per obiettivo, livello e limitazioni.', from: 424, to: 545},
  {text: 'Basata su linee guida NSCA e ACSM. Pronta in PDF.', from: 548, to: 655},
  {text: 'Il tuo cliente la riceve con un link: timer di recupero e storico degli allenamenti.', from: 664, to: 805},
  {text: 'PT Board. Provalo gratis: link in bio.', from: 816, to: 895},
];
