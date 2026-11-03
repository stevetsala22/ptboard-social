# Reel 02 — "Cronometro alla mano"

Formato: 1080×1920, 30fps, **27,5s** · Voce IT (Kokoro `im_nicola`, velocità 1,2) · stile scuro come l'app
Sorgente dei tempi: `src/timeline.ts`. Tempi parola: `public/audio/alignment.json`.

> Stato: **montato** — `reel.mp4` (voce + musica + effetti) e `reel-voce.mp4`, −14 LUFS · copertina `cover.jpg`.
>
> ⚠ Come il reel-01: la clip cliente è registrata con la `share.html` corretta (timer di recupero).
> **Pubblicare solo dopo il merge del fix** (repo ptboard, branch `claude/elegant-shannon-w1jmn0`).

## Perché dovrebbe funzionare meglio del reel-01
- **Hook a domanda** che coinvolge il PT ("Quanto ci metti…?") invece di descrivere un problema.
- **Prova, non promessa**: registrazione reale senza tagli, con un cronometro grande che mostra il tempo REALE
  (dal tocco su "⚡ Valutazione rapida" alla notifica "Scheda generata": **16,9 s**, ritmo di digitazione umano, `PACE=1.8`).
  Il video scorre ×2,5 (indicato a schermo), il cronometro no.
- **Payoff** netto: STOP + "SCHEDA PRONTA" a metà video, poi le prove in rapida successione.
- CTA più concreta: "15 giorni · nessuna carta di credito" (dalla landing; `TRIAL_DAYS=15`).
- Più corto (27,5s), tagli più frequenti, effetti sonori su tick / stop / tagli.

## Voce
| # | Frame | Testo |
|---|---|---|
| 1 | 4–78 | Quanto ci metti a fare una scheda su misura? |
| 2 | 81–125 | Cronometro alla mano. |
| 3 | 138–238 | Dati del cliente, obiettivo, screening PAR-Q… |
| 4 | 300–328 | e genera. |
| 5 | 336–382 | Diciassette secondi. |
| 6 | 393–569 | Su misura per obiettivo, livello e limitazioni, con linee guida NSCA e ACSM. |
| 7 | 576–680 | PDF in un tap. E il cliente la apre dal telefono. |
| 8 | 687–821 | PT Board. Provalo gratis per quindici giorni: link in bio. |

## Scene
| Scena | Tempo (s) | Contenuto |
|---|---|---|
| hook | 0,0–4,1 | Domanda cinetica, cronometro fermo "PRONTI…" → "VIA!", "Registrazione reale · nessun taglio" |
| race | 4,1–11,0 | App reale ×2,5, cronometro in tempo reale, spunte Anagrafica / Obiettivo / PAR-Q+ |
| stop | 11,0–13,0 | STOP 00:16,9 + timbro "SCHEDA PRONTA" (notifica dell'app sullo sfondo) |
| scheda | 13,0–19,0 | Scheda generata (scroll) + etichette Obiettivo / Livello / Limitazioni / NSCA · ACSM sulle parole |
| pdf | 19,0–20,6 | Anteprima PDF |
| client | 20,6–22,6 | Link cliente: ✓ serie → timer di recupero |
| cta | 22,6–27,5 | Logo, Provalo gratis, 15 giorni · nessuna carta di credito |

## Come si rifà
Stessa pipeline del reel-01 (`node_modules` e `.kokoro` sono link a `../reel-01`):
1. `SHARE_HTML=<ptboard>/share.html PACE=1.8 CDN_MIRROR=<mirror> node --env-file=.env scripts/record.mjs`
2. **Aggiornare in `src/Reel.tsx`** `T_START` (= `pt:start`), `T_STOP` (= `pt:toast`), `RACE_SRC` e i `startSec` delle scene da `public/clips/markers.json`;
   se cambia il tempo, aggiornare la frase 5 ("Diciassette secondi") e la caption.
3. `.kokoro/venv/bin/python -I scripts/voice-kokoro.py im_nicola 1.2`
4. `.kokoro/venv/bin/python -I scripts/music.py` → `music.wav` + `sfx.wav` (tick sincronizzati al cronometro)
5. `npm run render` · `scripts/mix.sh public/audio/music.wav` · copertina: `npx remotion still src/index.ts Cover cover.jpg`

## Note di contenuto
- Il tempo mostrato è quello della registrazione (account di test, dati demo, ritmo umano simulato): la caption lo dichiara.
  Non si promette che "ogni scheda" richieda 17 secondi; l'app stessa dice "8 campi, meno di 5 minuti".
- Solo funzioni reali; nessun numero di utenti o testimonianza.
