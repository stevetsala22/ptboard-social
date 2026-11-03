"""Pubblica UN post approvato. Da usare solo dopo l'"ok" esplicito su quel post.

  python3 scripts/publish.py approved/2026-11-10-titolo --confirm

La cartella deve contenere post.json:
  {"caption": "...", "images": ["01.png", ...], "alt_text": ["...", ...]}
1 immagine = post singolo, 2-10 = carosello.
"""
import json
import shutil
import subprocess
import sys
import time
import urllib.request
from datetime import datetime

import ig

POLL_SEC, PAGES_TIMEOUT, CONTAINER_TIMEOUT = 10, 600, 300


def git(*args):
    subprocess.run(["git", "-C", str(ig.ROOT), *args], check=True)


def upload_to_pages(folder, images):
    dest = ig.ROOT / "media" / folder.name
    dest.mkdir(parents=True, exist_ok=True)
    for img in images:
        shutil.copy2(folder / img, dest / img)
    branch = subprocess.run(["git", "-C", str(ig.ROOT), "branch", "--show-current"],
                            capture_output=True, text=True, check=True).stdout.strip()
    if branch != "main":
        sys.exit(f"Le immagini vanno pubblicate da main (ora sei su {branch}).")
    git("add", str(dest))
    git("commit", "-m", f"media: {folder.name}")
    git("push", "origin", "main")
    return [f"{ig.PAGES_BASE}/media/{folder.name}/{img}" for img in images]


def wait_online(urls):
    deadline = time.time() + PAGES_TIMEOUT
    pending = list(urls)
    while pending and time.time() < deadline:
        still = []
        for u in pending:
            try:
                with urllib.request.urlopen(urllib.request.Request(u, method="HEAD"), timeout=20) as r:
                    if r.status != 200:
                        still.append(u)
            except Exception:
                still.append(u)
        pending = still
        if pending:
            time.sleep(POLL_SEC)
    if pending:
        sys.exit(f"Immagini non ancora online su GitHub Pages: {pending}")


def wait_container(cid):
    deadline = time.time() + CONTAINER_TIMEOUT
    while time.time() < deadline:
        st = ig.get(cid, {"fields": "status_code"}).get("status_code")
        if st == "FINISHED":
            return
        if st in ("ERROR", "EXPIRED"):
            sys.exit(f"Container {cid} in stato {st}.")
        time.sleep(POLL_SEC)
    sys.exit(f"Container {cid} non pronto entro {CONTAINER_TIMEOUT}s.")


def create_containers(urls, caption, alts):
    def alt(i):
        return {"alt_text": alts[i]} if i < len(alts) and alts[i] else {}

    if len(urls) == 1:
        cid = ig.post("me/media", {"image_url": urls[0], "caption": caption, **alt(0)})["id"]
        wait_container(cid)
        return cid
    children = []
    for i, u in enumerate(urls):
        c = ig.post("me/media", {"image_url": u, "is_carousel_item": "true", **alt(i)})["id"]
        wait_container(c)
        children.append(c)
    cid = ig.post("me/media", {"media_type": "CAROUSEL", "children": ",".join(children), "caption": caption})["id"]
    wait_container(cid)
    return cid


def main():
    if len(sys.argv) < 2 or "--confirm" not in sys.argv:
        sys.exit(__doc__)
    folder = (ig.ROOT / sys.argv[1]).resolve()
    if folder.parent != (ig.ROOT / "approved").resolve():
        sys.exit("Si pubblicano solo cartelle dentro approved/.")
    post = json.loads((folder / "post.json").read_text())
    images, caption, alts = post["images"], post["caption"], post.get("alt_text", [])
    if not 1 <= len(images) <= 10:
        sys.exit("Servono da 1 a 10 immagini.")

    urls = upload_to_pages(folder, images)
    wait_online(urls)
    cid = create_containers(urls, caption, alts)
    media_id = ig.post("me/media_publish", {"creation_id": cid})["id"]
    link = ig.get(media_id, {"fields": "permalink"}).get("permalink", "")

    with open(ig.ROOT / "published.md", "a") as f:
        f.write(f"| {datetime.now():%Y-%m-%d %H:%M} | {folder.name} | {media_id} | {link} |\n")
    git("add", "published.md")
    git("commit", "-m", f"published: {folder.name}")
    git("push", "origin", "main")
    print(f"Pubblicato: {link}")


if __name__ == "__main__":
    main()
