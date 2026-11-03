# ptboard-social

Asset e strumenti per l'account Instagram **@ptboard**.

GitHub Pages serve la cartella `media/`, cioe' le immagini dei post pubblicati.
L'API di Instagram richiede un URL pubblico per ogni immagine.

## Regola
Niente viene pubblicato senza l'OK esplicito di Steve, post per post.

## Struttura
- `drafts/AAAA-MM-GG-titolo/`: bozze (immagini, `post.json`, note).
- `approved/`: solo le bozze approvate.
- `media/`: immagini pubblicate, servite da GitHub Pages.
- `published.md`: registro dei post pubblicati (id e link).
- `scripts/`: client API, test, rinnovo token, pubblicazione.

## Token
`IG_ACCESS_TOKEN` va impostato come variabile d'ambiente, oppure in `.env` in locale.
`.env` e' escluso da git: non va mai committato.
Il token long-lived dura circa 60 giorni:
- `python3 scripts/refresh_token.py --check` controlla la scadenza;
- `python3 scripts/refresh_token.py` lo rinnova.

## Comandi
- `python3 scripts/test_connection.py`: legge profilo e ultimi post, senza pubblicare.
- `python3 scripts/publish.py approved/<cartella> --confirm`: pubblica un post approvato, solo dopo l'OK.
