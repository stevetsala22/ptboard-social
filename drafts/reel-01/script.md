# Reel 01 — "Ancora su Excel?"

Formato: 1080×1920, 30fps, **34,0s** · Voce IT (Kokoro `im_nicola`, velocità 1,15) · ~68 parole
Sorgente dei tempi: `src/timeline.ts` (scene + frasi). Tempi parola: `public/audio/alignment.json` (generato dalla voce).

> Stato: **montato** — `reel.mp4` (voce + musica) e `reel-voce.mp4` (solo voce), −14 LUFS / picco −0,9 dB.
> Allungato da 30 a 34s: a lettura naturale il testo occupa ~30s di solo parlato e non stava negli slot.
>
> ⚠ La scena "Timer di recupero" è registrata con la `share.html` corretta (fix nel repo ptboard, branch
> `claude/elegant-shannon-w1jmn0`): sul sito live il timer sparisce dopo 100ms.
> **Pubblicare il reel solo dopo il merge di quel fix.**

## Voce (frase per frase)

| # | Inizio | Fine | Testo |
|---|---|---|---|
| 1 | 0:00.2 | 0:04.0 | Undici di sera. E tu sei ancora su Excel a fare schede? |
| 2 | 0:04.3 | 0:09.7 | Anamnesi, test, schede, PDF da mandare… ore perse ogni settimana. |
| 3 | 0:10.0 | 0:13.1 | Con PT Board fai la valutazione in pochi minuti. |
| 4 | 0:13.5 | 0:18.6 | E la scheda si crea da sola: su misura per obiettivo, livello e limitazioni. |
| 5 | 0:19.0 | 0:23.6 | Basata su linee guida NSCA e ACSM. Pronta in PDF. |
| 6 | 0:23.9 | 0:29.0 | Il tuo cliente la riceve con un link: timer di recupero e storico degli allenamenti. |
| 7 | 0:29.5 | 0:32.8 | PT Board. Provalo gratis: link in bio. |

Pronuncia: sigle e parole inglesi sono scritte "come si dicono" in `scripts/voice-kokoro.py` (`SAY`: Ècsel, Pi Ti Bòrd, pi di èffe, ènne èsse ci a…); i sottotitoli restano quelli scritti.

## Scene (tagli sulle parole)

| Scena | Tempo (s) | Contenuto | Titolo a schermo |
|---|---|---|---|
| hook-clock | 0,0–1,6 | Notte, orologio 22:59→23:00, batteria 3% | 23:00 |
| hook-excel | 1,6–4,3 | Foglio di calcolo che si riempie | ANCORA SU EXCEL? |
| problem-stack | 4,3–7,9 | Card Anamnesi / Test / Schede / PDF… che si accumulano | — |
| problem-hours | 7,9–10,0 | Orologio, settimana che si riempie di rosso | ORE PERSE |
| app-eval-a | 10,0–11,7 | REC app: ⚡ Valutazione rapida, anagrafica | Valutazione rapida |
| app-eval-b | 11,7–13,5 | REC app: obiettivo, PAR-Q+ | In pochi minuti |
| app-generate | 13,5–15,4 | REC app: "Genera scheda ⚡" → cliente creato | Si crea da sola |
| app-scheda | 15,4–19,0 | REC app: scheda generata (scroll) | Obiettivo · Livello · Limitazioni |
| app-linee | 19,0–22,3 | REC app: fine scheda, recuperi, Esporta PDF | Linee guida NSCA · ACSM |
| app-pdf | 22,3–23,9 | REC anteprima PDF | Pronta in PDF |
| client-timer | 23,9–27,4 | REC link cliente: peso/reps → ✓ → timer di recupero | Timer di recupero |
| client-log | 27,4–29,5 | REC link cliente: Salva seduta | Storico allenamenti |
| cta | 29,5–34,0 | Logo, PT Board, Provalo gratis, personaltrainerboard.com | — |

## Produzione — come si rifà
1. `cp .env.example .env` e compila (account di TEST; ElevenLabs solo se si usa quella voce).
2. Registrazioni app: `node --env-file=.env scripts/record.mjs` → `public/clips/pt.mp4`, `pdf.mp4`, `client.mp4` (780×1688, screencast @2x) + `markers.json`.
   - Rete che blocca i CDN: `scripts/cdn-setup.sh`, poi aggiungere `CDN_MIRROR=.cdn`.
   - Finché il fix del timer non è in produzione: aggiungere `SHARE_HTML=<repo ptboard>/share.html`.
   - Solo clip cliente (senza creare un altro cliente demo): `SHARE_URL=https://personaltrainerboard.com/s/…`.
3. Voce — Kokoro (usata): `scripts/kokoro-setup.sh`, poi `.kokoro/venv/bin/python -I scripts/voice-kokoro.py im_nicola 1.15` (alternativa: `if_sara`).
   ElevenLabs: `node --env-file=.env scripts/voice.mjs` (serve chiave valida + `ELEVENLABS_VOICE_ID`). Entrambe scrivono `public/audio/voice.wav` + `alignment.json`.
4. Clip in `src/clips.ts`: `startSec`/`rate` dai `markers.json` (**cambiano a ogni registrazione**), poi `npm run render`.
5. Musica: `.kokoro/venv/bin/python -I scripts/music.py` (base originale generata in codice, nessun diritto di terzi) oppure un brano in `public/audio/music.mp3`.
   Mix: `scripts/mix.sh public/audio/music.wav` → `reel.mp4` + `reel-voce.mp4`.

### Note (3 nov)
- Account di test (`PTB_TEST_EMAIL`) creato da Claude con "Crea account" (piano trial, email Brevo di benvenuto bloccata): contiene 5 clienti demo + un "Davide Conti" per ogni registrazione fatta.
- La chiave ElevenLabs dell'ambiente non è valida → voce con Kokoro-82M (Apache-2.0, uso commerciale consentito). Per una voce più naturale: rigenerare con ElevenLabs e rifare render + mix (tempi e sottotitoli si riallineano da soli).
- Bug trovato e corretto nel repo ptboard: il timer di recupero in `share.html` e `atleta.html` si nascondeva subito dopo essere comparso.

## Note di contenuto
- Solo funzioni reali: Valutazione rapida (in app: "8 campi, meno di 5 minuti"), generatore automatico con parametri NSCA/ACSM, Esporta PDF, link cliente con timer di recupero e "Salva seduta".
- La scheda del PT arriva al cliente via **link di condivisione** (`/s/…`), non via `atleta.html` (il collegamento PT↔atleta è ancora in Fase 3).
- Nessun numero di utenti, risultato o testimonianza. Nessun riferimento allo Spazio Palestra.
- Dati in video: solo account di test + clienti demo inventati.
