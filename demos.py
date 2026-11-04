"""
Demo invitations, one per religion/tradition recognised in Indonesia.

seed/demo.json is the shared base (story, gallery, RSVP, gifts...). Each entry in
seed/demo_variants.json overrides the couple, ceremony, venue, theme and the
religion texts, so every tradition gets an equally complete, authentic demo.
Used by server.py (seeding /i/demo, /i/demo-islam, ...) and tools/build_pages.py.
"""
import copy
import json
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parent / "seed"


def load_variants() -> list:
    path = SEED_DIR / "demo_variants.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))["variants"]


def demo_slugs() -> list:
    return [variant["slug"] for variant in load_variants()]


def build_demo_config(base: dict, variant: dict) -> dict:
    config = copy.deepcopy(base)
    text = variant["text"]
    groom = {**config["couple"]["groom"], **variant["groom"]}
    bride = {**config["couple"]["bride"], **variant["bride"]}

    config["religion"] = variant["religion"]
    config["theme"] = variant["theme"]
    config["showSymbol"] = True
    config["couple"]["groom"] = groom
    config["couple"]["bride"] = bride
    config["hashtag"] = variant["hashtag"]
    config["opening"] = copy.deepcopy(text["opening"])
    config["quote"] = copy.deepcopy(text["quote"])
    config["closing"] = copy.deepcopy(text["closing"])

    ceremony, reception = config["events"][0], config["events"][1]
    ceremony["title"] = copy.deepcopy(text["ceremony"])
    ceremony.update(variant["ceremony"])
    if variant.get("reception"):
        reception.update(variant["reception"])

    config["dressCode"]["colors"] = list(variant["dressColors"])
    config["dressCode"]["note"] = {
        "id": "Kami mengundang Anda mengenakan busana bernuansa warna berikut.",
        "en": "We kindly invite you to dress in the following shades.",
    }

    accounts = config["gifts"]["accounts"]
    if accounts:
        accounts[0]["holder"] = groom["fullName"].split(",")[0]
    if len(accounts) > 1:
        accounts[1]["holder"] = bride["fullName"].split(",")[0]
    config["gifts"]["address"]["recipient"] = bride["fullName"].split(",")[0]
    return config


def demo_configs() -> dict:
    """slug -> (variant, config) for every demo, in display order."""
    base_path = SEED_DIR / "demo.json"
    if not base_path.exists():
        return {}
    base = json.loads(base_path.read_text(encoding="utf-8"))
    return {variant["slug"]: (variant, build_demo_config(base, variant)) for variant in load_variants()}


def sample_wishes(variant: dict) -> list:
    """(name, attendance, guests, message) tuples shown on each demo's wishes wall."""
    return [
        ("Dimas & Sari", "yes", 2, variant["firstWish"]),
        ("Tante Lina", "yes", 1, "Bahagia sekali mendengar kabar ini. Semoga langgeng sampai kakek nenek ya!"),
        ("Kevin", "no", 0, "Maaf belum bisa hadir, doa terbaik dari Singapura. Congrats both of you!"),
    ]
