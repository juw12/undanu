#!/usr/bin/env python3
"""
UndanganKita — digital wedding invitation platform (backend).

Zero dependencies: Python 3.9+ standard library only (http.server + sqlite3).

    python server.py                 -> http://localhost:8000

Environment variables:
    PORT=8000              HOST=0.0.0.0
    DATA_DIR=./data        (SQLite database + uploaded photos; mount a persistent disk here)
    APP_NAME=UndanganKita
    BASE_URL=https://...   (optional; used for absolute links in CSV / link previews)
    SECURE_COOKIES=1       (set when served over HTTPS)
    TRUST_PROXY=1          (set when behind a reverse proxy / PaaS load balancer)
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_SSL=1
                           (outgoing email for password reset + RSVP notifications;
                            when SMTP_HOST is empty, emails are written to DATA_DIR/outbox/)
"""
from __future__ import annotations

import csv
import hashlib
import hmac
import html
import io
import json
import os
import re
import secrets
import shutil
import smtplib
import sqlite3
import ssl
import sys
import threading
import time
import traceback
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import datetime, timezone
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# --------------------------------------------------------------------------- #
# Settings
# --------------------------------------------------------------------------- #
ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "public"
SEED_DIR = ROOT / "seed"
DATA_DIR = Path(os.environ.get("DATA_DIR", ROOT / "data")).resolve()
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "app.db"

APP_NAME = os.environ.get("APP_NAME", "UndanganKita")
BASE_URL = os.environ.get("BASE_URL", "").rstrip("/")
SECURE_COOKIES = os.environ.get("SECURE_COOKIES") == "1"
TRUST_PROXY = os.environ.get("TRUST_PROXY") == "1"

SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER or f"no-reply@{APP_NAME.lower()}.local")
SMTP_SSL = os.environ.get("SMTP_SSL") == "1"
OUTBOX_DIR = DATA_DIR / "outbox"

SESSION_SECONDS = 30 * 24 * 3600
RESET_TOKEN_SECONDS = 3600
PBKDF2_ITERATIONS = 240_000
MAX_JSON_BYTES = 512 * 1024
MAX_CONFIG_BYTES = 200 * 1024
MAX_IMAGE_BYTES = 6 * 1024 * 1024
MAX_AUDIO_BYTES = 12 * 1024 * 1024
MAX_UPLOADS_PER_INVITATION = 80
MAX_GUESTS_PER_INVITATION = 5000
MAX_INVITATIONS_PER_USER = 10

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")
EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$")
UPLOAD_URL_RE = re.compile(r"^/uploads/\d+/[A-Za-z0-9_-]{8,64}\.(?:jpg|png|webp|gif|mp3)$")
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{3,8}$")
RESERVED_SLUGS = {
    "app", "api", "admin", "assets", "uploads", "login", "register", "demo-admin",
    "static", "healthz", "www", "help", "support", "i",
}
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
ATTENDANCE = ("yes", "no", "maybe")

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json",
}

CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com; "
    "img-src 'self' data: blob: https:; "
    "media-src 'self' https:; "
    "connect-src 'self'; "
    "frame-src 'self' https://www.google.com https://maps.google.com; "
    "frame-ancestors 'self'; "
    "base-uri 'self'; form-action 'self'"
)

# --------------------------------------------------------------------------- #
# Database
# --------------------------------------------------------------------------- #
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invitations (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    config TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY,
    invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    pax INTEGER NOT NULL DEFAULT 2,
    grp TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'list',
    sent_at TEXT,
    checked_in_at TEXT,
    checked_in_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE (invitation_id, code)
);
CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY,
    invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    guest_id INTEGER NOT NULL UNIQUE REFERENCES guests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    attendance TEXT NOT NULL,
    guests INTEGER NOT NULL DEFAULT 0,
    message TEXT NOT NULL DEFAULT '',
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY,
    invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    kind TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invitations_user ON invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_invitation ON guests(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_invitation ON rsvps(invitation_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
"""

# Columns added after the first release; applied to existing databases on start-up.
MIGRATIONS = [
    ("guests", "opened_at", "TEXT"),
    ("guests", "open_count", "INTEGER NOT NULL DEFAULT 0"),
]


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 15000")
    return conn


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    conn = connect()
    try:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.executescript(SCHEMA)
        for table, column, definition in MIGRATIONS:
            existing = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
            if column not in existing:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (int(time.time()),))
        conn.execute("DELETE FROM password_resets WHERE expires_at < ?", (int(time.time()),))
        conn.commit()
    finally:
        conn.close()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# --------------------------------------------------------------------------- #
# Email
# --------------------------------------------------------------------------- #
def send_email(to: str, subject: str, text_body: str, html_body: str | None = None) -> None:
    """Send in a background thread. Without SMTP_HOST, write an .eml file to the outbox."""
    message = EmailMessage()
    message["From"] = f"{APP_NAME} <{SMTP_FROM}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text_body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    if not SMTP_HOST:
        OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
        path = OUTBOX_DIR / f"{int(time.time() * 1000)}-{secrets.token_hex(3)}.eml"
        path.write_bytes(bytes(message))
        print(f"[mail] SMTP not configured; saved email to {path}", flush=True)
        return

    def deliver() -> None:
        try:
            context = ssl.create_default_context()
            if SMTP_SSL:
                client = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=20)
            else:
                client = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20)
                client.starttls(context=context)
            with client:
                if SMTP_USER:
                    client.login(SMTP_USER, SMTP_PASSWORD)
                client.send_message(message)
        except Exception:  # noqa: BLE001
            traceback.print_exc()

    threading.Thread(target=deliver, daemon=True).start()


def email_html(title: str, paragraphs: list[str], button: tuple[str, str] | None = None) -> str:
    esc = html.escape
    body = "".join(f'<p style="margin:0 0 14px;line-height:1.6">{p}</p>' for p in paragraphs)
    if button:
        label, url = button
        body += (f'<p style="margin:22px 0"><a href="{esc(url)}" style="background:#5f7052;color:#fff;'
                 f'padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">{esc(label)}</a></p>')
    return (f'<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#262a22">'
            f'<h2 style="color:#435036;margin:0 0 16px">{esc(title)}</h2>{body}'
            f'<p style="color:#888;font-size:12px;margin-top:28px">{esc(APP_NAME)}</p></div>')


# --------------------------------------------------------------------------- #
# Security helpers
# --------------------------------------------------------------------------- #
def _b64(data: bytes) -> str:
    return urlsafe_b64encode(data).decode().rstrip("=")


def _unb64(text: str) -> bytes:
    return urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _algo, iterations, salt, digest = stored.split("$")
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), _unb64(salt), int(iterations))
        return hmac.compare_digest(candidate, _unb64(digest))
    except (ValueError, TypeError):
        return False


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class RateLimiter:
    """Simple in-memory sliding-window limiter (per process)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: dict[str, list[float]] = {}

    def allow(self, key: str, limit: int, window: float) -> bool:
        now = time.monotonic()
        with self._lock:
            if len(self._hits) > 20_000:
                self._hits = {k: v for k, v in self._hits.items() if v and now - v[-1] < 3600}
            recent = [t for t in self._hits.get(key, []) if now - t < window]
            allowed = len(recent) < limit
            if allowed:
                recent.append(now)
            self._hits[key] = recent
            return allowed


LIMITER = RateLimiter()


class ApiError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


class Response:
    def __init__(self, status=200, body=b"", content_type="application/json; charset=utf-8", headers=None):
        self.status = status
        self.body = body
        self.content_type = content_type
        self.headers = headers or []


def json_response(data, status=200, headers=None) -> Response:
    body = json.dumps(data, ensure_ascii=False).encode()
    return Response(status, body, "application/json; charset=utf-8", headers)


# --------------------------------------------------------------------------- #
# Validation / sanitising
# --------------------------------------------------------------------------- #
URL_KEYS = {"photo", "heroPhoto", "qrisImage", "url", "mapsUrl"}


def safe_url(value) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    if UPLOAD_URL_RE.match(text):
        return text
    if re.match(r"^https?://[^\s\"'<>]+$", text, re.IGNORECASE):
        return text[:600]
    return ""


def sanitize_config(value, key: str | None = None, depth: int = 0):
    """Defensive clean-up of owner-supplied invitation config (stored as JSON)."""
    if depth > 8:
        return None
    if isinstance(value, dict):
        cleaned = {}
        for k, v in list(value.items())[:80]:
            k = str(k)[:40]
            cleaned[k] = sanitize_config(v, k, depth + 1)
        return cleaned
    if isinstance(value, list):
        items = value[:120]
        if key == "gallery":
            return [u for u in (safe_url(x) for x in items) if u]
        if key == "colors":
            return [c for c in (str(x).strip() for x in items) if HEX_COLOR_RE.match(c)][:8]
        return [sanitize_config(x, key, depth + 1) for x in items]
    if isinstance(value, str):
        if key in URL_KEYS:
            return safe_url(value)
        if key == "instagram":
            return re.sub(r"[^A-Za-z0-9._]", "", value)[:40]
        if key == "whatsapp":
            return re.sub(r"\D", "", value)[:20]
        return value[:4000]
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, (int, float)):
        return value
    return str(value)[:200]


def public_config(config_text: str) -> dict:
    config = json.loads(config_text)
    config.pop("admin", None)          # private owner settings (WA template etc.)
    return config


def clean_text(value, max_len: int) -> str:
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", str(value or "")).strip()[:max_len]


def normalise_phone(raw) -> str:
    digits = re.sub(r"\D", "", str(raw or ""))
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    elif digits.startswith("8"):
        digits = "62" + digits
    return digits[:16]


def clamp_int(value, low: int, high: int, default: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return max(low, min(high, number))


def validate_slug(conn, slug: str, exclude_id: int | None = None) -> str:
    slug = (slug or "").strip().lower()
    if not SLUG_RE.match(slug) or "--" in slug:
        raise ApiError(400, "Link hanya boleh huruf kecil, angka, dan tanda '-' (3–40 karakter).")
    if slug in RESERVED_SLUGS:
        raise ApiError(400, "Link ini tidak tersedia.")
    row = conn.execute("SELECT id FROM invitations WHERE slug = ?", (slug,)).fetchone()
    if row and row["id"] != exclude_id:
        raise ApiError(409, "Link ini sudah dipakai. Coba yang lain.")
    return slug


def new_guest_code(conn, invitation_id: int) -> str:
    for _ in range(30):
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))
        exists = conn.execute(
            "SELECT 1 FROM guests WHERE invitation_id = ? AND code = ?", (invitation_id, code)
        ).fetchone()
        if not exists:
            return code
    raise ApiError(500, "Gagal membuat kode tamu.")


def sniff_upload(data: bytes):
    if data[:3] == b"\xff\xd8\xff":
        return "jpg", "image"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png", "image"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp", "image"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "gif", "image"
    if data[:3] == b"ID3" or (len(data) > 1 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0):
        return "mp3", "audio"
    return None, None


# --------------------------------------------------------------------------- #
# Request context
# --------------------------------------------------------------------------- #
class Request:
    def __init__(self, handler: "Handler", method: str, path: str, query: dict):
        self.handler = handler
        self.method = method
        self.path = path
        self.query = query
        self._conn = None
        self._user = False
        self._body = None

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = connect()
        return self._conn

    @property
    def ip(self) -> str:
        if TRUST_PROXY:
            forwarded = self.handler.headers.get("X-Forwarded-For", "")
            if forwarded:
                return forwarded.split(",")[0].strip()
        return self.handler.client_address[0]

    def cookie(self, name: str) -> str | None:
        raw = self.handler.headers.get("Cookie", "")
        for part in raw.split(";"):
            if "=" in part:
                k, v = part.strip().split("=", 1)
                if k == name:
                    return v
        return None

    @property
    def user(self):
        if self._user is False:
            self._user = None
            token = self.cookie("sid")
            if token:
                row = self.conn.execute(
                    """SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id
                       WHERE s.token_hash = ? AND s.expires_at > ?""",
                    (token_hash(token), int(time.time())),
                ).fetchone()
                self._user = row
        return self._user

    def require_user(self):
        if not self.user:
            raise ApiError(401, "Silakan masuk terlebih dahulu.")
        return self.user

    def raw_body(self, limit: int) -> bytes:
        if self._body is None:
            length = int(self.handler.headers.get("Content-Length") or 0)
            if length > limit:
                raise ApiError(413, "Ukuran data terlalu besar.")
            self._body = self.handler.rfile.read(length) if length else b""
        return self._body

    def json(self) -> dict:
        raw = self.raw_body(MAX_JSON_BYTES)
        if not raw:
            return {}
        try:
            data = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise ApiError(400, "Format data tidak valid.")
        if not isinstance(data, dict):
            raise ApiError(400, "Format data tidak valid.")
        return data

    def base_url(self) -> str:
        if BASE_URL:
            return BASE_URL
        proto = "https" if SECURE_COOKIES else "http"
        if TRUST_PROXY and self.handler.headers.get("X-Forwarded-Proto"):
            proto = self.handler.headers["X-Forwarded-Proto"].split(",")[0].strip()
        host = self.handler.headers.get("Host", "localhost")
        return f"{proto}://{host}"

    def own_invitation(self, invitation_id) -> sqlite3.Row:
        user = self.require_user()
        row = self.conn.execute(
            "SELECT * FROM invitations WHERE id = ? AND user_id = ?", (int(invitation_id), user["id"])
        ).fetchone()
        if not row:
            raise ApiError(404, "Undangan tidak ditemukan.")
        return row


def session_cookie(token: str, max_age: int) -> tuple[str, str]:
    parts = [f"sid={token}", "Path=/", "HttpOnly", "SameSite=Lax", f"Max-Age={max_age}"]
    if SECURE_COOKIES:
        parts.append("Secure")
    return ("Set-Cookie", "; ".join(parts))


# --------------------------------------------------------------------------- #
# Routing
# --------------------------------------------------------------------------- #
ROUTES: list[tuple[str, re.Pattern, callable]] = []


def route(method: str, pattern: str):
    def decorator(fn):
        ROUTES.append((method, re.compile("^" + pattern + "$"), fn))
        return fn
    return decorator


# ----- Auth ------------------------------------------------------------------
def start_session(req: Request, user_id: int) -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    req.conn.execute(
        "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
        (token_hash(token), user_id, int(time.time()) + SESSION_SECONDS),
    )
    return session_cookie(token, SESSION_SECONDS)


@route("POST", r"/api/auth/register")
def register(req: Request):
    if not LIMITER.allow(f"register:{req.ip}", 8, 3600):
        raise ApiError(429, "Terlalu banyak percobaan. Coba lagi nanti.")
    data = req.json()
    email = clean_text(data.get("email"), 254).lower()
    name = clean_text(data.get("name"), 80)
    password = str(data.get("password") or "")
    if not EMAIL_RE.match(email):
        raise ApiError(400, "Email tidak valid.")
    if not name:
        raise ApiError(400, "Nama wajib diisi.")
    if len(password) < 8 or len(password) > 200:
        raise ApiError(400, "Kata sandi minimal 8 karakter.")
    if req.conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        raise ApiError(409, "Email sudah terdaftar. Silakan masuk.")
    cursor = req.conn.execute(
        "INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
        (email, name, hash_password(password), now_iso()),
    )
    cookie = start_session(req, cursor.lastrowid)
    return json_response({"user": {"id": cursor.lastrowid, "email": email, "name": name}}, 201, [cookie])


@route("POST", r"/api/auth/login")
def login(req: Request):
    data = req.json()
    email = clean_text(data.get("email"), 254).lower()
    if not LIMITER.allow(f"login:{req.ip}", 20, 900) or not LIMITER.allow(f"login-email:{email}", 10, 900):
        raise ApiError(429, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.")
    row = req.conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row or not verify_password(str(data.get("password") or ""), row["password_hash"]):
        raise ApiError(401, "Email atau kata sandi salah.")
    cookie = start_session(req, row["id"])
    return json_response({"user": {"id": row["id"], "email": row["email"], "name": row["name"]}}, 200, [cookie])


@route("POST", r"/api/auth/logout")
def logout(req: Request):
    token = req.cookie("sid")
    if token:
        req.conn.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash(token),))
    return json_response({"ok": True}, 200, [session_cookie("", 0)])


@route("GET", r"/api/auth/me")
def me(req: Request):
    user = req.user
    if not user:
        return {"user": None, "appName": APP_NAME}
    return {"user": {"id": user["id"], "email": user["email"], "name": user["name"]}, "appName": APP_NAME}


@route("POST", r"/api/auth/password")
def change_password(req: Request):
    user = req.require_user()
    data = req.json()
    row = req.conn.execute("SELECT password_hash FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not verify_password(str(data.get("current") or ""), row["password_hash"]):
        raise ApiError(400, "Kata sandi lama salah.")
    new_password = str(data.get("password") or "")
    if len(new_password) < 8:
        raise ApiError(400, "Kata sandi minimal 8 karakter.")
    req.conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_password), user["id"]))
    req.conn.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
    cookie = start_session(req, user["id"])
    return json_response({"ok": True}, 200, [cookie])


@route("POST", r"/api/auth/forgot")
def forgot_password(req: Request):
    data = req.json()
    email = clean_text(data.get("email"), 254).lower()
    if not LIMITER.allow(f"forgot:{req.ip}", 5, 900) or not LIMITER.allow(f"forgot-email:{email}", 3, 900):
        raise ApiError(429, "Terlalu banyak permintaan. Coba lagi dalam 15 menit.")
    user = req.conn.execute("SELECT id, name, email FROM users WHERE email = ?", (email,)).fetchone()
    if user and not user["email"].endswith(".local"):
        token = secrets.token_urlsafe(32)
        req.conn.execute("DELETE FROM password_resets WHERE user_id = ?", (user["id"],))
        req.conn.execute(
            "INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            (token_hash(token), user["id"], int(time.time()) + RESET_TOKEN_SECONDS),
        )
        link = f"{req.base_url()}/app#/reset?token={token}"
        send_email(
            user["email"],
            f"Atur ulang kata sandi {APP_NAME}",
            f"Halo {user['name']},\n\nKlik link berikut untuk membuat kata sandi baru (berlaku 1 jam):\n{link}\n\n"
            "Jika Anda tidak meminta ini, abaikan email ini.",
            email_html(
                "Atur ulang kata sandi",
                [f"Halo {html.escape(user['name'])},",
                 "Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Link berlaku selama 1 jam.",
                 "Jika Anda tidak meminta ini, abaikan email ini — kata sandi Anda tidak berubah."],
                ("Buat kata sandi baru", link),
            ),
        )
    # Same response whether or not the email exists (no account enumeration).
    return {"ok": True}


@route("POST", r"/api/auth/reset")
def reset_password(req: Request):
    data = req.json()
    token = str(data.get("token") or "")
    password = str(data.get("password") or "")
    if not LIMITER.allow(f"reset:{req.ip}", 10, 900):
        raise ApiError(429, "Terlalu banyak percobaan. Coba lagi nanti.")
    if len(password) < 8 or len(password) > 200:
        raise ApiError(400, "Kata sandi minimal 8 karakter.")
    row = req.conn.execute(
        "SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > ?",
        (token_hash(token), int(time.time())),
    ).fetchone()
    if not row:
        raise ApiError(400, "Link tidak valid atau sudah kedaluwarsa. Minta link baru.")
    user_id = row["user_id"]
    req.conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(password), user_id))
    req.conn.execute("DELETE FROM password_resets WHERE user_id = ?", (user_id,))
    req.conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    cookie = start_session(req, user_id)
    user = req.conn.execute("SELECT id, email, name FROM users WHERE id = ?", (user_id,)).fetchone()
    return json_response({"user": dict(user)}, 200, [cookie])


@route("POST", r"/api/auth/delete-account")
def delete_account(req: Request):
    user = req.require_user()
    data = req.json()
    row = req.conn.execute("SELECT password_hash FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not verify_password(str(data.get("password") or ""), row["password_hash"]):
        raise ApiError(400, "Kata sandi salah.")
    invitation_ids = [r["id"] for r in req.conn.execute("SELECT id FROM invitations WHERE user_id = ?", (user["id"],))]
    req.conn.execute("DELETE FROM users WHERE id = ?", (user["id"],))
    for invitation_id in invitation_ids:
        shutil.rmtree(UPLOAD_DIR / str(invitation_id), ignore_errors=True)
    return json_response({"ok": True}, 200, [session_cookie("", 0)])


# ----- Invitations -------------------------------------------------------------
def invitation_stats(conn, invitation_id: int) -> dict:
    g = conn.execute(
        """SELECT COUNT(*) AS total,
                  COALESCE(SUM(sent_at IS NOT NULL), 0) AS sent,
                  COALESCE(SUM(opened_at IS NOT NULL), 0) AS opened,
                  COALESCE(SUM(checked_in_at IS NOT NULL), 0) AS checked_in,
                  COALESCE(SUM(checked_in_count), 0) AS checked_in_pax
           FROM guests WHERE invitation_id = ?""",
        (invitation_id,),
    ).fetchone()
    r = conn.execute(
        """SELECT COUNT(*) AS total,
                  COALESCE(SUM(attendance = 'yes'), 0) AS yes,
                  COALESCE(SUM(attendance = 'no'), 0) AS no,
                  COALESCE(SUM(attendance = 'maybe'), 0) AS maybe,
                  COALESCE(SUM(CASE WHEN attendance = 'yes' THEN guests ELSE 0 END), 0) AS pax,
                  COALESCE(SUM(message <> ''), 0) AS wishes
           FROM rsvps WHERE invitation_id = ?""",
        (invitation_id,),
    ).fetchone()
    return {
        "guests": g["total"], "sent": g["sent"], "opened": g["opened"],
        "checkedIn": g["checked_in"], "checkedInPax": g["checked_in_pax"],
        "responses": r["total"], "yes": r["yes"], "no": r["no"], "maybe": r["maybe"],
        "pax": r["pax"], "wishes": r["wishes"],
    }


def invitation_summary(conn, row) -> dict:
    config = json.loads(row["config"])
    couple = config.get("couple", {})
    return {
        "id": row["id"],
        "slug": row["slug"],
        "published": bool(row["published"]),
        "groom": couple.get("groom", {}).get("nickname", ""),
        "bride": couple.get("bride", {}).get("nickname", ""),
        "weddingDate": config.get("weddingDate", ""),
        "theme": config.get("theme", "sage"),
        "updatedAt": row["updated_at"],
        "stats": invitation_stats(conn, row["id"]),
    }


@route("GET", r"/api/invitations")
def list_invitations(req: Request):
    user = req.require_user()
    rows = req.conn.execute(
        "SELECT * FROM invitations WHERE user_id = ? ORDER BY updated_at DESC", (user["id"],)
    ).fetchall()
    return {"invitations": [invitation_summary(req.conn, r) for r in rows]}


@route("GET", r"/api/slug-check")
def slug_check(req: Request):
    req.require_user()
    exclude = req.query.get("exclude")
    try:
        validate_slug(req.conn, req.query.get("slug", ""), int(exclude) if exclude else None)
        return {"available": True}
    except ApiError as err:
        return {"available": False, "message": err.message}


def encode_config(config) -> str:
    if not isinstance(config, dict):
        raise ApiError(400, "Konfigurasi tidak valid.")
    text = json.dumps(sanitize_config(config), ensure_ascii=False)
    if len(text.encode()) > MAX_CONFIG_BYTES:
        raise ApiError(413, "Konfigurasi terlalu besar.")
    return text


@route("POST", r"/api/invitations")
def create_invitation(req: Request):
    user = req.require_user()
    count = req.conn.execute("SELECT COUNT(*) FROM invitations WHERE user_id = ?", (user["id"],)).fetchone()[0]
    if count >= MAX_INVITATIONS_PER_USER:
        raise ApiError(400, f"Maksimal {MAX_INVITATIONS_PER_USER} undangan per akun.")
    data = req.json()
    slug = validate_slug(req.conn, data.get("slug", ""))
    config_text = encode_config(data.get("config") or {})
    stamp = now_iso()
    cursor = req.conn.execute(
        "INSERT INTO invitations (user_id, slug, config, published, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
        (user["id"], slug, config_text, stamp, stamp),
    )
    row = req.conn.execute("SELECT * FROM invitations WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return json_response({"invitation": invitation_summary(req.conn, row)}, 201)


@route("GET", r"/api/invitations/(\d+)")
def get_invitation(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    return {
        "id": row["id"],
        "slug": row["slug"],
        "published": bool(row["published"]),
        "config": json.loads(row["config"]),
        "url": f"{req.base_url()}/i/{row['slug']}",
        "stats": invitation_stats(req.conn, row["id"]),
    }


@route("PUT", r"/api/invitations/(\d+)")
def update_invitation(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    data = req.json()
    slug = row["slug"]
    config_text = row["config"]
    published = row["published"]
    if "slug" in data and data["slug"] != row["slug"]:
        slug = validate_slug(req.conn, data["slug"], row["id"])
    if "config" in data:
        config_text = encode_config(data["config"])
    if "published" in data:
        published = 1 if data["published"] else 0
    req.conn.execute(
        "UPDATE invitations SET slug = ?, config = ?, published = ?, updated_at = ? WHERE id = ?",
        (slug, config_text, published, now_iso(), row["id"]),
    )
    return {"ok": True, "slug": slug, "published": bool(published), "url": f"{req.base_url()}/i/{slug}"}


@route("DELETE", r"/api/invitations/(\d+)")
def delete_invitation(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    req.conn.execute("DELETE FROM invitations WHERE id = ?", (row["id"],))
    shutil.rmtree(UPLOAD_DIR / str(row["id"]), ignore_errors=True)
    return {"ok": True}


@route("POST", r"/api/invitations/(\d+)/upload")
def upload_file(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    if not LIMITER.allow(f"upload:{row['id']}", 60, 600):
        raise ApiError(429, "Terlalu banyak unggahan. Tunggu sebentar.")
    used = req.conn.execute("SELECT COUNT(*) FROM uploads WHERE invitation_id = ?", (row["id"],)).fetchone()[0]
    if used >= MAX_UPLOADS_PER_INVITATION:
        raise ApiError(400, f"Batas {MAX_UPLOADS_PER_INVITATION} file per undangan tercapai.")
    data = req.raw_body(MAX_AUDIO_BYTES)
    ext, kind = sniff_upload(data)
    if not ext:
        raise ApiError(400, "Format file tidak didukung (JPG, PNG, WEBP, GIF, atau MP3).")
    if kind == "image" and len(data) > MAX_IMAGE_BYTES:
        raise ApiError(413, "Ukuran foto maksimal 6 MB.")
    folder = UPLOAD_DIR / str(row["id"])
    folder.mkdir(parents=True, exist_ok=True)
    filename = f"{secrets.token_urlsafe(12)}.{ext}"
    (folder / filename).write_bytes(data)
    req.conn.execute(
        "INSERT INTO uploads (invitation_id, filename, kind, size, created_at) VALUES (?, ?, ?, ?, ?)",
        (row["id"], filename, kind, len(data), now_iso()),
    )
    return json_response({"url": f"/uploads/{row['id']}/{filename}", "kind": kind}, 201)


# ----- Guests ------------------------------------------------------------------
def guest_payload(row) -> dict:
    keys = row.keys()
    return {
        "id": row["id"],
        "code": row["code"],
        "name": row["name"],
        "phone": row["phone"],
        "pax": row["pax"],
        "group": row["grp"],
        "source": row["source"],
        "sentAt": row["sent_at"],
        "openedAt": row["opened_at"],
        "openCount": row["open_count"],
        "checkedInAt": row["checked_in_at"],
        "checkedInCount": row["checked_in_count"],
        "rsvp": {
            "attendance": row["attendance"],
            "guests": row["rsvp_guests"],
            "message": row["message"],
            "updatedAt": row["rsvp_at"],
        } if "attendance" in keys and row["attendance"] else None,
    }


GUEST_SELECT = """
    SELECT g.*, r.attendance, r.guests AS rsvp_guests, r.message, r.updated_at AS rsvp_at
    FROM guests g LEFT JOIN rsvps r ON r.guest_id = g.id
"""


@route("GET", r"/api/invitations/(\d+)/guests")
def list_guests(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    rows = req.conn.execute(GUEST_SELECT + " WHERE g.invitation_id = ? ORDER BY g.id DESC", (row["id"],)).fetchall()
    return {"guests": [guest_payload(r) for r in rows], "stats": invitation_stats(req.conn, row["id"])}


@route("POST", r"/api/invitations/(\d+)/guests")
def add_guests(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    data = req.json()
    items = data.get("guests")
    if not isinstance(items, list) or not items:
        raise ApiError(400, "Daftar tamu kosong.")
    if len(items) > 1000:
        raise ApiError(400, "Maksimal 1000 tamu per sekali tambah.")
    existing = req.conn.execute("SELECT COUNT(*) FROM guests WHERE invitation_id = ?", (row["id"],)).fetchone()[0]
    if existing + len(items) > MAX_GUESTS_PER_INVITATION:
        raise ApiError(400, f"Maksimal {MAX_GUESTS_PER_INVITATION} tamu per undangan.")
    default_pax = clamp_int(json.loads(row["config"]).get("rsvp", {}).get("defaultPax"), 1, 20, 2)
    created = []
    stamp = now_iso()
    for item in items:
        if not isinstance(item, dict):
            continue
        name = clean_text(item.get("name"), 80)
        if not name:
            continue
        code = new_guest_code(req.conn, row["id"])
        cursor = req.conn.execute(
            """INSERT INTO guests (invitation_id, code, name, phone, pax, grp, source, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 'list', ?)""",
            (row["id"], code, name, normalise_phone(item.get("phone")),
             clamp_int(item.get("pax"), 1, 20, default_pax), clean_text(item.get("group"), 40), stamp),
        )
        created.append(cursor.lastrowid)
    return json_response({"created": len(created)}, 201)


@route("PUT", r"/api/invitations/(\d+)/guests/(\d+)")
def update_guest(req: Request, invitation_id, guest_id):
    row = req.own_invitation(invitation_id)
    guest = req.conn.execute(
        "SELECT * FROM guests WHERE id = ? AND invitation_id = ?", (int(guest_id), row["id"])
    ).fetchone()
    if not guest:
        raise ApiError(404, "Tamu tidak ditemukan.")
    data = req.json()
    fields = {
        "name": clean_text(data["name"], 80) if "name" in data else guest["name"],
        "phone": normalise_phone(data["phone"]) if "phone" in data else guest["phone"],
        "pax": clamp_int(data["pax"], 1, 20, guest["pax"]) if "pax" in data else guest["pax"],
        "grp": clean_text(data["group"], 40) if "group" in data else guest["grp"],
        "sent_at": guest["sent_at"],
        "checked_in_at": guest["checked_in_at"],
        "checked_in_count": guest["checked_in_count"],
    }
    if not fields["name"]:
        raise ApiError(400, "Nama tamu wajib diisi.")
    if "sent" in data:
        fields["sent_at"] = (guest["sent_at"] or now_iso()) if data["sent"] else None
    if "checkedIn" in data:
        if data["checkedIn"]:
            fields["checked_in_at"] = guest["checked_in_at"] or now_iso()
            fields["checked_in_count"] = clamp_int(data.get("checkedInCount"), 1, 50, max(1, guest["checked_in_count"]))
        else:
            fields["checked_in_at"] = None
            fields["checked_in_count"] = 0
    req.conn.execute(
        """UPDATE guests SET name = ?, phone = ?, pax = ?, grp = ?, sent_at = ?, checked_in_at = ?, checked_in_count = ?
           WHERE id = ?""",
        (*fields.values(), guest["id"]),
    )
    updated = req.conn.execute(GUEST_SELECT + " WHERE g.id = ?", (guest["id"],)).fetchone()
    return {"guest": guest_payload(updated)}


@route("DELETE", r"/api/invitations/(\d+)/guests/(\d+)")
def delete_guest(req: Request, invitation_id, guest_id):
    row = req.own_invitation(invitation_id)
    req.conn.execute("DELETE FROM guests WHERE id = ? AND invitation_id = ?", (int(guest_id), row["id"]))
    return {"ok": True}


@route("POST", r"/api/invitations/(\d+)/checkin")
def check_in(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    data = req.json()
    raw_code = clean_text(data.get("code"), 200).upper()
    code = raw_code.split("|")[0].strip()          # QR content is "CODE|name|pax"
    code = re.sub(r"^INV-", "", code)
    guest = req.conn.execute(
        GUEST_SELECT + " WHERE g.invitation_id = ? AND g.code = ?", (row["id"], code)
    ).fetchone()
    if not guest:
        raise ApiError(404, f"Kode {code or '-'} tidak ditemukan.")
    already = guest["checked_in_at"] is not None
    if data.get("confirm"):
        count = clamp_int(data.get("count"), 1, 50, guest["rsvp_guests"] or 1)
        req.conn.execute(
            "UPDATE guests SET checked_in_at = COALESCE(checked_in_at, ?), checked_in_count = ? WHERE id = ?",
            (now_iso(), count, guest["id"]),
        )
        guest = req.conn.execute(GUEST_SELECT + " WHERE g.id = ?", (guest["id"],)).fetchone()
    return {"guest": guest_payload(guest), "alreadyCheckedIn": already, "stats": invitation_stats(req.conn, row["id"])}


# ----- RSVPs (owner) ----------------------------------------------------------
@route("GET", r"/api/invitations/(\d+)/rsvps")
def list_rsvps(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    rows = req.conn.execute(
        """SELECT r.*, g.name AS invited_as, g.code, g.grp, g.pax, g.source
           FROM rsvps r JOIN guests g ON g.id = r.guest_id
           WHERE r.invitation_id = ? ORDER BY r.updated_at DESC""",
        (row["id"],),
    ).fetchall()
    return {
        "rsvps": [
            {
                "id": r["id"], "name": r["name"], "invitedAs": r["invited_as"], "code": r["code"],
                "group": r["grp"], "pax": r["pax"], "source": r["source"], "attendance": r["attendance"],
                "guests": r["guests"], "message": r["message"], "hidden": bool(r["hidden"]),
                "createdAt": r["created_at"], "updatedAt": r["updated_at"],
            }
            for r in rows
        ],
        "stats": invitation_stats(req.conn, row["id"]),
    }


@route("PUT", r"/api/invitations/(\d+)/rsvps/(\d+)")
def update_rsvp(req: Request, invitation_id, rsvp_id):
    row = req.own_invitation(invitation_id)
    data = req.json()
    req.conn.execute(
        "UPDATE rsvps SET hidden = ? WHERE id = ? AND invitation_id = ?",
        (1 if data.get("hidden") else 0, int(rsvp_id), row["id"]),
    )
    return {"ok": True}


@route("DELETE", r"/api/invitations/(\d+)/rsvps/(\d+)")
def delete_rsvp(req: Request, invitation_id, rsvp_id):
    row = req.own_invitation(invitation_id)
    req.conn.execute("DELETE FROM rsvps WHERE id = ? AND invitation_id = ?", (int(rsvp_id), row["id"]))
    return {"ok": True}


@route("GET", r"/api/invitations/(\d+)/export\.csv")
def export_csv(req: Request, invitation_id):
    row = req.own_invitation(invitation_id)
    rows = req.conn.execute(GUEST_SELECT + " WHERE g.invitation_id = ? ORDER BY g.name COLLATE NOCASE", (row["id"],)).fetchall()
    labels = {"yes": "Hadir", "no": "Tidak Hadir", "maybe": "Masih Ragu"}
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Nama", "Grup", "WhatsApp", "Kode", "Link", "Maks Tamu", "Status RSVP",
                     "Jumlah Hadir", "Ucapan", "Undangan Dikirim", "Dibuka", "Check-in", "Jumlah Check-in", "Sumber"])
    base = f"{req.base_url()}/i/{row['slug']}?g="

    def cell(value):
        text = "" if value is None else str(value)
        return "'" + text if text[:1] in ("=", "+", "-", "@") else text   # CSV formula-injection guard

    for g in rows:
        writer.writerow([cell(v) for v in [
            g["name"], g["grp"], g["phone"], g["code"], base + g["code"], g["pax"],
            labels.get(g["attendance"], "Belum"), g["rsvp_guests"] or 0, g["message"] or "",
            g["sent_at"] or "", g["opened_at"] or "", g["checked_in_at"] or "", g["checked_in_count"],
            "Daftar tamu" if g["source"] == "list" else "Link umum",
        ]])
    body = ("\ufeff" + buffer.getvalue()).encode("utf-8")
    return Response(200, body, "text/csv; charset=utf-8",
                    [("Content-Disposition", f'attachment; filename="tamu-{row["slug"]}.csv"')])


# ----- Public (guests) --------------------------------------------------------
def load_public_invitation(req: Request, slug: str):
    row = req.conn.execute("SELECT * FROM invitations WHERE slug = ?", (slug,)).fetchone()
    if not row:
        return None, False
    user = req.user
    is_owner = bool(user and user["id"] == row["user_id"])
    if not row["published"] and not is_owner:
        return None, False
    return row, is_owner


def public_guest(conn, invitation_id: int, code: str | None):
    if not code:
        return None
    code = re.sub(r"[^A-Z0-9]", "", code.upper())[:12]
    guest = conn.execute(GUEST_SELECT + " WHERE g.invitation_id = ? AND g.code = ?", (invitation_id, code)).fetchone()
    if not guest:
        return None
    return {
        "name": guest["name"],
        "pax": guest["pax"],
        "code": guest["code"],
        "rsvp": {
            "attendance": guest["attendance"],
            "guests": guest["rsvp_guests"],
            "message": guest["message"],
        } if guest["attendance"] else None,
    }


@route("GET", r"/api/public/([a-z0-9-]+)")
def public_invitation(req: Request, slug):
    row, is_owner = load_public_invitation(req, slug)
    if not row:
        raise ApiError(404, "Undangan tidak ditemukan.")
    return {
        "slug": row["slug"],
        "published": bool(row["published"]),
        "preview": is_owner,
        "config": public_config(row["config"]),
        "guest": public_guest(req.conn, row["id"], req.query.get("g")),
    }


@route("POST", r"/api/public/([a-z0-9-]+)/rsvp")
def public_rsvp(req: Request, slug):
    row, _is_owner = load_public_invitation(req, slug)
    if not row:
        raise ApiError(404, "Undangan tidak ditemukan.")
    if not LIMITER.allow(f"rsvp:{req.ip}:{row['id']}", 15, 600):
        raise ApiError(429, "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.")
    data = req.json()
    name = clean_text(data.get("name"), 80)
    attendance = data.get("attendance")
    message = clean_text(data.get("message"), 500)
    if not name or attendance not in ATTENDANCE:
        raise ApiError(400, "Mohon isi nama dan pilih kehadiran.")
    config = json.loads(row["config"])
    if config.get("rsvp", {}).get("enabled") is False:
        raise ApiError(400, "RSVP sudah ditutup.")

    code = re.sub(r"[^A-Z0-9]", "", str(data.get("guestCode") or "").upper())[:12]
    guest = None
    if code:
        guest = req.conn.execute(
            "SELECT * FROM guests WHERE invitation_id = ? AND code = ?", (row["id"], code)
        ).fetchone()
    stamp = now_iso()
    if not guest:
        total = req.conn.execute("SELECT COUNT(*) FROM guests WHERE invitation_id = ?", (row["id"],)).fetchone()[0]
        if total >= MAX_GUESTS_PER_INVITATION:
            raise ApiError(400, "Kuota tamu undangan ini sudah penuh.")
        if not LIMITER.allow(f"rsvp-new:{req.ip}:{row['id']}", 6, 3600):
            raise ApiError(429, "Terlalu banyak konfirmasi baru dari perangkat ini.")
        default_pax = clamp_int(config.get("rsvp", {}).get("defaultPax"), 1, 20, 2)
        code = new_guest_code(req.conn, row["id"])
        cursor = req.conn.execute(
            """INSERT INTO guests (invitation_id, code, name, pax, grp, source, created_at)
               VALUES (?, ?, ?, ?, '', 'rsvp', ?)""",
            (row["id"], code, name, default_pax, stamp),
        )
        guest = req.conn.execute("SELECT * FROM guests WHERE id = ?", (cursor.lastrowid,)).fetchone()

    count = 0 if attendance == "no" else clamp_int(data.get("guests"), 1, guest["pax"], 1)
    req.conn.execute(
        """INSERT INTO rsvps (invitation_id, guest_id, name, attendance, guests, message, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(guest_id) DO UPDATE SET
               name = excluded.name, attendance = excluded.attendance, guests = excluded.guests,
               message = excluded.message, updated_at = excluded.updated_at""",
        (row["id"], guest["id"], name, attendance, count, message, stamp, stamp),
    )
    if config.get("admin", {}).get("notifyEmail"):
        notify_owner_of_rsvp(req, row, config, name, attendance, count, message)
    return {"ok": True, "code": guest["code"], "name": name, "attendance": attendance, "guests": count}


def notify_owner_of_rsvp(req: Request, invitation, config, name, attendance, count, message) -> None:
    owner = req.conn.execute("SELECT email FROM users WHERE id = ?", (invitation["user_id"],)).fetchone()
    if not owner or owner["email"].endswith(".local"):
        return
    label = {"yes": f"Hadir ({count} orang)", "no": "Tidak hadir", "maybe": "Masih ragu"}[attendance]
    couple = config.get("couple", {})
    names = f"{couple.get('groom', {}).get('nickname', '')} & {couple.get('bride', {}).get('nickname', '')}"
    link = f"{req.base_url()}/app#/inv/{invitation['id']}/rsvp"
    lines = [f"<b>{html.escape(name)}</b> — {html.escape(label)}"]
    if message:
        lines.append(f"“{html.escape(message)}”")
    send_email(
        owner["email"],
        f"RSVP baru: {name} — {label}",
        f"RSVP baru untuk undangan {names}:\n\n{name} — {label}\n{message}\n\nLihat semua: {link}",
        email_html(f"RSVP baru · {names}", lines, ("Lihat semua RSVP", link)),
    )


@route("POST", r"/api/public/([a-z0-9-]+)/open")
def public_open(req: Request, slug):
    """Called by the invitation page's JavaScript (link-preview bots don't run JS)."""
    row, is_owner = load_public_invitation(req, slug)
    if not row or is_owner:
        return {"ok": True}
    if not LIMITER.allow(f"open:{req.ip}:{row['id']}", 30, 600):
        return {"ok": True}
    code = re.sub(r"[^A-Z0-9]", "", str(req.json().get("guestCode") or "").upper())[:12]
    if code:
        req.conn.execute(
            """UPDATE guests SET opened_at = COALESCE(opened_at, ?), open_count = open_count + 1
               WHERE invitation_id = ? AND code = ?""",
            (now_iso(), row["id"], code),
        )
    return {"ok": True}


@route("GET", r"/api/public/([a-z0-9-]+)/wishes")
def public_wishes(req: Request, slug):
    row, _ = load_public_invitation(req, slug)
    if not row:
        raise ApiError(404, "Undangan tidak ditemukan.")
    offset = clamp_int(req.query.get("offset"), 0, 100_000, 0)
    limit = clamp_int(req.query.get("limit"), 1, 50, 10)
    where = "invitation_id = ? AND hidden = 0 AND message <> ''"
    total = req.conn.execute(f"SELECT COUNT(*) FROM rsvps WHERE {where}", (row["id"],)).fetchone()[0]
    rows = req.conn.execute(
        f"SELECT id, name, attendance, message, updated_at FROM rsvps WHERE {where} ORDER BY updated_at DESC LIMIT ? OFFSET ?",
        (row["id"], limit, offset),
    ).fetchall()
    return {
        "total": total,
        "wishes": [
            {"id": r["id"], "name": r["name"], "attendance": r["attendance"], "message": r["message"], "time": r["updated_at"]}
            for r in rows
        ],
    }


# --------------------------------------------------------------------------- #
# Server-rendered invitation shell (link previews + inline data)
# --------------------------------------------------------------------------- #
ID_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
ID_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
             "Agustus", "September", "Oktober", "November", "Desember"]


def indo_date(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso)
    except (TypeError, ValueError):
        return ""
    return f"{ID_DAYS[dt.weekday()]}, {dt.day} {ID_MONTHS[dt.month - 1]} {dt.year}"


def render_invite_page(req: Request, slug: str) -> Response:
    row, is_owner = load_public_invitation(req, slug)
    if not row:
        return not_found_page()
    config = public_config(row["config"])
    guest = public_guest(req.conn, row["id"], req.query.get("g"))
    couple = config.get("couple", {})
    first, second = couple.get("groom", {}), couple.get("bride", {})
    if config.get("brideFirst"):
        first, second = second, first
    names = f"{first.get('nickname', '')} & {second.get('nickname', '')}"
    title = f"The Wedding of {names}"
    events = config.get("events") or [{}]
    city = events[0].get("venue", "")
    description = " · ".join(x for x in [indo_date(config.get("weddingDate", "")), city] if x)
    if guest:
        description = f"Kepada Yth. {guest['name']} — {description}"
    image = config.get("heroPhoto") or first.get("photo") or second.get("photo") or ""
    base = req.base_url()
    if image.startswith("/"):
        image = base + image
    esc = html.escape
    meta = [
        f"<title>{esc(title)}</title>",
        f'<meta name="description" content="{esc(description)}">',
        f'<meta property="og:title" content="{esc(title)}">',
        f'<meta property="og:description" content="{esc(description)}">',
        f'<meta property="og:url" content="{esc(base)}/i/{esc(row["slug"])}">',
        '<meta property="og:type" content="website">',
        '<meta name="robots" content="noindex, nofollow">',
    ]
    if image:
        meta.append(f'<meta property="og:image" content="{esc(image)}">')
        meta.append('<meta name="twitter:card" content="summary_large_image">')
    data = {
        "slug": row["slug"],
        "published": bool(row["published"]),
        "preview": is_owner,
        "config": config,
        "guest": guest,
        "appName": APP_NAME,
    }
    data_json = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    template = (PUBLIC_DIR / "invite.html").read_text(encoding="utf-8")
    page = template.replace("<!--META-->", "\n  ".join(meta)).replace("<!--DATA-->", data_json)
    return Response(200, page.encode("utf-8"), "text/html; charset=utf-8",
                    [("Cache-Control", "no-store"), ("X-Robots-Tag", "noindex")])


def not_found_page() -> Response:
    page = f"""<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Tidak ditemukan · {html.escape(APP_NAME)}</title>
<link rel="stylesheet" href="/assets/app.css"></head>
<body class="center-page"><main class="notfound"><h1>404</h1><p>Undangan atau halaman tidak ditemukan,
atau belum dipublikasikan.</p><a class="btn btn-primary" href="/">Ke beranda</a></main></body></html>"""
    return Response(404, page.encode(), "text/html; charset=utf-8")


# --------------------------------------------------------------------------- #
# HTTP handler
# --------------------------------------------------------------------------- #
class Handler(BaseHTTPRequestHandler):
    server_version = "UndanganKita"
    sys_version = ""
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # concise access log
        sys.stderr.write(f"{self.log_date_time_string()} {self.address_string()} {fmt % args}\n")

    def do_GET(self):
        self.dispatch("GET")

    def do_HEAD(self):
        self.dispatch("GET", head=True)

    def do_POST(self):
        self.dispatch("POST")

    def do_PUT(self):
        self.dispatch("PUT")

    def do_DELETE(self):
        self.dispatch("DELETE")

    # -- responses ----------------------------------------------------------
    def send(self, response: Response, head: bool = False) -> None:
        self.send_response(response.status)
        self.send_header("Content-Type", response.content_type)
        self.send_header("Content-Length", str(len(response.body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        if response.content_type.startswith("text/html"):
            self.send_header("Content-Security-Policy", CSP)
        if SECURE_COOKIES:
            self.send_header("Strict-Transport-Security", "max-age=31536000")
        names = {h[0].lower() for h in response.headers}
        if "cache-control" not in names:
            self.send_header("Cache-Control", "no-store")
        for name, value in response.headers:
            self.send_header(name, value)
        self.end_headers()
        if not head:
            self.wfile.write(response.body)

    def check_csrf(self) -> None:
        if self.headers.get("X-Requested-With") != "fetch":
            raise ApiError(403, "Permintaan ditolak.")
        origin = self.headers.get("Origin")
        if origin:
            host = self.headers.get("X-Forwarded-Host") if TRUST_PROXY and self.headers.get("X-Forwarded-Host") else self.headers.get("Host")
            if urlparse(origin).netloc != host:
                raise ApiError(403, "Permintaan lintas situs ditolak.")

    def dispatch(self, method: str, head: bool = False) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        req = Request(self, method, path, query)
        try:
            if path.startswith("/api/"):
                response = self.handle_api(req, method, path)
            else:
                response = self.handle_page(req, method, path)
            if req._conn is not None:
                req._conn.commit()
        except ApiError as err:
            if req._conn is not None:
                req._conn.rollback()
            response = json_response({"error": err.message}, err.status)
        except Exception:  # noqa: BLE001
            traceback.print_exc()
            if req._conn is not None:
                req._conn.rollback()
            response = json_response({"error": "Terjadi kesalahan pada server."}, 500)
        finally:
            if req._conn is not None:
                req._conn.close()
        # Drain unread request bodies so keep-alive connections stay in sync.
        if req._body is None and method in ("POST", "PUT", "DELETE"):
            length = int(self.headers.get("Content-Length") or 0)
            if 0 < length <= MAX_AUDIO_BYTES:
                self.rfile.read(length)
            elif length > MAX_AUDIO_BYTES:
                self.close_connection = True
        self.send(response, head)

    def handle_api(self, req: Request, method: str, path: str) -> Response:
        if method != "GET":
            self.check_csrf()
        for route_method, pattern, fn in ROUTES:
            if route_method != method:
                continue
            match = pattern.match(path)
            if match:
                result = fn(req, *match.groups())
                return result if isinstance(result, Response) else json_response(result)
        raise ApiError(404, "Endpoint tidak ditemukan.")

    def handle_page(self, req: Request, method: str, path: str) -> Response:
        if method != "GET":
            raise ApiError(405, "Method not allowed")
        if path == "/healthz":
            return Response(200, b"ok", "text/plain; charset=utf-8")
        if path == "/":
            return self.static_file(PUBLIC_DIR / "index.html", PUBLIC_DIR)
        if path in ("/app", "/app/"):
            return self.static_file(PUBLIC_DIR / "app.html", PUBLIC_DIR)
        if path.startswith("/assets/"):
            return self.static_file(PUBLIC_DIR / path.lstrip("/"), PUBLIC_DIR / "assets", "public, max-age=300")
        if path.startswith("/uploads/"):
            return self.static_file(UPLOAD_DIR / path[len("/uploads/"):], UPLOAD_DIR,
                                    "public, max-age=31536000, immutable")
        match = re.match(r"^/i/([a-z0-9-]{3,40})/?$", path)
        if match:
            return render_invite_page(req, match.group(1))
        return not_found_page()

    @staticmethod
    def static_file(target: Path, base: Path, cache: str = "no-cache") -> Response:
        try:
            resolved = target.resolve()
            base_resolved = base.resolve()
        except OSError:
            return not_found_page()
        if base_resolved not in resolved.parents and resolved != base_resolved:
            return not_found_page()
        if not resolved.is_file():
            return not_found_page()
        content_type = CONTENT_TYPES.get(resolved.suffix.lower(), "application/octet-stream")
        return Response(200, resolved.read_bytes(), content_type, [("Cache-Control", cache)])


# --------------------------------------------------------------------------- #
# Demo seed
# --------------------------------------------------------------------------- #
def seed_demo() -> None:
    seed_file = SEED_DIR / "demo.json"
    if not seed_file.exists():
        return
    conn = connect()
    try:
        if conn.execute("SELECT 1 FROM invitations WHERE slug = 'demo'").fetchone():
            return
        stamp = now_iso()
        cursor = conn.execute(
            "INSERT OR IGNORE INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
            ("demo@undangan.local", "Demo", hash_password(secrets.token_urlsafe(24)), stamp),
        )
        user_id = cursor.lastrowid or conn.execute(
            "SELECT id FROM users WHERE email = 'demo@undangan.local'"
        ).fetchone()[0]
        config = json.loads(seed_file.read_text(encoding="utf-8"))
        cursor = conn.execute(
            "INSERT INTO invitations (user_id, slug, config, published, created_at, updated_at) VALUES (?, 'demo', ?, 1, ?, ?)",
            (user_id, json.dumps(sanitize_config(config), ensure_ascii=False), stamp, stamp),
        )
        invitation_id = cursor.lastrowid
        samples = [
            ("Dimas & Sari", "yes", 2, "Selamat menempuh hidup baru! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah."),
            ("Tante Lina", "yes", 1, "Bahagia sekali mendengar kabar ini. Semoga langgeng sampai kakek nenek ya!"),
            ("Kevin", "no", 0, "Maaf belum bisa hadir, doa terbaik dari Singapura. Congrats both of you!"),
        ]
        for name, attendance, count, message in samples:
            code = new_guest_code(conn, invitation_id)
            guest_cursor = conn.execute(
                "INSERT INTO guests (invitation_id, code, name, pax, source, created_at) VALUES (?, ?, ?, 2, 'rsvp', ?)",
                (invitation_id, code, name, stamp),
            )
            conn.execute(
                """INSERT INTO rsvps (invitation_id, guest_id, name, attendance, guests, message, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (invitation_id, guest_cursor.lastrowid, name, attendance, count, message, stamp, stamp),
            )
        conn.commit()
    finally:
        conn.close()


class AppServer(ThreadingHTTPServer):
    daemon_threads = True
    # On Windows SO_REUSEADDR lets two processes bind the same port silently; refuse instead.
    allow_reuse_address = sys.platform != "win32"


def main() -> None:
    init_db()
    seed_demo()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    try:
        server = AppServer((host, port), Handler)
    except OSError as err:
        sys.exit(f"Cannot listen on port {port}: {err}. Set PORT to a free port.")
    print(f"{APP_NAME} running on http://localhost:{port}  (data: {DATA_DIR})", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
