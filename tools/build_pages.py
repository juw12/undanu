"""
Build the static GitHub Pages demo into docs/.

    python tools/build_pages.py

GitHub Pages can't run the Python backend, so this produces the landing page,
a pre-rendered demo invitation where RSVPs are simulated in the browser, and the
couple's dashboard (docs/app/) running against assets/demo-api.js, an in-browser
stand-in for the API that keeps the sample couple's data in localStorage.
"""
import hashlib
import importlib.util
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
        ('<a class="btn btn-ghost btn-sm" href="/app#/login" data-en="Log in">Masuk</a>',
         '<a class="btn btn-ghost btn-sm" href="app/" data-en="Try the dashboard">Coba dashboard</a>', 1),
        ('<a class="btn btn-primary btn-sm" href="/app#/register" data-en="Sign up free">Daftar gratis</a>',
         f'<a class="btn btn-primary btn-sm" href="{REPO_URL}#deploy" data-en="Deploy free">Deploy gratis</a>', 1),
        ('<a class="btn btn-primary btn-lg" href="/app#/register" data-en="Create a free invitation">Buat undangan gratis</a>',
         f'<a class="btn btn-primary btn-lg" href="{REPO_URL}#deploy" data-en="Deploy your own">Deploy sendiri</a>', 1),
        ('<a class="btn btn-primary btn-lg" href="/app#/register" data-en="Sign up free">Daftar gratis</a>',
         f'<a class="btn btn-primary btn-lg" href="{REPO_URL}#deploy" data-en="How to deploy">Lihat cara deploy</a>', 1),
        ('src="/assets/landing.js"', 'src="assets/landing.js"', 1),
        ('src="/assets/pwa.js"', 'src="assets/pwa.js"', 1),
        ('  <link rel="manifest" href="/manifest.webmanifest">\n', '', 1),
        ('href="/icons/', 'href="icons/', 2),
        ('href="/"', 'href="./"', 1),
    ], "landing")
    # /i/demo?agama=hindu -> demo/?agama=hindu (also inside data-src for the religion chips)
    html = re.sub(r'(href|src|data-src)="/i/demo(?=[?"])', r'\1="demo/', html)
    html = html.replace(
        '<p data-en="Free to try. Your guest data is never shared with anyone.">'
        "Gratis untuk dicoba. Data tamu Anda tidak dibagikan ke siapa pun.</p>",
        '<p data-en="This is a static demo on GitHub Pages: try the <a href=&quot;app/&quot;>couple\'s dashboard</a> '
        '(data stays in your browser). The full app runs on your own server, free and open source.">'
        'Ini demo statis di GitHub Pages — coba <a href="app/">dashboard pasangan</a> (data tersimpan di browser Anda). '
        "Aplikasi lengkap berjalan di server Anda sendiri — gratis dan open source.</p>",
    )
    html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta name="undanu-static" content="1">', 1)
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
        ('href="/icons/', 'href="../icons/', 1),
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


def dashboard_seed():
    """Sample couple for the dashboard demo: same data as tools/seed_sample.py."""
    spec = importlib.util.spec_from_file_location("seed_sample", ROOT / "tools" / "seed_sample.py")
    sample = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sample)
    not_opened = set(sample.NOT_OPENED) | set(sample.NOT_SENT)
    guests = [
        {"name": name, "phone": phone, "pax": pax, "group": group,
         "sent": name not in sample.NOT_SENT, "opened": name not in not_opened,
         "meal": sample.OWNER_MEALS.get(name, "")}
        for name, phone, pax, group in sample.GUESTS
    ]
    rsvps = {
        name: {"attendance": attendance, "guests": count, "message": message, "song": song,
               "meal": meal, "dietNote": diet_note}
        for name, (attendance, count, message, song, meal, diet_note) in sample.RSVPS.items()
    }
    first = next(iter(rsvps))
    rsvps[first].update({"likes": 3, "reply": f"Terima kasih banyak, {first}! Sampai jumpa di hari H 🤍"})
    seed = {
        "slug": "leo-maya",
        "user": {"email": "demo@undanu.app", "name": sample.ACCOUNT_NAME},
        "config": sample.sample_config(),
        "guests": guests,
        "rsvps": rsvps,
        "gifts": sample.GIFTS,
        "tables": [list(table) for table in sample.TABLES],
        "checkedIn": list(sample.CHECKED_IN),
    }
    # Bump the stored demo when the seed changes, so returning visitors get the new sample data.
    seed["version"] = hashlib.sha1(json.dumps(seed, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:10]
    return seed


def build_dashboard():
    """docs/app/: the real dashboard (app.js) with assets/demo-api.js answering its API calls."""
    seed_json = json.dumps(dashboard_seed(), ensure_ascii=False)
    seed_json = seed_json.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    html = (PUBLIC / "app.html").read_text(encoding="utf-8")
    html = replace_all(html, [
        ("<title>Dashboard · Undanu</title>", "<title>Demo dashboard · Undanu</title>", 1),
        ('  <link rel="manifest" href="/manifest.webmanifest">\n', "", 1),
        ('href="/icons/', 'href="../icons/', 2),
        ('href="/assets/app.css"', 'href="../assets/app.css"', 1),
        ('  <script src="/assets/presets.js"></script>\n',
         f"  <script>window.UNDANU_DEMO_SEED = {seed_json};</script>\n"
         '  <script src="../assets/demo-api.js"></script>\n'
         '  <script src="../assets/presets.js"></script>\n', 1),
        ('src="/assets/app.js"', 'src="../assets/app.js"', 1),
        ('  <script src="/assets/pwa.js"></script>\n', "", 1),
    ], "dashboard")
    out_dir = DOCS / "app"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(html, encoding="utf-8")


def build_demos():
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    build_demo(stamp)
    build_legacy_redirects()


def main():
    # Rebuild everything except docs/media (README images are maintained by hand).
    for child in DOCS.glob("*") if DOCS.exists() else []:
        if child.name == "media":
            continue
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    (DOCS / "assets").mkdir(parents=True, exist_ok=True)
    for name in ("app.css", "invite.css", "invite.js", "qrcode.min.js", "landing.js", "pwa.js",
                 "app.js", "presets.js", "demo-api.js"):
        shutil.copy2(PUBLIC / "assets" / name, DOCS / "assets" / name)
    shutil.copytree(PUBLIC / "icons", DOCS / "icons", dirs_exist_ok=True)
    build_landing()
    build_demos()
    build_dashboard()
    (DOCS / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Built static demo in {DOCS}")


if __name__ == "__main__":
    main()
