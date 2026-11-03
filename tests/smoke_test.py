"""
End-to-end API smoke test. Start the server first, then:

    python tests/smoke_test.py http://localhost:8000 [DATA_DIR]

Pass the server's DATA_DIR (with SMTP unset) to also test the email flows via the outbox.

Uses only the standard library.
"""
import email
import email.policy
import http.cookiejar
import json
import pathlib
import re
import secrets
import sys
import time
import urllib.error
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip("/")
OUTBOX = pathlib.Path(sys.argv[2]) / "outbox" if len(sys.argv) > 2 else None
results = []


class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        # ProxyHandler({}) bypasses system/corporate proxies for local testing.
        self.opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPCookieProcessor(self.jar),
        )

    def call(self, method, path, body=None, raw=None, content_type="application/json", headers=None):
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        req = urllib.request.Request(BASE + path, data=data, method=method)
        req.add_header("X-Requested-With", "fetch")
        if data is not None:
            req.add_header("Content-Type", content_type)
        for k, v in (headers or {}).items():
            req.add_header(k, v)
        try:
            with self.opener.open(req, timeout=15) as res:
                payload = res.read()
                status = res.status
                ctype = res.headers.get("Content-Type", "")
        except urllib.error.HTTPError as err:
            payload = err.read()
            status = err.code
            ctype = err.headers.get("Content-Type", "")
        if "json" in ctype:
            return status, json.loads(payload or b"{}")
        return status, payload


def check(name, condition, detail=""):
    results.append((name, bool(condition)))
    mark = "PASS" if condition else "FAIL"
    print(f"[{mark}] {name}" + (f"  -> {detail}" if detail and not condition else ""))


def latest_email_to(address, since):
    """Return the text of the newest outbox email for `address` written after `since`."""
    for _ in range(20):
        if OUTBOX.exists():
            for path in sorted(OUTBOX.glob("*.eml"), reverse=True):
                if path.stat().st_mtime < since:
                    continue
                message = email.message_from_bytes(path.read_bytes(), policy=email.policy.default)
                if message["To"] == address:
                    return str(message["Subject"]), message.get_body(preferencelist=("plain",)).get_content()
        time.sleep(0.2)
    return None, ""


def main():
    owner = Client()
    other = Client()
    anon = Client()
    email = f"test-{secrets.token_hex(4)}@example.com"

    status, data = owner.call("POST", "/api/auth/register", {"email": email, "password": "rahasia123", "name": "Tester"})
    check("register", status == 201, data)
    status, data = owner.call("GET", "/api/auth/me")
    check("session cookie works", status == 200 and data["user"]["email"] == email, data)

    status, _ = anon.call("POST", "/api/auth/login", {"email": email, "password": "wrong-password"})
    check("wrong password rejected", status == 401)

    # CSRF: missing X-Requested-With must be rejected
    req = urllib.request.Request(BASE + "/api/invitations", data=b"{}", method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        owner.opener.open(req, timeout=10)
        csrf_status = 200
    except urllib.error.HTTPError as err:
        csrf_status = err.code
    check("CSRF header required", csrf_status == 403, csrf_status)

    slug = f"test-{secrets.token_hex(3)}"
    config = {
        "theme": "navy",
        "couple": {"groom": {"nickname": "Budi", "photo": "javascript:alert(1)"}, "bride": {"nickname": "Sari"}},
        "weddingDate": "2027-05-01T09:00:00+07:00",
        "events": [{"title": {"id": "Akad"}, "start": "2027-05-01T09:00:00+07:00", "mapsUrl": "javascript:alert(1)"}],
        "rsvp": {"enabled": True, "defaultPax": 3},
        "dressCode": {"colors": ["#fff", "red;background:url(x)"]},
        "admin": {"waTemplate": "secret template"},
    }
    status, data = owner.call("POST", "/api/invitations", {"slug": slug, "config": config})
    check("create invitation", status == 201, data)
    inv_id = data["invitation"]["id"]

    status, data = owner.call("POST", "/api/invitations", {"slug": slug, "config": config})
    check("duplicate slug rejected", status == 409, data)
    status, data = owner.call("POST", "/api/invitations", {"slug": "api", "config": config})
    check("reserved slug rejected", status == 400, data)

    status, data = owner.call("GET", f"/api/invitations/{inv_id}")
    cfg = data["config"]
    check("javascript: URLs stripped", cfg["couple"]["groom"]["photo"] == "" and cfg["events"][0]["mapsUrl"] == "", cfg)
    check("bad colors stripped", cfg["dressCode"]["colors"] == ["#fff"], cfg["dressCode"])

    status, _ = anon.call("GET", f"/api/public/{slug}")
    check("unpublished hidden from public", status == 404, status)
    status, _ = owner.call("GET", f"/api/public/{slug}")
    check("owner can preview unpublished", status == 200, status)

    status, data = owner.call("PUT", f"/api/invitations/{inv_id}", {"published": True})
    check("publish", status == 200 and data["published"], data)

    status, data = anon.call("GET", f"/api/public/{slug}")
    check("public can view published", status == 200, data)
    check("admin settings not exposed publicly", "admin" not in data.get("config", {}), data.get("config", {}).keys())

    # other user must not access
    other.call("POST", "/api/auth/register", {"email": f"o-{secrets.token_hex(4)}@example.com", "password": "rahasia123", "name": "Other"})
    status, _ = other.call("GET", f"/api/invitations/{inv_id}")
    check("other user cannot read invitation", status == 404, status)
    status, _ = other.call("PUT", f"/api/invitations/{inv_id}", {"published": False})
    check("other user cannot edit invitation", status == 404, status)

    # guests
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/guests", {"guests": [
        {"name": "Bapak Joko & Keluarga", "phone": "0812-3456-7890", "pax": 4, "group": "Keluarga"},
        {"name": "Rina", "phone": "81298765432"},
        {"name": "=HYPERLINK(\"x\")", "phone": ""},
    ]})
    check("bulk add guests", status == 201 and data["created"] == 3, data)
    status, data = owner.call("GET", f"/api/invitations/{inv_id}/guests")
    guests = {g["name"]: g for g in data["guests"]}
    joko = guests["Bapak Joko & Keluarga"]
    check("phone normalised to 62...", joko["phone"] == "6281234567890" and guests["Rina"]["phone"] == "6281298765432", joko)
    check("default pax from config", guests["Rina"]["pax"] == 3, guests["Rina"])

    status, data = anon.call("GET", f"/api/public/{slug}?g={joko['code']}")
    check("personal link resolves guest", data.get("guest", {}).get("name") == joko["name"], data.get("guest"))

    status, _ = anon.call("POST", f"/api/public/{slug}/open", {"guestCode": joko["code"]})
    owner.call("POST", f"/api/public/{slug}/open", {"guestCode": joko["code"]})   # owner preview must not count
    status, data = owner.call("GET", f"/api/invitations/{inv_id}/guests")
    joko_now = next(g for g in data["guests"] if g["id"] == joko["id"])
    check("open tracked once (owner excluded)", joko_now["openedAt"] and joko_now["openCount"] == 1 and data["stats"]["opened"] == 1, joko_now)

    status, page = anon.call("GET", f"/i/{slug}?g={joko['code']}")
    page_text = page.decode() if isinstance(page, bytes) else ""
    check("invite page renders with OG tags", status == 200 and "og:title" in page_text and "Budi &amp; Sari" in page_text, status)
    check("guest name in link preview", "Kepada Yth. Bapak Joko &amp; Keluarga" in page_text)

    # RSVP via personal link, pax capped at 4
    status, data = anon.call("POST", f"/api/public/{slug}/rsvp", {
        "name": "Joko", "attendance": "yes", "guests": 9, "message": "Selamat ya!", "guestCode": joko["code"]})
    check("RSVP with guest code", status == 200 and data["code"] == joko["code"] and data["guests"] == 4, data)
    status, data = anon.call("POST", f"/api/public/{slug}/rsvp", {
        "name": "Joko", "attendance": "maybe", "guests": 2, "message": "Diusahakan", "guestCode": joko["code"]})
    check("RSVP update (no duplicate)", status == 200 and data["attendance"] == "maybe", data)

    # Anonymous RSVP via generic link creates a guest record
    status, data = anon.call("POST", f"/api/public/{slug}/rsvp", {"name": "Teman Kantor", "attendance": "yes", "guests": 2, "message": "<script>x</script>"})
    check("anonymous RSVP creates guest", status == 200 and len(data.get("code", "")) == 6, data)
    anon_code = data.get("code")

    status, data = anon.call("POST", f"/api/public/{slug}/rsvp", {"name": "", "attendance": "yes"})
    check("RSVP validation", status == 400, data)

    if OUTBOX:
        status, data = owner.call("GET", f"/api/invitations/{inv_id}")
        cfg = data["config"]
        cfg.setdefault("admin", {})["notifyEmail"] = True
        owner.call("PUT", f"/api/invitations/{inv_id}", {"config": cfg})
        started = time.time() - 1
        anon.call("POST", f"/api/public/{slug}/rsvp", {"name": "Rina", "attendance": "no", "message": "Maaf berhalangan", "guestCode": guests["Rina"]["code"]})
        subject, body = latest_email_to(email, started)
        check("owner notified of new RSVP by email", subject and "Rina" in subject and "Maaf berhalangan" in body, subject)
        cfg["admin"]["notifyEmail"] = False
        owner.call("PUT", f"/api/invitations/{inv_id}", {"config": cfg})

    status, data = anon.call("GET", f"/api/public/{slug}/wishes")
    expected_wishes = 3 if OUTBOX else 2
    check("wishes list", status == 200 and data["total"] == expected_wishes, data)

    status, data = owner.call("GET", f"/api/invitations/{inv_id}/rsvps")
    check("owner sees RSVPs", status == 200 and len(data["rsvps"]) == expected_wishes, data)
    stats = data["stats"]
    check("stats computed", stats["yes"] == 1 and stats["maybe"] == 1 and stats["pax"] == 2, stats)

    rsvp_id = next(r["id"] for r in data["rsvps"] if r["name"] == "Teman Kantor")
    owner.call("PUT", f"/api/invitations/{inv_id}/rsvps/{rsvp_id}", {"hidden": True})
    status, data = anon.call("GET", f"/api/public/{slug}/wishes")
    check("hidden wish removed from public", data["total"] == expected_wishes - 1, data)

    # Check-in via QR content
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/checkin", {"code": f"{anon_code}|Teman Kantor|2"})
    check("check-in lookup by QR content", status == 200 and not data["alreadyCheckedIn"], data)
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/checkin", {"code": anon_code, "confirm": True, "count": 2})
    check("check-in confirm", status == 200 and data["stats"]["checkedIn"] == 1 and data["stats"]["checkedInPax"] == 2, data)
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/checkin", {"code": anon_code})
    check("repeat check-in flagged", data.get("alreadyCheckedIn") is True, data)
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/checkin", {"code": "ZZZZZZ"})
    check("unknown code 404", status == 404, data)

    # Mark sent
    status, data = owner.call("PUT", f"/api/invitations/{inv_id}/guests/{joko['id']}", {"sent": True})
    check("mark guest sent", status == 200 and data["guest"]["sentAt"], data)

    # Upload: valid PNG + rejected text
    png = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                        "1f15c4890000000d49444154789c6360000002000154a24f9f0000000049454e44ae426082")
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/upload", raw=png, content_type="image/png")
    check("image upload", status == 201 and data["url"].startswith(f"/uploads/{inv_id}/"), data)
    upload_url = data.get("url", "")
    status, body = anon.call("GET", upload_url)
    check("uploaded file served", status == 200 and body[:4] == b"\x89PNG", status)
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/upload", raw=b"<html>evil</html>", content_type="image/png")
    check("non-image upload rejected", status == 400, data)
    status, data = other.call("POST", f"/api/invitations/{inv_id}/upload", raw=png, content_type="image/png")
    check("other user cannot upload", status == 404, data)

    # Video upload + HTTP Range (needed for seeking / iPhone playback)
    fake_mp4 = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom" + b"\x00" * 5000
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/upload", raw=fake_mp4, content_type="video/mp4")
    check("video upload accepted", status == 201 and data.get("kind") == "video" and data["url"].endswith(".mp4"), data)
    video_url = data.get("url", "")
    status, body = anon.call("GET", video_url, headers={"Range": "bytes=0-99"})
    check("video served with 206 range", status == 206 and len(body) == 100, (status, len(body) if isinstance(body, bytes) else body))
    heic = b"\x00\x00\x00\x18ftypheic" + b"\x00" * 100
    status, data = owner.call("POST", f"/api/invitations/{inv_id}/upload", raw=heic, content_type="image/heic")
    check("HEIC container rejected", status == 400, data)

    # Gallery accepts motion-photo objects; bad URLs inside them are stripped
    status, data = owner.call("GET", f"/api/invitations/{inv_id}")
    cfg = data["config"]
    cfg["gallery"] = [upload_url, {"src": upload_url, "video": video_url}, {"src": "javascript:x", "video": "ftp://x"}]
    owner.call("PUT", f"/api/invitations/{inv_id}", {"config": cfg})
    status, data = owner.call("GET", f"/api/invitations/{inv_id}")
    check("motion photo gallery item stored, junk dropped", data["config"]["gallery"] == [upload_url, {"src": upload_url, "video": video_url}], data["config"]["gallery"])

    # Song request (enabled) + couple reply + likes
    cfg = data["config"]
    cfg.setdefault("rsvp", {})["songRequests"] = True
    owner.call("PUT", f"/api/invitations/{inv_id}", {"config": cfg})
    status, data = anon.call("POST", f"/api/public/{slug}/rsvp", {
        "name": "Joko", "attendance": "yes", "guests": 2, "message": "Selamat!", "song": "Perfect – Ed Sheeran", "guestCode": joko["code"]})
    status, data = owner.call("GET", f"/api/invitations/{inv_id}/rsvps")
    joko_rsvp = next(r for r in data["rsvps"] if r["code"] == joko["code"])
    check("song request saved", joko_rsvp["song"] == "Perfect – Ed Sheeran", joko_rsvp)
    owner.call("PUT", f"/api/invitations/{inv_id}/rsvps/{joko_rsvp['id']}", {"reply": "Terima kasih Pak Joko!"})
    voter = secrets.token_hex(8)
    anon.call("POST", f"/api/public/{slug}/wishes/{joko_rsvp['id']}/like", {"voter": voter})
    status, data = anon.call("POST", f"/api/public/{slug}/wishes/{joko_rsvp['id']}/like", {"voter": voter})
    check("like counted once per voter", status == 200 and data["likes"] == 1 and data["counted"] is False, data)
    anon.call("POST", f"/api/public/{slug}/wishes/{joko_rsvp['id']}/like", {"voter": secrets.token_hex(8)})
    status, data = anon.call("GET", f"/api/public/{slug}/wishes")
    joko_wish = next(w for w in data["wishes"] if w["id"] == joko_rsvp["id"])
    check("reply + likes visible publicly", joko_wish["reply"] == "Terima kasih Pak Joko!" and joko_wish["likes"] == 2, joko_wish)

    # Gift / donation confirmation
    status, data = anon.call("POST", f"/api/public/{slug}/gift", {"name": "Joko", "method": "BCA", "amount": "500000", "message": "Selamat", "guestCode": joko["code"]})
    check("gift confirmation accepted", status == 200, data)
    status, data = anon.call("POST", f"/api/public/{slug}/gift", {"name": "", "method": "BCA"})
    check("gift confirmation validation", status == 400, data)
    status, data = owner.call("GET", f"/api/invitations/{inv_id}/gifts")
    check("owner sees gifts + total", status == 200 and data["stats"]["gifts"] == 1 and data["stats"]["giftAmount"] == 500000
          and data["gifts"][0]["invitedAs"] == joko["name"], data)
    status, _ = other.call("GET", f"/api/invitations/{inv_id}/gifts")
    check("other user cannot see gifts", status == 404, status)

    # CSV export
    status, body = owner.call("GET", f"/api/invitations/{inv_id}/export.csv")
    csv_text = body.decode("utf-8-sig") if isinstance(body, bytes) else ""
    check("CSV export", status == 200 and "Bapak Joko & Keluarga" in csv_text
          and "Request Lagu" in csv_text and "Perfect – Ed Sheeran" in csv_text, csv_text[:300])
    check("CSV formula injection guarded", "'=HYPERLINK" in csv_text)

    # Path traversal
    status, _ = anon.call("GET", "/assets/../server.py")
    check("path traversal blocked", status == 404, status)
    status, _ = anon.call("GET", "/uploads/../app.db")
    check("db not downloadable", status == 404, status)

    # Demo
    status, page = anon.call("GET", "/i/demo")
    check("demo invitation seeded", status == 200, status)

    # Platform reviews: hidden until an admin approves
    status, data = owner.call("POST", "/api/reviews", {"rating": 5, "text": "Bagus", "name": "Tester"})
    check("review needs 10+ characters", status == 400, data)
    status, data = owner.call("POST", "/api/reviews", {"rating": 5, "text": "Sangat membantu, tamu suka sekali!", "couple": "Budi & Sari"})
    check("review saved pending", status == 200 and data["review"]["approved"] is False, data)
    status, data = anon.call("GET", "/api/reviews/public")
    check("pending review not public", all(r["text"] != "Sangat membantu, tamu suka sekali!" for r in data["reviews"]), data)
    status, _ = owner.call("GET", "/api/admin/reviews")
    check("non-admin blocked from admin", status == 403, status)
    admin = Client()
    admin_status, _ = admin.call("POST", "/api/auth/login", {"email": "admin@undangan.test", "password": "admin-pass-123"})
    if admin_status != 200:
        admin.call("POST", "/api/auth/register", {"email": "admin@undangan.test", "password": "admin-pass-123", "name": "Admin"})
    status, me_data = admin.call("GET", "/api/auth/me")
    if me_data.get("user", {}).get("isAdmin"):
        status, data = admin.call("GET", "/api/admin/reviews")
        review_id = next(r["id"] for r in data["reviews"] if r["text"] == "Sangat membantu, tamu suka sekali!")
        admin.call("PUT", f"/api/admin/reviews/{review_id}", {"approved": True})
        status, data = anon.call("GET", "/api/reviews/public")
        check("approved review public", any(r["text"] == "Sangat membantu, tamu suka sekali!" for r in data["reviews"]), data)
    else:
        print("[SKIP] admin review approval (start server with ADMIN_EMAILS=admin@undangan.test)")

    # Password reset by email
    status, data = anon.call("POST", "/api/auth/forgot", {"email": "nobody-" + secrets.token_hex(3) + "@example.com"})
    check("forgot: unknown email gives same response", status == 200 and data.get("ok"), data)
    if OUTBOX:
        started = time.time() - 1
        status, data = anon.call("POST", "/api/auth/forgot", {"email": email})
        subject, body = latest_email_to(email, started)
        match = re.search(r"#/reset\?token=([A-Za-z0-9_-]+)", body)
        check("reset email sent with link", status == 200 and match, subject)
        token = match.group(1) if match else ""
        status, data = anon.call("POST", "/api/auth/reset", {"token": token, "password": "short"})
        check("reset rejects short password", status == 400, data)
        status, data = anon.call("POST", "/api/auth/reset", {"token": token, "password": "barubaru123"})
        check("reset with valid token logs in", status == 200 and data["user"]["email"] == email, data)
        status, data = anon.call("POST", "/api/auth/reset", {"token": token, "password": "lagilagi123"})
        check("reset token is single-use", status == 400, data)
        status, _ = owner.call("GET", "/api/invitations")
        check("old sessions revoked after reset", status == 401, status)
        fresh = Client()
        status, _ = fresh.call("POST", "/api/auth/login", {"email": email, "password": "barubaru123"})
        check("login with new password", status == 200, status)
        owner = fresh
    status, data = anon.call("POST", "/api/auth/reset", {"token": "invalid-token", "password": "whatever123"})
    check("reset with bad token rejected", status == 400, data)

    # Logout
    owner.call("POST", "/api/auth/logout")
    status, data = owner.call("GET", "/api/invitations")
    check("logout ends session", status == 401, status)

    # Account deletion removes everything
    status, data = other.call("POST", "/api/auth/delete-account", {"password": "wrong-password"})
    check("delete account needs correct password", status == 400, data)
    status, data = other.call("POST", "/api/auth/delete-account", {"password": "rahasia123"})
    check("delete account", status == 200 and data.get("ok"), data)
    status, data = other.call("GET", "/api/auth/me")
    check("deleted account signed out", data.get("user") is None, data)

    passed = sum(1 for _, ok in results if ok)
    print(f"\n{passed}/{len(results)} checks passed")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
