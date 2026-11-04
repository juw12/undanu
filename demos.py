"""
The unified demo invitation (/i/demo).

One couple, one page. seed/demo.json is the invitation itself; seed/demo_traditions.json
holds only what differs per religion/tradition recognised in Indonesia: greeting, ceremony
name and place, quote/scripture, closing and cover symbol. The invite page shows a
switcher (and accepts ?agama=hindu) that swaps those parts in place.

Used by server.py (seeding /i/demo, redirecting the old /i/demo-<religion> links)
and tools/build_pages.py (static GitHub Pages copy).
"""
import copy
import json
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parent / "seed"
DEMO_SLUG = "demo"


def _load_doc() -> dict:
    path = SEED_DIR / "demo_traditions.json"
    if not path.exists():
        return {"default": "umum", "traditions": []}
    return json.loads(path.read_text(encoding="utf-8"))


def load_traditions() -> list:
    return _load_doc()["traditions"]


def default_religion() -> str:
    return _load_doc().get("default", "umum")


def legacy_slugs() -> dict:
    """Old per-religion demo links -> religion, e.g. {"demo-hindu": "hindu"} (redirected to /i/demo?agama=...)."""
    return {
        f"{DEMO_SLUG}-{tradition['religion']}": tradition["religion"]
        for tradition in load_traditions()
        if tradition["religion"] != default_religion()
    }


def reserved_slugs() -> list:
    return [DEMO_SLUG, *legacy_slugs()]


def tradition_patches() -> list:
    """What the invite page needs to switch tradition: only the religion-specific fields."""
    patches = []
    for tradition in load_traditions():
        text = tradition["text"]
        patches.append({
            "religion": tradition["religion"],
            "label": tradition["label"],
            "opening": text["opening"],
            "quote": text["quote"],
            "closing": text["closing"],
            "ceremony": {"title": text["ceremony"], **tradition["ceremony"]},
        })
    return patches


def apply_patch(config: dict, patch: dict) -> dict:
    """Same merge as applyTradition() in public/assets/invite.js."""
    config = copy.deepcopy(config)
    config["religion"] = patch["religion"]
    config["showSymbol"] = True
    for key in ("opening", "quote", "closing"):
        config[key] = copy.deepcopy(patch[key])
    if config.get("events"):
        config["events"][0].update(copy.deepcopy(patch["ceremony"]))
    return config


def demo_config() -> dict:
    """The stored demo invitation, rendered in the default (neutral) tradition."""
    base_path = SEED_DIR / "demo.json"
    if not base_path.exists():
        return {}
    base = json.loads(base_path.read_text(encoding="utf-8"))
    default = next((p for p in tradition_patches() if p["religion"] == default_religion()), None)
    return apply_patch(base, default) if default else base


def sample_wishes() -> list:
    """(name, attendance, guests, message) tuples shown on the demo's wishes wall."""
    return [
        ("Tasya & Andre", "yes", 2, "Selamat menempuh hidup baru! Semoga selalu bahagia dan saling menguatkan."),
        ("Tante Lina", "yes", 1, "Bahagia sekali mendengar kabar ini. Semoga langgeng sampai kakek nenek ya!"),
        ("Kevin", "no", 0, "Maaf belum bisa hadir, doa terbaik dari Singapura. Congrats both of you!"),
    ]
