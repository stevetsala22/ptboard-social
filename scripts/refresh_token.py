"""Rinnovo del token long-lived e controllo scadenza.

  python3 scripts/refresh_token.py --check   # giorni alla scadenza (da token-meta.json)
  python3 scripts/refresh_token.py           # rinnova, salva in .env (gitignored), aggiorna token-meta.json

Il token non viene mai stampato per intero.
"""
import json
import sys
import time
from datetime import datetime, timezone

import ig

META = ig.ROOT / "token-meta.json"


def check():
    if not META.exists():
        print("Nessuna scadenza registrata: esegui un rinnovo una volta per inizializzarla.")
        return
    exp = json.loads(META.read_text())["expires_at"]
    days = (exp - time.time()) / 86400
    when = datetime.fromtimestamp(exp, timezone.utc).strftime("%Y-%m-%d")
    print(f"Token in scadenza il {when} (tra {days:.0f} giorni).")
    if days < 10:
        print("ATTENZIONE: rinnova ora.")


def refresh():
    old = ig.get_token()
    res = ig.get("refresh_access_token", {"grant_type": "ig_refresh_token"}, token=old)
    new, expires_in = res["access_token"], int(res.get("expires_in", 0))
    env = ig.ROOT / ".env"
    lines = [l for l in (env.read_text().splitlines() if env.exists() else []) if not l.startswith("IG_ACCESS_TOKEN=")]
    lines.append(f"IG_ACCESS_TOKEN={new}")
    env.write_text("\n".join(lines) + "\n")
    META.write_text(json.dumps({"expires_at": int(time.time()) + expires_in, "refreshed_at": int(time.time())}, indent=2))
    print(f"Token rinnovato ({ig.mask(new)}), valido {expires_in // 86400} giorni. Salvato in .env.")
    if new != old:
        print("Il token e' cambiato: aggiorna IG_ACCESS_TOKEN nelle impostazioni dell'ambiente.")


if __name__ == "__main__":
    check() if "--check" in sys.argv else refresh()
