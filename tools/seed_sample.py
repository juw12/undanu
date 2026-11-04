"""Fill a running Undanu server with a sample couple so the dashboard has something to show.

Usage (with the server running):

    python tools/seed_sample.py                      # http://127.0.0.1:8000
    python tools/seed_sample.py http://localhost:8000 --reset

Creates the account  coba@undanu.test / undanu123  with a published invitation at /i/leo-maya,
10 guests, 6 RSVPs (wishes, song requests, menu choices), 4 tables with an automatic seating plan,
2 gift confirmations and 1 check-in.
Everything goes through the public HTTP API, exactly like a real couple and real guests would.
--reset deletes and recreates the sample invitation if it already exists.
Set ADMIN_EMAILS=coba@undanu.test on the server to also see the admin page.
"""
from __future__ import annotations

import argparse
import http.cookiejar
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import demos  # noqa: E402

EMAIL = "coba@undanu.test"
PASSWORD = "undanu123"
ACCOUNT_NAME = "Leo & Maya"
SLUG = "leo-maya"

# name, WhatsApp, max guests, group
GUESTS = [
    ("Keluarga Santoso", "081234567801", 4, "Keluarga"),
    ("Bapak & Ibu Pradipta", "081234567802", 2, "Keluarga"),
    ("Tasya & Andre", "081234567803", 2, "Teman kuliah"),
    ("Kevin", "081234567804", 1, "Kantor"),
    ("Ni Made Ayu Lestari", "081234567805", 2, "Teman kuliah"),
    ("Yohanes & Clara", "081234567806", 2, "Kantor"),
    ("Ahmad Fauzi", "081234567807", 2, "Kantor"),
    ("Tante Lina", "081234567808", 2, "Keluarga"),
    ("Wei Ling & Hendrik", "081234567809", 2, "Teman kuliah"),
    ("Pak Gede Wirawan", "082312123434", 3, "Kantor"),
]

# guest name -> (attendance, guests, wish, song request, menu, dietary note)
RSVPS = {
    "Keluarga Santoso": ("yes", 4, "Selamat menempuh hidup baru, Leo & Maya! Kami sekeluarga pasti hadir.", "", "Non-halal", ""),
    "Tasya & Andre": ("yes", 2, "Akhirnya! Bahagia selalu ya kalian berdua.", "Perfect — Ed Sheeran", "Halal", "Andre alergi kacang"),
    "Ni Made Ayu Lestari": ("yes", 2, "Selamat menempuh hidup baru, semoga selalu rukun dan bahagia.", "Kasih Putih — Glenn Fredly", "Vegetarian", ""),
    "Ahmad Fauzi": ("yes", 2, "Selamat ya Leo & Maya, semoga langgeng sampai tua.", "", "Halal", ""),
    "Yohanes & Clara": ("maybe", 2, "Kami usahakan datang ya! Selamat untuk kalian.", "", "Non-halal", ""),
    "Kevin": ("no", 0, "Maaf belum bisa hadir, doa terbaik dari jauh!", "", "", ""),
}
# Menu the couple filled in themselves (e.g. family who answered by phone)
OWNER_MEALS = {"Bapak & Ibu Pradipta": "Halal", "Tante Lina": "Vegetarian"}
TABLES = [("Meja Keluarga", 8), ("Meja 2", 6), ("Meja 3", 6), ("Meja 4", 6)]
NOT_SENT = {"Tante Lina", "Wei Ling & Hendrik"}
NOT_OPENED = {"Pak Gede Wirawan"}
GIFTS = [
    {"guest": "Tasya & Andre", "method": "BCA", "amount": 500000, "message": "Untuk honeymoon 😄"},
    {"guest": "Keluarga Santoso", "method": "Kirim kado", "amount": 0, "message": "Kado sudah dikirim ke alamat Maya"},
]
CHECKED_IN = ("Keluarga Santoso", 4)


class Client:
    """Tiny JSON client with its own cookie jar (one per browser/person)."""

    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()),
        )

    def call(self, method: str, path: str, body: dict | None = None) -> dict:
        data = json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(self.base + path, data=data, method=method)
        request.add_header("Content-Type", "application/json")
        request.add_header("X-Requested-With", "fetch")
        try:
            with self.opener.open(request, timeout=20) as response:
                return json.loads(response.read() or b"{}")
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")
            raise SystemExit(f"{method} {path} failed ({error.code}): {detail}") from None


def log_in_or_register(owner: Client) -> None:
    try:
        owner.call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})
        print(f"Logged in as {EMAIL}")
    except SystemExit:
        owner.call("POST", "/api/auth/register", {"email": EMAIL, "name": ACCOUNT_NAME, "password": PASSWORD})
        print(f"Registered {EMAIL}")


def sample_config() -> dict:
    config = demos.demo_config()
    config.setdefault("rsvp", {})["songRequests"] = True
    config["rsvp"].update({"askMeal": True, "mealOptions": ["Halal", "Non-halal", "Vegetarian"], "showTable": True})
    config.setdefault("gifts", {})["confirmations"] = True
    return config


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("base", nargs="?", default="http://127.0.0.1:8000")
    parser.add_argument("--reset", action="store_true", help="recreate the sample invitation if it exists")
    args = parser.parse_args()

    owner = Client(args.base)
    log_in_or_register(owner)

    existing = [inv for inv in owner.call("GET", "/api/invitations")["invitations"] if inv["slug"] == SLUG]
    if existing and not args.reset:
        print(f"/i/{SLUG} already exists - nothing to do (use --reset to recreate it).")
        return
    for invitation in existing:
        owner.call("DELETE", f"/api/invitations/{invitation['id']}")

    invitation = owner.call("POST", "/api/invitations", {"slug": SLUG, "config": sample_config()})["invitation"]
    invitation_id = invitation["id"]
    owner.call("PUT", f"/api/invitations/{invitation_id}", {"published": True})

    owner.call("POST", f"/api/invitations/{invitation_id}/guests", {
        "guests": [{"name": n, "phone": p, "pax": pax, "group": g} for n, p, pax, g in GUESTS],
    })
    guests = {g["name"]: g for g in owner.call("GET", f"/api/invitations/{invitation_id}/guests")["guests"]}

    for name, guest in guests.items():
        if name not in NOT_SENT:
            owner.call("PUT", f"/api/invitations/{invitation_id}/guests/{guest['id']}", {"sent": True})

    # Guests use their own browsers (no owner cookie), so opens and RSVPs count like real ones.
    for name, guest in guests.items():
        visitor = Client(args.base)
        if name not in NOT_SENT and name not in NOT_OPENED:
            visitor.call("POST", f"/api/public/{SLUG}/open", {"guestCode": guest["code"]})
        if name in RSVPS:
            attendance, count, wish, song, meal, diet_note = RSVPS[name]
            visitor.call("POST", f"/api/public/{SLUG}/rsvp", {
                "guestCode": guest["code"], "name": name, "attendance": attendance,
                "guests": count, "message": wish, "song": song, "meal": meal, "dietNote": diet_note,
            })
    for name, meal in OWNER_MEALS.items():
        owner.call("PUT", f"/api/invitations/{invitation_id}/guests/{guests[name]['id']}", {"meal": meal})

    for gift in GIFTS:
        Client(args.base).call("POST", f"/api/public/{SLUG}/gift", {
            "guestCode": guests[gift["guest"]]["code"], "name": gift["guest"],
            "method": gift["method"], "amount": gift["amount"], "message": gift["message"],
        })

    owner.call("PUT", f"/api/invitations/{invitation_id}/tables",
               {"tables": [{"name": table_name, "capacity": seats} for table_name, seats in TABLES]})
    seating = owner.call("POST", f"/api/invitations/{invitation_id}/seating/auto",
                         {"includeMaybe": True, "includePending": True, "keepExisting": False})
    print(f"Seating: {seating['seated']} parties placed, {len(seating['unseated'])} without a table")

    name, count = CHECKED_IN
    owner.call("POST", f"/api/invitations/{invitation_id}/checkin",
               {"code": guests[name]["code"], "confirm": True, "count": count})

    stats = owner.call("GET", f"/api/invitations/{invitation_id}")["stats"]
    print(f"Sample invitation ready: {args.base.rstrip('/')}/i/{SLUG}")
    print(f"Dashboard: {args.base.rstrip('/')}/app  (login {EMAIL} / {PASSWORD})")
    print("Stats:", json.dumps(stats))


if __name__ == "__main__":
    main()
