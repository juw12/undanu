"""
Build the static GitHub Pages demo into docs/.

    python tools/build_pages.py

GitHub Pages can't run the Python backend, so this produces the landing page plus
a pre-rendered demo invitation where RSVPs are simulated in the browser.
"""
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DOCS = ROOT / "docs"
REPO_URL = "https://github.com/juw12/undanu"

sys.path.insert(0, str(ROOT))
import demos  # noqa: E402  (shared with server.py)


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
        ('src="/assets/landing.js"', 'src="assets/landing.js"', 1),
        ('href="/"', 'href="./"', 1),
    ], "landing")
    # /i/demo?agama=hindu -> demo/?agama=hindu (also inside data-src for the religion chips)
    html = re.sub(r'(href|src|data-src)="/i/demo(?=[?"])', r'\1="demo/', html)
    html = html.replace(
        "<p>Gratis untuk dicoba. Data tamu Anda tidak dibagikan ke siapa pun.</p>",
        "<p>Ini demo statis di GitHub Pages. Aplikasi lengkap (dashboard, RSVP, check-in) "
        "berjalan di server Anda sendiri — gratis dan open source.</p>",
    )
    (DOCS / "index.html").write_text(html, encoding="utf-8")


def build_demo(stamp):
    """Write the unified demo (/i/demo -> docs/demo/), switchable between traditions."""
    wishes = [
        {"id": f"w{i}", "name": name, "attendance": attendance, "time": stamp, "message": message}
        for i, (name, attendance, _count, message) in enumerate(demos.sample_wishes(), start=1)
    ]
    wishes[0]["likes"] = 12
    wishes[0]["reply"] = f"Terima kasih banyak {wishes[0]['name']}! Sampai jumpa di hari H 🤍"
    config = demos.demo_config()
    data = {
        "slug": demos.DEMO_SLUG,
        "published": True,
        "preview": False,
        "staticDemo": True,
        "config": config,
        "demoTraditions": demos.tradition_patches(),
        "guest": None,
        "appName": "Undanu",
        "homeUrl": "../",
        "sampleWishes": wishes,
    }
    data_json = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    couple = f"{config['couple']['groom']['nickname']} &amp; {config['couple']['bride']['nickname']}"
    meta = "\n  ".join([
        f"<title>The Wedding of {couple} · Demo · Undanu</title>",
        '<meta name="description" content="Contoh undangan pernikahan digital Undanu untuk semua agama &amp; kepercayaan.">',
        f'<meta property="og:title" content="The Wedding of {couple}">',
        '<meta property="og:description" content="Demo undangan Undanu — Umum, Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu, Kepercayaan">',
    ])
    html = (PUBLIC / "invite.html").read_text(encoding="utf-8")
    html = replace_all(html, [
        ('href="/assets/', 'href="../assets/', 1),
        ('src="/assets/', 'src="../assets/', 2),
        ("<!--META-->", meta, 1),
        ("<!--DATA-->", data_json, 1),
    ], "demo")
    out_dir = DOCS / "demo"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(html, encoding="utf-8")


def build_legacy_redirects():
    """Old per-religion demo URLs (demo/hindu/) -> the unified demo (demo/?agama=hindu)."""
    for slug, religion in demos.legacy_slugs().items():
        target = f"../?agama={religion}"
        page = f"""<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url={target}">
<title>Undanu demo</title></head>
<body><script>
  var extra = location.search ? '&' + location.search.slice(1) : '';
  location.replace('{target}' + extra + location.hash);
</script><a href="{target}">Lihat demo</a></body></html>
"""
        out_dir = DOCS / "demo" / slug[len(demos.DEMO_SLUG) + 1:]
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(page, encoding="utf-8")


def build_demos():
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    build_demo(stamp)
    build_legacy_redirects()


def main():
    shutil.rmtree(DOCS, ignore_errors=True)
    (DOCS / "assets").mkdir(parents=True)
    for name in ("app.css", "invite.css", "invite.js", "qrcode.min.js", "landing.js"):
        shutil.copy2(PUBLIC / "assets" / name, DOCS / "assets" / name)
    build_landing()
    build_demos()
    (DOCS / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Built static demo in {DOCS}")


if __name__ == "__main__":
    main()
