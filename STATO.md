# Stato del progetto social @ptboard

Ultimo aggiornamento: 2026-11-03

## Regole (da rispettare sempre)
- Niente viene pubblicato senza l'OK esplicito di Steve, post per post. Mai in background.
- Niente testimonianze, numeri di utenti o risultati inventati: solo funzioni reali dell'app.
- Le affermazioni scientifiche si fanno solo con fonti reali e verificabili (le stesse referenze della landing).
- Non promuovere lo Spazio Palestra finche' Steve non lo dice.
- Le sponsorizzate sono solo proposte (testo, target, budget): non vanno mai attivate.
- Lingua: italiano.
- Il token non va mai incollato in chat e non va mai committato.

## Fase 1 — Collegamento
- [x] Repo `ptboard-social` creato da Steve, con Pages su `main` / root.
- [x] Struttura e script (branch `setup/fase1`, da mergiare su `main` dopo l'OK di Steve).
- [ ] Rete della sessione: servono `graph.instagram.com`, `developers.facebook.com` e `stevetsala22.github.io` negli Allowed domains. Il cambio vale dalla nuova sessione.
- [ ] Verificare sulla documentazione Meta attuale: scope, endpoint, versione API, campo `alt_text`, limiti di pubblicazione.
- [ ] Guidare Steve, click per click, a creare l'app Meta, aggiungere l'account come tester, autorizzare e generare il token long-lived.
- [ ] Steve imposta `IG_ACCESS_TOKEN` come variabile d'ambiente.
- [ ] Test con `python3 scripts/test_connection.py` (sola lettura) e promemoria di rinnovo del token circa 10 giorni prima della scadenza.

## Fasi successive
Fase 2: strategia in `docs/STRATEGIA.md`, da far approvare a Steve.
Fase 3: calendario e bozze.
Fase 4: approvazione e pubblicazione.
Fase 5: report.
