<!-- HERO:START -->
<p align="center">
  <a href="https://juw12.github.io/undanu/"><img src="docs/media/banner.jpg" alt="Undanu: Digital wedding invitations for Indonesia." width="100%"></a>
</p>

<p align="center">
  <b>Digital wedding invitations for Indonesia.</b><br>
  Design an envelope-style invitation, send each guest a personal WhatsApp link, and check guests in with a QR e-pass.
</p>

<p align="center">
  <a href="https://juw12.github.io/undanu/"><b>Try it live</b></a> ·
  <a href="#see-it-in-action">See it in action</a> ·
  <a href="#highlights">Highlights</a> ·
  <a href="https://github.com/juw12">More by juw12</a>
</p>

<p align="center">
  <a href="https://github.com/juw12/undanu"><img src="https://img.shields.io/github/last-commit/juw12/undanu?label=updated&color=6b7d4f" alt="Last updated"></a>
  <a href="https://juw12.github.io/undanu/"><img src="https://img.shields.io/badge/demo-live-2ea44f" alt="Live demo"></a>
  <img src="https://img.shields.io/badge/Web-24292f" alt="Web">
  <img src="https://img.shields.io/badge/Python_%2B_SQLite-24292f" alt="Python + SQLite">
</p>

<a id="highlights"></a>
<table>
  <tr>
    <td width="33%" valign="top">
      <b>Personal links</b><br>
      Every guest gets their own WhatsApp link, so you can see who opened it and who is coming.
    </td>
    <td width="33%" valign="top">
      <b>Every faith</b><br>
      Templates for every religion in Indonesia, video covers and motion-photo galleries.
    </td>
    <td width="33%" valign="top">
      <b>On the day</b><br>
      QR e-pass check-in, wishes, song requests and gift confirmations.
    </td>
  </tr>
</table>

## See it in action

<p align="center">
  <a href="https://juw12.github.io/undanu/"><img src="docs/media/demo.png" alt="Undanu screenshot" width="820"></a><br>
  <sub>Open the interactive demo at <a href="https://juw12.github.io/undanu/">juw12.github.io/undanu/</a></sub>
</p>
<!-- HERO:END -->

## About

Digital wedding invitations for Indonesia, with RSVP and a guest book. Couples sign up, design an
envelope-style invitation with a live phone preview, send each guest a personal link on WhatsApp,
see who opened it and who's coming, and check guests in with a QR e-pass on the wedding day.

**Live demo (static):** https://juw12.github.io/undanu/ · [demo invitation](https://juw12.github.io/undanu/demo/?to=Bapak%20Budi%20%26%20Keluarga): one invitation, switchable between Umum, Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu and Kepercayaan (e.g. [`?agama=hindu`](https://juw12.github.io/undanu/demo/?agama=hindu))

[![tests](https://github.com/juw12/undanu/actions/workflows/tests.yml/badge.svg)](https://github.com/juw12/undanu/actions/workflows/tests.yml)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/juw12/undanu)

**Stack:** Python 3.9+ standard library only (`http.server`, `sqlite3`, `smtplib`) and vanilla JS.
Nothing to `pip install`, no build step.

## Features

**For couples (dashboard)**
- Account with email/password, **password reset by email**, change password, delete account (removes all data)
- **Equal templates for every religion recognised in Indonesia** — Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu —
  plus Penghayat Kepercayaan and a neutral *Umum* one: greeting, ceremony name (Akad Nikah, Pemberkatan, Sakramen Pernikahan,
  Pawiwahan, Li Yuan, …), quote/scripture, closing, and an optional cover symbol. No religion is
  preselected: couples pick their own when creating an invitation, and can switch any time. 8 colour themes
  that work with any tradition; the default **Ivory** theme (ink + rose gold, serif type) is deliberately
  free of religious colour cues. Landing page in Bahasa Indonesia and English
- Form editor with **live phone preview** and autosave: couple (Instagram/TikTok), events and maps, love story,
  dress code, RSVP settings, music upload or built-in tunes (Canon in D, Für Elise, Ode to Joy, gamelan)
- **Motion & video:** cover as photo, slideshow, or looping background video; gallery mixes photos, videos and
  **Android motion photos** (the embedded clip is extracted in the browser); pre-wedding video from YouTube,
  Vimeo, or an upload (MP4/MOV/WEBM up to 40 MB, streamed with HTTP range requests)
- **Live streaming:** YouTube/Vimeo embed or any link, with an automatic **LIVE** badge during the event
- **Gifts & donations:** your own bank/e-wallet accounts (one-tap copy) and QRIS image, plus a physical-gift address;
  or **donation mode** (in lieu of gifts) where guests transfer to your accounts/QRIS, with an optional "donations go to…" note.
  Rename the section (Tanda Kasih, Amplop Digital, Angpao, Dana Punia, … or your own). Guests can confirm what they sent,
  and the **Hadiah** tab totals it
- **Reviews:** couples can rate Undanu; approved reviews appear on the landing page (moderated by `ADMIN_EMAILS`)
- Publish/draft toggle and custom link (`/i/your-names`)
- **Guests:** add one, paste many, or import CSV; per-guest max guests and group; personal links (`?g=CODE`);
  one-click WhatsApp send with an editable template
- **Delivery tracking:** see who was sent the link and **who actually opened it** (link-preview bots aren't counted);
  filters for "sent, not opened" and "opened, no reply"; a **WhatsApp reminder** template for guests who haven't replied
- **RSVP dashboard:** attending/maybe/declined, head count, catering estimate, **song requests**, reply to or
  hide wishes, CSV export, optional **email notification for each new RSVP**
- **Wedding-day check-in:** scan the guest's QR e-pass with a phone camera, type the code, or search by name;
  live arrival counter

**For guests (invitation page)**
- Envelope cover with the guest's name, Bahasa Indonesia / English, countdown, Google Calendar/.ics,
  maps, gallery with lightbox (photos + videos), copy-to-clipboard gift cards and gift confirmation
- RSVP saved to the server (guests can change their answer), optional song request, and a QR e-pass if attending
- **Wishes wall** with likes (one per device) and the couple's replies
- **Share sheet:** WhatsApp, Facebook, X, Telegram, copy link, native share, and a generated
  **Instagram Story image** (1080×1920); hashtag links to Instagram
- WhatsApp link previews (title, date, guest name, cover photo) rendered on the server

## Run locally

```bash
python server.py            # → http://localhost:8000
```

On Windows you can also double-click `start.bat`.

- `/` is the landing page, `/app` is the couple's dashboard, and `/i/demo` is the sample invitation. It has a
  switcher for every religion/tradition (also `?agama=islam`, `?agama=hindu`, …; `?switcher=0` hides the bar).
  It is built on startup from `seed/demo.json` + `seed/demo_traditions.json` (see `demos.py`); the old
  `/i/demo-<religion>` links redirect to it
- Data (SQLite database, uploaded photos) is stored in `./data/`
- Without SMTP settings, emails (password reset, RSVP notifications) are saved as `.eml` files in `./data/outbox/`

Tests (with the server running):

```bash
python tests/smoke_test.py http://localhost:8000 ./data     # 74 API checks incl. email, video, gifts, reviews
```

## Deploy

GitHub Pages only hosts the static demo. The real app needs a host that runs Python and keeps a
**persistent disk** for `DATA_DIR`.

- **Render:** click *Deploy to Render* above (uses `render.yaml`: Docker + 1 GB disk at `/data`;
  disks need a paid instance). Then fill in the SMTP variables.
- **Railway / Fly.io:** deploy from the `Dockerfile`, attach a volume at `/data`, and set `SECURE_COOKIES=1` and `TRUST_PROXY=1`.
- **VPS:**
  ```bash
  docker build -t undanu .
  docker run -d -p 8000:8000 -v undangan_data:/data -e SECURE_COOKIES=1 -e TRUST_PROXY=1 undanu
  ```
  Put Caddy in front for HTTPS: `undanu.id { reverse_proxy localhost:8000 }`.

| Variable | Purpose |
|---|---|
| `PORT` | Port to listen on (default 8000) |
| `DATA_DIR` | Folder for `app.db`, `uploads/` and `outbox/` (must be persistent) |
| `SECURE_COOKIES=1` | Set when served over HTTPS (Secure cookies + HSTS) |
| `TRUST_PROXY=1` | Set behind a reverse proxy/PaaS so client IP and https are detected |
| `BASE_URL` | Optional public URL, e.g. `https://undanu.id` (used in emails/CSV links) |
| `APP_NAME` | Brand name |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_SSL=1` | Outgoing email |
| `ADMIN_EMAILS` | Comma-separated accounts that can moderate reviews at `/app#/admin` |

**Email with Gmail:** turn on 2-step verification, create an [App Password](https://myaccount.google.com/apppasswords), then set
`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=you@gmail.com`, `SMTP_PASSWORD=<app password>`, `SMTP_FROM=you@gmail.com`.
For higher volume use a transactional provider (Brevo, Mailgun, Resend SMTP).

**Backups:** copy `DATA_DIR` regularly, or `sqlite3 data/app.db ".backup backup.db"` while running.

To rebuild the GitHub Pages demo after changing the invitation design: `python tools/build_pages.py`.

## Security notes
- Owner-only access is checked on every invitation/guest/RSVP endpoint
- PBKDF2 password hashing; HttpOnly SameSite session cookies; sessions revoked on password change/reset
- Reset tokens are random, stored hashed, single-use, and expire after 1 hour; the forgot-password
  endpoint gives the same response for unknown emails
- CSRF: mutating requests require `X-Requested-With: fetch` and a same-origin `Origin`
- Uploads are checked by file signature (JPG/PNG/WEBP/GIF/MP3/MP4/MOV/WEBM; HEIC rejected), size-limited
  (6 MB images, 12 MB audio, 40 MB videos, 400 MB per invitation), and stored under random names
- Config URLs restricted to `http(s)` or the app's `/uploads/`; strict Content-Security-Policy; invitations are `noindex`
- CSV export guards against spreadsheet formula injection; rate limits on auth, RSVP, uploads, and open tracking

## Roadmap
- Payments (Midtrans/Xendit) for premium themes and verified digital gifts (today, gift amounts are self-reported by guests)
- Co-owner access so both partners and family can manage guests
- iPhone Live Photos: only the still is kept unless the MOV is uploaded separately
- Camera QR scanning uses the browser `BarcodeDetector` API (Chrome/Edge on Android/desktop over HTTPS);
  on iPhone, type the code or search by name

## License
MIT © Juwen Lie
