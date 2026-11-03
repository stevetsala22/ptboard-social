"""Test di sola lettura: profilo + ultimi post. Non pubblica nulla."""
import json

import ig

PROFILE_FIELDS = "user_id,username,account_type,media_count,followers_count"
MEDIA_FIELDS = "id,caption,media_type,timestamp,permalink,like_count,comments_count"


def main():
    me = ig.get("me", {"fields": PROFILE_FIELDS})
    print("PROFILO")
    print(json.dumps(me, indent=2, ensure_ascii=False))
    media = ig.get("me/media", {"fields": MEDIA_FIELDS, "limit": 10})
    print("\nULTIMI POST")
    for m in media.get("data", []):
        cap = (m.get("caption") or "").splitlines()[0][:70] if m.get("caption") else ""
        print(f"- {m.get('timestamp','')[:10]} {m.get('media_type','')} "
              f"♥{m.get('like_count','?')} 💬{m.get('comments_count','?')} {m.get('permalink','')}  {cap}")


if __name__ == "__main__":
    main()
