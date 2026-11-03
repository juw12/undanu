"""
Build the static GitHub Pages demo into docs/.

    python tools/build_pages.py

GitHub Pages can't run the Python backend, so this produces the landing page plus
a pre-rendered demo invitation where RSVPs are simulated in the browser.
"""
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DOCS = ROOT / "docs"
REPO_URL = "https://github.com/juw12/undanu"


def replace_all(text, replacements, label):
    for old, new, expected in replacements:
        count = text.count(old)
        if count != expected:
            raise SystemExit(f"{label}: expected {expected}x {old!r}, found {count}")
        text = text.replace(old, new)
    return text


def build_landing():
    html = (PUBLIC / "index.html").read_text(encoding="utf-8")
    html = replace_all(html, [
        ('href="/assets/', 'href="assets/', 1),
        ('<a class="btn btn-ghost btn-sm" href="/app#/login">Masuk</a>',
         f'<a class="btn btn-ghost btn-sm" href="{REPO_URL}">GitHub</a>', 1),
        ('<a class="btn btn-primary btn-sm" href="/app#/register">Daftar gratis</a>',
         f'<a class="btn btn-primary btn-sm" href="{REPO_URL}#deploy">Deploy gratis</a>', 1),
        ('<a class="btn btn-primary btn-lg" href="/app#/register">Buat undangan gratis</a>',
         f'<a class="btn btn-primary btn-lg" href="{REPO_URL}#deploy">Deploy sendiri</a>', 1),
        ('<a class="btn btn-primary btn-lg" href="/app#/register">Daftar gratis</a>',
         f'<a class="btn btn-primary btn-lg" href="{REPO_URL}#deploy">Lihat cara deploy</a>', 1),
        ('href="/i/demo', 'href="demo/', 9),
        ('src="/assets/landing.js"', 'src="assets/landing.js"', 1),
        ('src="/i/demo', 'src="demo/', 1),
        ('href="/"', 'href="./"', 1),
    ], "landing")
    html = html.replace(
        "<p>Gratis untuk dicoba. Data tamu Anda tidak dibagikan ke siapa pun.</p>",
        "<p>Ini demo statis di GitHub Pages. Aplikasi lengkap (dashboard, RSVP, check-in) "
        "berjalan di server Anda sendiri — gratis dan open source.</p>",
    )
    (DOCS / "index.html").write_text(html, encoding="utf-8")


def build_demo():
    config = json.loads((ROOT / "seed" / "demo.json").read_text(encoding="utf-8"))
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    sample_wishes = [
        {"id": "w1", "name": "Dimas & Sari", "attendance": "yes", "time": stamp, "likes": 12,
         "reply": "Aamiin, terima kasih banyak Dimas & Sari! Sampai jumpa di hari H 🤍",
         "message": "Selamat menempuh hidup baru! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah."},
        {"id": "w2", "name": "Tante Lina", "attendance": "yes", "time": stamp,
         "message": "Bahagia sekali mendengar kabar ini. Semoga langgeng sampai kakek nenek ya!"},
        {"id": "w3", "name": "Kevin", "attendance": "no", "time": stamp,
         "message": "Maaf belum bisa hadir, doa terbaik dari Singapura. Congrats both of you!"},
    ]
    data = {
        "slug": "demo",
        "published": True,
        "preview": False,
        "staticDemo": True,
        "config": config,
        "guest": None,
        "appName": "Undanu",
        "homeUrl": "../",
        "sampleWishes": sample_wishes,
    }
    data_json = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    meta = "\n  ".join([
        "<title>The Wedding of Raka &amp; Ayu · Demo Undanu</title>",
        '<meta name="description" content="Contoh undangan pernikahan digital dari Undanu.">',
        '<meta property="og:title" content="The Wedding of Raka &amp; Ayu">',
        '<meta property="og:description" content="Sabtu, 20 Februari 2027 · Jakarta — demo Undanu">',
    ])
    html = (PUBLIC / "invite.html").read_text(encoding="utf-8")
    html = replace_all(html, [
        ('href="/assets/', 'href="../assets/', 1),
        ('src="/assets/', 'src="../assets/', 2),
        ("<!--META-->", meta, 1),
        ("<!--DATA-->", data_json, 1),
    ], "demo")
    (DOCS / "demo").mkdir(parents=True, exist_ok=True)
    (DOCS / "demo" / "index.html").write_text(html, encoding="utf-8")


def main():
    shutil.rmtree(DOCS, ignore_errors=True)
    (DOCS / "assets").mkdir(parents=True)
    for name in ("app.css", "invite.css", "invite.js", "qrcode.min.js", "landing.js"):
        shutil.copy2(PUBLIC / "assets" / name, DOCS / "assets" / name)
    build_landing()
    build_demo()
    (DOCS / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Built static demo in {DOCS}")


if __name__ == "__main__":
    main()
