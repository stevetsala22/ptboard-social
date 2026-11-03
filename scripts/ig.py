"""Client minimo per Instagram API with Instagram Login (solo stdlib)."""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Da confermare sulla documentazione Meta attuale prima del primo uso reale.
API_BASE = os.environ.get("IG_API_BASE", "https://graph.instagram.com")
API_VERSION = os.environ.get("IG_API_VERSION", "")  # es. "v23.0"; vuoto = non versionato

PAGES_BASE = os.environ.get("PAGES_BASE", "https://stevetsala22.github.io/ptboard-social")


def _load_dotenv():
    env_file = ROOT / ".env"
    if not env_file.exists():
        return {}
    out = {}
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def get_token():
    tok = os.environ.get("IG_ACCESS_TOKEN") or _load_dotenv().get("IG_ACCESS_TOKEN")
    if not tok:
        sys.exit("IG_ACCESS_TOKEN mancante: impostalo come variabile d'ambiente (o in .env in locale).")
    return tok


def mask(tok):
    return ("…" + tok[-4:]) if tok and len(tok) > 8 else "…"


def _url(path):
    path = path.lstrip("/")
    return f"{API_BASE}/{API_VERSION}/{path}" if API_VERSION else f"{API_BASE}/{path}"


def _request(method, path, params, token):
    params = dict(params or {})
    params["access_token"] = token
    data = None
    url = _url(path)
    if method == "GET":
        url += "?" + urllib.parse.urlencode(params)
    else:
        data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(url, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace").replace(token, mask(token))
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {body}") from None


def get(path, params=None, token=None):
    return _request("GET", path, params, token or get_token())


def post(path, params=None, token=None):
    return _request("POST", path, params, token or get_token())
