/* =====================================================================
   Dashboard SPA (vanilla JS, no build step).
   Routes: #/login #/register #/ #/inv/:id/edit|guests|rsvp|checkin #/account
   ===================================================================== */
(() => {
  'use strict';

  const P = window.PRESETS;
  const root = document.getElementById('app');
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  const state = {
    user: null,
    appName: 'UndanganKita',
    view: null,        // { onClick, onInput, onChange, onSubmit, cleanup }
  };

  /* ------------------------------------------------------------------ */
  /* Utilities                                                          */
  /* ------------------------------------------------------------------ */
  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H17a5 5 0 0 0 5-5c0-4.9-4.5-8.4-10-8.4z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5V22h16"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3z"/>',
    gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    whatsapp: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>'
  };
  const icon = (name) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function debounce(fn, wait) {
    let timer = null;
    const debounced = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
    debounced.flush = (...args) => {
      clearTimeout(timer);
      return fn(...args);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  }

  async function api(path, { method = 'GET', body, raw, headers } = {}) {
    const options = { method, credentials: 'same-origin', headers: { 'X-Requested-With': 'fetch', ...headers } };
    if (raw !== undefined) {
      options.body = raw;
    } else if (body !== undefined) {
      options.body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && !path.startsWith('/api/auth')) {
      state.user = null;
      location.hash = '#/login';
      throw new Error(data.error || 'Sesi berakhir. Silakan masuk lagi.');
    }
    if (!response.ok) {
      throw new Error(data.error || `Terjadi kesalahan (${response.status}).`);
    }
    return data;
  }

  let toastTimer = null;
  function toast(message, type = '') {
    const el = $('#toast');
    el.textContent = message;
    el.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.className = 'toast';
    }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
    } catch {
      /* ignore */
    }
    area.remove();
    return Promise.resolve();
  }

  function modal({ title, body, foot = '', onMount }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="close-x" data-close aria-label="Tutup">&times;</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    document.body.appendChild(wrap);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    function close() {
      wrap.remove();
      document.removeEventListener('keydown', onKey);
    }
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', (e) => {
      if (e.target === wrap) {
        close();
      }
    });
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) {
        close();
      }
    });
    const first = wrap.querySelector('input, select, textarea');
    if (first) {
      setTimeout(() => first.focus(), 50);
    }
    if (onMount) {
      onMount(wrap, close);
    }
    return { el: wrap, close };
  }

  function confirmDialog(message, { okText = 'Ya, lanjutkan', danger = false, title = 'Konfirmasi' } = {}) {
    return new Promise((resolve) => {
      let answered = false;
      modal({
        title,
        body: `<p>${esc(message)}</p>`,
        foot: `<button type="button" class="btn btn-ghost" data-close>Batal</button>
               <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(okText)}</button>`,
        onMount: (el, close) => {
          el.querySelector('[data-ok]').addEventListener('click', () => {
            answered = true;
            close();
            resolve(true);
          });
          const observer = new MutationObserver(() => {
            if (!document.body.contains(el)) {
              observer.disconnect();
              if (!answered) {
                resolve(false);
              }
            }
          });
          observer.observe(document.body, { childList: true });
        }
      });
    });
  }

  const tzById = (id) => P.timeZones.find((z) => z.id === id) || P.timeZones[0];

  function fmtDate(iso, tz, options) {
    if (!iso || Number.isNaN(new Date(iso).getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('id-ID', { timeZone: tz || 'Asia/Jakarta', ...options }).format(new Date(iso));
  }

  const longDate = (iso, tz) => fmtDate(iso, tz, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  function relTime(iso) {
    const seconds = (new Date(iso) - Date.now()) / 1000;
    if (!Number.isFinite(seconds)) {
      return '';
    }
    const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) {
        return rtf.format(Math.round(seconds / size), unit);
      }
    }
    return 'baru saja';
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, '-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function setPath(obj, path, value) {
    const keys = path.split('.');
    let node = obj;
    keys.slice(0, -1).forEach((key, i) => {
      if (node[key] == null || typeof node[key] !== 'object') {
        node[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      }
      node = node[key];
    });
    node[keys[keys.length - 1]] = value;
  }

  const initials = (name) => String(name || '?').trim().charAt(0).toUpperCase();
  const coupleTitle = (config) => {
    const groom = config.couple?.groom?.nickname || '…';
    const bride = config.couple?.bride?.nickname || '…';
    return config.brideFirst ? `${bride} & ${groom}` : `${groom} & ${bride}`;
  };
  const attendanceBadge = (a) => ({
    yes: '<span class="badge yes"><span class="dot"></span>Hadir</span>',
    no: '<span class="badge no"><span class="dot"></span>Tidak hadir</span>',
    maybe: '<span class="badge maybe"><span class="dot"></span>Masih ragu</span>'
  }[a] || '<span class="badge pending">Belum respon</span>');

  function pickFile(accept, multiple = false) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = multiple;
      input.addEventListener('change', () => resolve(Array.from(input.files || [])));
      input.click();
    });
  }

  async function compressImage(file, { maxSide = 1600, quality = 0.82 } = {}) {
    if (file.type === 'image/gif') {
      return file;
    }
    let bitmap = null;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      return file;
    }
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return blob && blob.size < file.size * 1.5 ? blob : file;
  }

  async function uploadFile(invitationId, blob) {
    const data = await api(`/api/invitations/${invitationId}/upload`, {
      method: 'POST',
      raw: blob,
      headers: { 'Content-Type': blob.type || 'application/octet-stream' }
    });
    return data.url;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    const delimiter = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else if (ch === '"') {
          quoted = false;
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === delimiter || ch === '\t') {
        row.push(cell);
        cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') {
          i += 1;
        }
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
  }

  function rowsToGuests(rows) {
    if (!rows.length) {
      return [];
    }
    const header = rows[0].map((h) => h.toLowerCase());
    const find = (...names) => header.findIndex((h) => names.some((n) => h.includes(n)));
    const hasHeader = find('nama', 'name') >= 0;
    const cols = hasHeader
      ? { name: find('nama', 'name'), phone: find('wa', 'whatsapp', 'phone', 'hp', 'telp', 'telepon'), pax: find('pax', 'jumlah', 'maks'), group: find('grup', 'group', 'kategori') }
      : { name: 0, phone: 1, pax: 2, group: 3 };
    return rows.slice(hasHeader ? 1 : 0).map((r) => ({
      name: r[cols.name] || '',
      phone: cols.phone >= 0 ? r[cols.phone] || '' : '',
      pax: cols.pax >= 0 ? parseInt(r[cols.pax], 10) || undefined : undefined,
      group: cols.group >= 0 ? r[cols.group] || '' : ''
    })).filter((g) => g.name);
  }

  function parseGuestLines(text) {
    return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const parts = line.split(/\s*[|\t;]\s*/);
      return {
        name: parts[0] || '',
        phone: parts[1] || '',
        pax: parseInt(parts[2], 10) || undefined,
        group: parts[3] || ''
      };
    }).filter((g) => g.name);
  }

  /* ------------------------------------------------------------------ */
  /* Shell                                                              */
  /* ------------------------------------------------------------------ */
  function topbar() {
    const user = state.user;
    return `
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="#/"><span class="brand-mark">U</span>${esc(state.appName)}</a>
          <span class="spacer"></span>
          ${user ? `
            <a class="btn btn-ghost btn-sm" href="#/">Undangan Saya</a>
            <a class="btn btn-ghost btn-sm btn-icon" href="#/account" title="Akun">${icon('settings')}</a>
            <span class="user-chip"><span class="avatar-sm">${esc(initials(user.name))}</span></span>
          ` : ''}
        </div>
      </header>`;
  }

  function shell(content) {
    root.innerHTML = `${topbar()}<main class="container">${content}</main>`;
  }

  function invHeader(inv, active) {
    const config = inv.config;
    const tabs = [
      ['edit', 'Editor', 'edit'],
      ['guests', 'Tamu & Kirim', 'users'],
      ['rsvp', 'RSVP & Ucapan', 'mail'],
      ['checkin', 'Check-in', 'scan']
    ];
    return `
      <div class="inv-head">
        <a href="#/" class="btn btn-ghost btn-sm btn-icon" title="Kembali">${icon('arrowLeft')}</a>
        <h1>${esc(coupleTitle(config))}</h1>
        ${inv.published ? '<span class="badge live"><span class="dot"></span>Live</span>' : '<span class="badge draft">Draft</span>'}
        <span class="spacer"></span>
        <a class="btn btn-ghost btn-sm" href="/i/${esc(inv.slug)}${inv.published ? '' : '?preview=1'}" target="_blank" rel="noopener">${icon('eye')} Lihat undangan</a>
      </div>
      <nav class="tabs">
        ${tabs.map(([key, label, ic]) => `<a href="#/inv/${inv.id}/${key}" class="${key === active ? 'active' : ''}">${icon(ic)} ${label}</a>`).join('')}
      </nav>`;
  }

  /* ------------------------------------------------------------------ */
  /* Router                                                             */
  /* ------------------------------------------------------------------ */
  const ROUTES = [
    [/^#\/login$/, () => viewAuth('login'), true],
    [/^#\/register$/, () => viewAuth('register'), true],
    [/^#\/forgot$/, () => viewForgot(), true],
    [/^#\/reset(\?.*)?$/, () => viewReset(), true],
    [/^#\/?$/, () => viewDashboard()],
    [/^#\/account$/, () => viewAccount()],
    [/^#\/inv\/(\d+)\/edit$/, (m) => viewEditor(Number(m[1]))],
    [/^#\/inv\/(\d+)\/guests$/, (m) => viewGuests(Number(m[1]))],
    [/^#\/inv\/(\d+)\/rsvp$/, (m) => viewRsvps(Number(m[1]))],
    [/^#\/inv\/(\d+)\/checkin$/, (m) => viewCheckin(Number(m[1]))]
  ];

  async function router() {
    if (state.view && state.view.cleanup) {
      try {
        await state.view.cleanup();
      } catch {
        /* ignore */
      }
    }
    state.view = null;
    const hash = location.hash || '#/';
    const match = ROUTES.map(([re, fn, isPublic]) => ({ m: hash.match(re), fn, isPublic })).find((r) => r.m);
    if (!match) {
      location.hash = '#/';
      return;
    }
    if (!state.user && !match.isPublic) {
      location.hash = '#/login';
      return;
    }
    if (state.user && match.isPublic && !hash.startsWith('#/reset')) {
      location.hash = '#/';
      return;
    }
    try {
      await match.fn(match.m);
    } catch (err) {
      console.error(err);
      shell(`<div class="card empty-state"><div class="big">😕</div><p>${esc(err.message)}</p><a class="btn btn-primary" href="#/">Kembali</a></div>`);
    }
    window.scrollTo(0, 0);
  }

  root.addEventListener('click', (e) => state.view?.onClick?.(e));
  root.addEventListener('input', (e) => state.view?.onInput?.(e));
  root.addEventListener('change', (e) => state.view?.onChange?.(e));
  root.addEventListener('submit', (e) => state.view?.onSubmit?.(e));
  window.addEventListener('hashchange', router);
  window.addEventListener('beforeunload', (e) => {
    if (state.view?.isDirty?.()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* ------------------------------------------------------------------ */
  /* Auth                                                               */
  /* ------------------------------------------------------------------ */
  function viewAuth(mode) {
    const isLogin = mode === 'login';
    root.innerHTML = `
      <div class="auth">
        <aside class="auth-art">
          <a class="brand" href="/" style="color:#fff"><span class="brand-mark" style="background:#fff;color:#4a573e">U</span>${esc(state.appName)}</a>
          <div>
            <p class="quote">Undangan cantik, tamu terkelola.</p>
            <ul>
              <li>Editor tanpa coding dengan pratinjau langsung</li>
              <li>Link personal untuk setiap tamu + kirim via WhatsApp</li>
              <li>RSVP, ucapan, dan rekap kehadiran real-time</li>
              <li>E-pass QR & check-in di hari H</li>
            </ul>
          </div>
          <small style="opacity:.7">© ${new Date().getFullYear()} ${esc(state.appName)}</small>
        </aside>
        <section class="auth-form">
          <form class="box" id="authForm" novalidate>
            <a class="brand" href="/"><span class="brand-mark">U</span>${esc(state.appName)}</a>
            <h1>${isLogin ? 'Masuk' : 'Buat akun gratis'}</h1>
            <p class="muted">${isLogin ? 'Kelola undangan dan RSVP tamu Anda.' : 'Mulai buat undangan digital dalam 5 menit.'}</p>
            ${isLogin ? '' : '<label class="field"><span>Nama Anda</span><input name="name" autocomplete="name" required></label>'}
            <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
            <label class="field"><span>Kata sandi</span><input name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" minlength="8" required>
              ${isLogin ? '<small><a href="#/forgot">Lupa kata sandi?</a></small>' : '<small>Minimal 8 karakter.</small>'}</label>
            <p class="form-error" id="authError" hidden></p>
            <button class="btn btn-primary btn-block btn-lg" type="submit">${isLogin ? 'Masuk' : 'Daftar'}</button>
            <p class="switch">${isLogin ? 'Belum punya akun? <a href="#/register">Daftar gratis</a>' : 'Sudah punya akun? <a href="#/login">Masuk</a>'}</p>
          </form>
        </section>
      </div>`;
    state.view = {
      async onSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form));
        const button = form.querySelector('button[type="submit"]');
        const errorBox = $('#authError');
        errorBox.hidden = true;
        button.disabled = true;
        try {
          const result = await api(`/api/auth/${isLogin ? 'login' : 'register'}`, { method: 'POST', body: data });
          state.user = result.user;
          location.hash = '#/';
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
        } finally {
          button.disabled = false;
        }
      }
    };
  }

  function authCard(inner) {
    root.innerHTML = `
      <div class="center-page">
        <div class="card" style="width:100%;max-width:400px;text-align:left">
          <a class="brand" href="/"><span class="brand-mark">U</span>${esc(state.appName)}</a>
          ${inner}
        </div>
      </div>`;
  }

  function viewForgot() {
    authCard(`
      <form id="forgotForm" novalidate>
        <h1 style="font-size:1.4rem;margin:1.2rem 0 .3rem">Lupa kata sandi</h1>
        <p class="muted">Masukkan email akun Anda. Kami akan mengirim link untuk membuat kata sandi baru.</p>
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
        <p class="form-error" id="forgotError" hidden></p>
        <button class="btn btn-primary btn-block" type="submit">Kirim link</button>
        <p class="muted small" style="text-align:center;margin-top:1rem"><a href="#/login">Kembali ke halaman masuk</a></p>
      </form>
      <div id="forgotDone" hidden>
        <h1 style="font-size:1.4rem;margin:1.2rem 0 .3rem">Cek email Anda 📬</h1>
        <p class="muted">Jika email tersebut terdaftar, link atur ulang kata sandi sudah dikirim. Link berlaku 1 jam. Periksa juga folder spam.</p>
        <a class="btn btn-ghost btn-block" href="#/login">Kembali ke halaman masuk</a>
      </div>`);
    state.view = {
      async onSubmit(e) {
        e.preventDefault();
        const errorBox = $('#forgotError');
        try {
          await api('/api/auth/forgot', { method: 'POST', body: { email: e.target.email.value.trim() } });
          $('#forgotForm').hidden = true;
          $('#forgotDone').hidden = false;
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.hidden = false;
        }
      }
    };
  }

  function viewReset() {
    const token = new URLSearchParams(location.hash.split('?')[1] || '').get('token') || '';
    authCard(`
      <form id="resetForm" novalidate>
        <h1 style="font-size:1.4rem;margin:1.2rem 0 .3rem">Buat kata sandi baru</h1>
        <label class="field"><span>Kata sandi baru</span><input name="password" type="password" minlength="8" autocomplete="new-password" required><small>Minimal 8 karakter.</small></label>
        <label class="field"><span>Ulangi kata sandi</span><input name="confirm" type="password" autocomplete="new-password" required></label>
        <p class="form-error" id="resetError" hidden></p>
        <button class="btn btn-primary btn-block" type="submit">Simpan & masuk</button>
      </form>`);
    state.view = {
      async onSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const errorBox = $('#resetError');
        errorBox.hidden = true;
        if (form.password.value !== form.confirm.value) {
          errorBox.textContent = 'Kata sandi tidak sama.';
          errorBox.hidden = false;
          return;
        }
        try {
          const result = await api('/api/auth/reset', { method: 'POST', body: { token, password: form.password.value } });
          state.user = result.user;
          toast('Kata sandi diperbarui. Selamat datang kembali!');
          location.hash = '#/';
        } catch (err) {
          errorBox.innerHTML = `${esc(err.message)} <a href="#/forgot">Minta link baru</a>`;
          errorBox.hidden = false;
        }
      }
    };
  }

  async function viewAccount() {
    shell(`
      <div class="page-head"><div><h1>Akun</h1><p>${esc(state.user.email)}</p></div></div>
      <div class="grid" style="max-width:520px">
        <form class="card" id="pwForm">
          <h2>Ubah kata sandi</h2>
          <label class="field"><span>Kata sandi lama</span><input type="password" name="current" autocomplete="current-password" required></label>
          <label class="field"><span>Kata sandi baru</span><input type="password" name="password" minlength="8" autocomplete="new-password" required></label>
          <button class="btn btn-primary" type="submit">Simpan</button>
        </form>
        <div class="card">
          <h2>Keluar</h2>
          <p class="muted">Keluar dari akun di perangkat ini.</p>
          <button class="btn btn-danger" data-act="logout">${icon('logout')} Keluar</button>
        </div>
        <form class="card" id="deleteForm" style="border-color:#efc9c2">
          <h2>Hapus akun</h2>
          <p class="muted">Menghapus akun beserta <b>semua undangan, tamu, RSVP, ucapan, dan foto</b> secara permanen. Tidak bisa dibatalkan.</p>
          <label class="field"><span>Kata sandi untuk konfirmasi</span><input type="password" name="password" autocomplete="current-password" required></label>
          <button class="btn btn-danger" type="submit">${icon('trash')} Hapus akun permanen</button>
        </form>
      </div>`);
    state.view = {
      async onSubmit(e) {
        e.preventDefault();
        if (e.target.id === 'deleteForm') {
          const ok = await confirmDialog('Yakin hapus akun dan semua data secara permanen?', { okText: 'Hapus permanen', danger: true });
          if (!ok) {
            return;
          }
          try {
            await api('/api/auth/delete-account', { method: 'POST', body: { password: e.target.password.value } });
            state.user = null;
            toast('Akun dihapus');
            location.hash = '#/login';
          } catch (err) {
            toast(err.message, 'error');
          }
          return;
        }
        const data = Object.fromEntries(new FormData(e.target));
        try {
          await api('/api/auth/password', { method: 'POST', body: data });
          e.target.reset();
          toast('Kata sandi diperbarui');
        } catch (err) {
          toast(err.message, 'error');
        }
      },
      async onClick(e) {
        if (e.target.closest('[data-act="logout"]')) {
          await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
          state.user = null;
          location.hash = '#/login';
        }
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Dashboard                                                          */
  /* ------------------------------------------------------------------ */
  async function viewDashboard() {
    shell('<div class="spinner"></div>');
    const { invitations } = await api('/api/invitations');
    const cards = invitations.map((inv) => {
      const url = `${location.origin}/i/${inv.slug}`;
      const names = inv.groom || inv.bride ? `${esc(inv.groom || '…')} & ${esc(inv.bride || '…')}` : 'Undangan';
      return `
        <article class="inv-card">
          <div class="inv-card-top theme-${esc(inv.theme)}">
            ${inv.published ? '<span class="badge live"><span class="dot"></span>Live</span>' : '<span class="badge draft">Draft</span>'}
            <div class="names">${names}</div>
            <div class="date">${esc(longDate(inv.weddingDate) || 'Tanggal belum diatur')}</div>
          </div>
          <div class="inv-card-body">
            <div class="inv-link">${icon('link')} <code>${esc(url)}</code>
              <button class="btn btn-ghost btn-sm btn-icon" data-copy="${esc(url)}" title="Salin link">${icon('copy')}</button></div>
            <div class="inv-card-stats">
              <div><b>${inv.stats.guests}</b><span>Tamu</span></div>
              <div><b>${inv.stats.pax}</b><span>Akan hadir</span></div>
              <div><b>${inv.stats.wishes}</b><span>Ucapan</span></div>
              <div><b>${inv.stats.checkedIn}</b><span>Check-in</span></div>
            </div>
            <div class="inv-card-actions">
              <a class="btn btn-primary btn-sm" href="#/inv/${inv.id}/edit">${icon('edit')} Edit</a>
              <a class="btn btn-soft btn-sm" href="#/inv/${inv.id}/guests">${icon('users')} Tamu</a>
              <a class="btn btn-soft btn-sm" href="#/inv/${inv.id}/rsvp">${icon('mail')} RSVP</a>
              <a class="btn btn-soft btn-sm" href="#/inv/${inv.id}/checkin">${icon('scan')} Check-in</a>
            </div>
          </div>
        </article>`;
    }).join('');

    shell(`
      <div class="page-head">
        <div><h1>Halo, ${esc(state.user.name.split(' ')[0])} 👋</h1><p>Kelola undangan pernikahan Anda di sini.</p></div>
        <button class="btn btn-primary btn-lg" data-act="new">${icon('plus')} Buat Undangan</button>
      </div>
      ${invitations.length ? `<div class="inv-grid">${cards}</div>` : `
        <div class="card empty-state">
          <div class="big">💌</div>
          <h2 style="color:var(--text)">Belum ada undangan</h2>
          <p>Buat undangan pertama Anda — cukup isi nama dan tanggal, sisanya bisa diatur nanti.</p>
          <button class="btn btn-primary btn-lg" data-act="new">${icon('plus')} Buat Undangan</button>
        </div>`}`);

    state.view = {
      onClick(e) {
        const copyBtn = e.target.closest('[data-copy]');
        if (copyBtn) {
          copyText(copyBtn.dataset.copy).then(() => toast('Link disalin'));
          return;
        }
        if (e.target.closest('[data-act="new"]')) {
          openCreateModal();
        }
      }
    };
  }

  function themePickerHtml(selected) {
    return `<div class="theme-picker">${P.themes.map((th) => `
      <button type="button" class="theme-option ${th.id === selected ? 'active' : ''}" data-theme-id="${th.id}">
        <span class="sw">${th.colors.map((c) => `<i style="background:${c}"></i>`).join('')}</span>${esc(th.label)}
      </button>`).join('')}</div>`;
  }

  function openCreateModal() {
    const religionOptions = Object.entries(P.religions).map(([id, r]) => `<option value="${id}">${esc(r.label)}</option>`).join('');
    const tzOptions = P.timeZones.map((z) => `<option value="${z.id}">${esc(z.label)}</option>`).join('');
    modal({
      title: 'Buat undangan baru',
      body: `
        <form id="createForm" novalidate>
          <div class="row row-2">
            <label class="field"><span>Nama panggilan pria</span><input name="groom" required maxlength="30" placeholder="mis. Raka"></label>
            <label class="field"><span>Nama panggilan wanita</span><input name="bride" required maxlength="30" placeholder="mis. Ayu"></label>
          </div>
          <div class="row row-2">
            <label class="field"><span>Tanggal & jam acara utama</span><input name="date" type="datetime-local" required></label>
            <label class="field"><span>Zona waktu</span><select name="timeZone">${tzOptions}</select></label>
          </div>
          <label class="field"><span>Template teks</span><select name="religion">${religionOptions}</select>
            <small>Mengisi salam pembuka, kutipan, dan penutup. Bisa diubah kapan saja.</small></label>
          <div class="field"><span class="label">Tema</span>${themePickerHtml('sage')}</div>
          <label class="field"><span>Link undangan</span>
            <div class="input-prefix"><span>${esc(location.host)}/i/</span><input name="slug" required maxlength="40" placeholder="raka-ayu"></div>
            <small id="slugHint">Huruf kecil, angka, dan tanda "-".</small></label>
          <p class="form-error" id="createError" hidden></p>
        </form>`,
      foot: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" data-create>Buat undangan</button>',
      onMount(el, close) {
        const form = el.querySelector('#createForm');
        let theme = 'sage';
        let slugEdited = false;
        let slugOk = false;
        const hint = el.querySelector('#slugHint');
        const checkSlug = debounce(async () => {
          const slug = form.slug.value.trim();
          if (!slug) {
            hint.textContent = 'Huruf kecil, angka, dan tanda "-".';
            slugOk = false;
            return;
          }
          const res = await api(`/api/slug-check?slug=${encodeURIComponent(slug)}`).catch(() => ({ available: false, message: '' }));
          slugOk = res.available;
          hint.innerHTML = res.available ? '<span style="color:var(--primary-dark)">✓ Link tersedia</span>' : `<span style="color:var(--danger)">${esc(res.message)}</span>`;
        }, 350);
        form.addEventListener('input', (e) => {
          if (e.target.name === 'slug') {
            slugEdited = true;
            e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          }
          if ((e.target.name === 'groom' || e.target.name === 'bride') && !slugEdited) {
            form.slug.value = slugify(`${form.groom.value}-${form.bride.value}`);
          }
          if (['slug', 'groom', 'bride'].includes(e.target.name)) {
            checkSlug();
          }
        });
        el.addEventListener('click', async (e) => {
          const opt = e.target.closest('[data-theme-id]');
          if (opt) {
            theme = opt.dataset.themeId;
            $$('.theme-option', el).forEach((b) => b.classList.toggle('active', b === opt));
            return;
          }
          if (!e.target.closest('[data-create]')) {
            return;
          }
          const errorBox = el.querySelector('#createError');
          const groom = form.groom.value.trim();
          const bride = form.bride.value.trim();
          const date = form.date.value;
          const slug = form.slug.value.trim();
          if (!groom || !bride || !date || !slug) {
            errorBox.textContent = 'Mohon lengkapi nama, tanggal, dan link.';
            errorBox.hidden = false;
            return;
          }
          await checkSlug.flush();
          if (!slugOk) {
            errorBox.textContent = 'Link tidak tersedia, coba yang lain.';
            errorBox.hidden = false;
            return;
          }
          const config = P.newConfig({ groom, bride, date, religion: form.religion.value, theme, timeZone: form.timeZone.value });
          config.admin.waTemplate = P.defaultWaTemplate;
          const button = e.target.closest('[data-create]');
          button.disabled = true;
          try {
            const { invitation } = await api('/api/invitations', { method: 'POST', body: { slug, config } });
            close();
            toast('Undangan dibuat! Lengkapi detailnya ya.');
            location.hash = `#/inv/${invitation.id}/edit`;
          } catch (err) {
            errorBox.textContent = err.message;
            errorBox.hidden = false;
          } finally {
            button.disabled = false;
          }
        });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Editor                                                             */
  /* ------------------------------------------------------------------ */
  function ensureDefaults(config) {
    const defaults = P.newConfig({ groom: '', bride: '', date: '', religion: config.religion || 'islam' });
    const fill = (target, source) => {
      Object.entries(source).forEach(([key, value]) => {
        if (target[key] === undefined) {
          target[key] = JSON.parse(JSON.stringify(value));
        } else if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object') {
          fill(target[key], value);
        }
      });
    };
    ['events', 'story', 'gallery'].forEach((k) => {
      if (!Array.isArray(config[k])) {
        config[k] = [];
      }
    });
    fill(config, { ...defaults, events: undefined, story: undefined, gallery: undefined });
    delete config.undefined;
    if (!Array.isArray(config.gifts.accounts)) {
      config.gifts.accounts = [];
    }
    if (!Array.isArray(config.dressCode.colors)) {
      config.dressCode.colors = [];
    }
    if (!config.admin.waTemplate) {
      config.admin.waTemplate = P.defaultWaTemplate;
    }
    if (!config.admin.waReminder) {
      config.admin.waReminder = P.defaultWaReminder;
    }
    return config;
  }

  // Field builders --------------------------------------------------------
  function F(config) {
    const val = (path) => getPath(config, path) ?? '';
    const toLocal = (iso) => (/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(iso || '') || [])[1] || '';
    return {
      text: (path, label, { placeholder = '', hint = '', type = 'text', max = 200 } = {}) => `
        <label class="field"><span>${label}</span>
          <input type="${type}" data-path="${path}" value="${esc(val(path))}" placeholder="${esc(placeholder)}" maxlength="${max}">
          ${hint ? `<small>${hint}</small>` : ''}</label>`,
      textarea: (path, label, { placeholder = '', rows = 3, hint = '' } = {}) => `
        <label class="field"><span>${label}</span>
          <textarea data-path="${path}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(val(path))}</textarea>
          ${hint ? `<small>${hint}</small>` : ''}</label>`,
      i18n: (path, label, { multiline = false, rows = 3, placeholder = '' } = {}) => {
        const input = (lang) => multiline
          ? `<textarea data-path="${path}.${lang}" rows="${rows}" placeholder="${lang === 'en' ? 'English (opsional)' : esc(placeholder)}">${esc(val(`${path}.${lang}`))}</textarea>`
          : `<input data-path="${path}.${lang}" value="${esc(val(`${path}.${lang}`))}" placeholder="${lang === 'en' ? 'English (opsional)' : esc(placeholder)}">`;
        return `
          <div class="field"><span class="label">${label}</span>
            <div class="i18n-pair">
              <label><span class="lang-tag">ID</span>${input('id')}</label>
              <label><span class="lang-tag">EN</span>${input('en')}</label>
            </div></div>`;
      },
      select: (path, label, options, { hint = '' } = {}) => `
        <label class="field"><span>${label}</span>
          <select data-path="${path}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(val(path)) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
          ${hint ? `<small>${hint}</small>` : ''}</label>`,
      number: (path, label, { min = 1, max = 20, hint = '' } = {}) => `
        <label class="field"><span>${label}</span>
          <input type="number" data-path="${path}" data-type="number" min="${min}" max="${max}" value="${esc(val(path))}">
          ${hint ? `<small>${hint}</small>` : ''}</label>`,
      toggle: (path, label) => `
        <div class="field"><label class="toggle"><input type="checkbox" data-path="${path}" data-type="bool" ${getPath(config, path) ? 'checked' : ''}>
          <span class="track"></span>${label}</label></div>`,
      datetime: (path, label, { hint = '' } = {}) => `
        <label class="field"><span>${label}</span>
          <input type="datetime-local" data-path="${path}" data-type="datetime" value="${esc(toLocal(val(path)))}">
          ${hint ? `<small>${hint}</small>` : ''}</label>`,
      date: (path, label, { hint = '' } = {}) => `
        <label class="field"><span>${label}</span>
          <input type="date" data-path="${path}" value="${esc(val(path))}">
          ${hint ? `<small>${hint}</small>` : ''}</label>`,
      image: (path, label, { hint = '' } = {}) => {
        const url = val(path);
        return `
          <div class="field"><span class="label">${label}</span>
            <div class="upload-box">
              <div class="upload-thumb ${url ? 'has' : ''}" style="${url ? `background-image:url('${esc(url)}')` : ''}">${url ? '' : 'Belum ada'}</div>
              <div><div class="upload-actions">
                <button type="button" class="btn btn-soft btn-sm" data-act="upload" data-path="${path}" data-kind="image">${icon('upload')} ${url ? 'Ganti' : 'Unggah'}</button>
                ${url ? `<button type="button" class="btn btn-ghost btn-sm" data-act="clear" data-path="${path}">Hapus</button>` : ''}
              </div>${hint ? `<small class="hint">${hint}</small>` : ''}</div>
            </div></div>`;
      },
      audio: (path, label) => {
        const url = val(path);
        return `
          <div class="field"><span class="label">${label}</span>
            <div class="upload-actions">
              <button type="button" class="btn btn-soft btn-sm" data-act="upload" data-path="${path}" data-kind="audio">${icon('music')} ${url ? 'Ganti lagu' : 'Unggah MP3'}</button>
              ${url ? `<button type="button" class="btn btn-ghost btn-sm" data-act="clear" data-path="${path}">Hapus</button>` : ''}
            </div>
            ${url ? `<audio controls preload="none" src="${esc(url)}" style="width:100%;margin-top:.5rem"></audio>` : '<small class="hint">MP3 maks. 12 MB. Pastikan Anda punya hak memakai lagu tersebut.</small>'}
          </div>`;
      }
    };
  }

  function listControls(listPath, index, length) {
    return `
      <button type="button" class="btn btn-ghost btn-sm btn-icon" data-act="move" data-list="${listPath}" data-index="${index}" data-dir="-1" ${index === 0 ? 'disabled' : ''} title="Naik">${icon('up')}</button>
      <button type="button" class="btn btn-ghost btn-sm btn-icon" data-act="move" data-list="${listPath}" data-index="${index}" data-dir="1" ${index === length - 1 ? 'disabled' : ''} title="Turun">${icon('down')}</button>
      <button type="button" class="btn btn-danger btn-sm btn-icon" data-act="remove" data-list="${listPath}" data-index="${index}" title="Hapus">${icon('trash')}</button>`;
  }

  function editorSections(config) {
    const f = F(config);
    const groom = (p) => `couple.groom.${p}`;
    const bride = (p) => `couple.bride.${p}`;
    const religionOptions = Object.entries(P.religions).map(([id, r]) => `<option value="${id}" ${config.religion === id ? 'selected' : ''}>${esc(r.label)}</option>`).join('');
    const tzOptions = P.timeZones.map((z) => [z.id, z.label]);

    const events = config.events.map((ev, i) => `
      <div class="list-item">
        <div class="list-item-head"><strong>Acara ${i + 1}${ev.title?.id ? ` — ${esc(ev.title.id)}` : ''}</strong>${listControls('events', i, config.events.length)}</div>
        ${f.i18n(`events.${i}.title`, 'Nama acara', { placeholder: 'Akad Nikah / Resepsi' })}
        <div class="row row-2">
          ${f.datetime(`events.${i}.start`, 'Mulai')}
          ${f.datetime(`events.${i}.end`, 'Selesai', { hint: 'Kosongkan untuk "Selesai".' })}
        </div>
        ${f.text(`events.${i}.venue`, 'Nama tempat', { placeholder: 'Gedung / Masjid / Gereja / Rumah' })}
        ${f.textarea(`events.${i}.address`, 'Alamat lengkap', { rows: 2 })}
        <div class="row row-2">
          ${f.text(`events.${i}.mapsQuery`, 'Kata kunci Google Maps', { placeholder: 'mis. Balai Kartini Jakarta', hint: 'Dipakai untuk peta & petunjuk arah.' })}
          ${f.text(`events.${i}.mapsUrl`, 'Link Google Maps (opsional)', { placeholder: 'https://maps.app.goo.gl/...', max: 600 })}
        </div>
      </div>`).join('');

    const story = config.story.map((item, i) => `
      <div class="list-item">
        <div class="list-item-head"><strong>Cerita ${i + 1}</strong>${listControls('story', i, config.story.length)}</div>
        ${f.text(`story.${i}.year`, 'Tahun / tanggal', { placeholder: '2021', max: 30 })}
        ${f.i18n(`story.${i}.title`, 'Judul', { placeholder: 'Pertama Bertemu' })}
        ${f.i18n(`story.${i}.text`, 'Cerita', { multiline: true })}
      </div>`).join('');

    const accounts = config.gifts.accounts.map((acc, i) => `
      <div class="list-item">
        <div class="list-item-head"><strong>Rekening ${i + 1}</strong>${listControls('gifts.accounts', i, config.gifts.accounts.length)}</div>
        <div class="row row-3">
          ${f.text(`gifts.accounts.${i}.provider`, 'Bank / e-wallet', { placeholder: 'BCA / Mandiri / GoPay' })}
          ${f.text(`gifts.accounts.${i}.number`, 'Nomor', { placeholder: '1234567890' })}
          ${f.text(`gifts.accounts.${i}.holder`, 'Atas nama')}
        </div>
      </div>`).join('');

    const gallery = config.gallery.map((url, i) => `
      <div class="gallery-item" style="background-image:url('${esc(url)}')">
        <div class="gi-actions">
          <button type="button" data-act="move" data-list="gallery" data-index="${i}" data-dir="-1" title="Geser kiri">‹</button>
          <button type="button" data-act="remove" data-list="gallery" data-index="${i}" title="Hapus">✕</button>
          <button type="button" data-act="move" data-list="gallery" data-index="${i}" data-dir="1" title="Geser kanan">›</button>
        </div>
      </div>`).join('');

    const colors = config.dressCode.colors.map((c, i) => `
      <span class="color-chip"><input type="color" data-path="dressCode.colors.${i}" value="${esc(c)}"><button type="button" data-act="remove" data-list="dressCode.colors" data-index="${i}" title="Hapus">×</button></span>`).join('');

    const section = (id, ic, title, subtitle, body, open = false) => `
      <details class="section-card" data-sec="${id}" ${open ? 'open' : ''}>
        <summary><span class="sec-icon">${icon(ic)}</span><span>${title}<small>${subtitle}</small></span><span class="chev">${icon('chevron')}</span></summary>
        <div class="section-body">${body}</div>
      </details>`;

    return [
      section('look', 'palette', 'Tampilan & Musik', 'Tema, foto sampul, bahasa, musik', `
        <div class="field"><span class="label">Tema warna</span>${themePickerHtml(config.theme)}</div>
        ${f.image('heroPhoto', 'Foto sampul (hero)', { hint: 'Foto portrait terbaik. Otomatis dikompres.' })}
        <div class="row row-2">
          ${f.select('defaultLang', 'Bahasa awal undangan', [['id', 'Bahasa Indonesia'], ['en', 'English']])}
          <div class="field" style="padding-top:1.4rem">${f.toggle('brideFirst', 'Tampilkan mempelai wanita lebih dulu')}</div>
        </div>
        <div class="sub-head">Musik latar</div>
        ${f.audio('music.url', 'Lagu (MP3)')}
        ${f.toggle('music.builtIn', 'Jika tidak unggah lagu, pakai musik box bawaan (Canon in D)')}
      `, true),
      section('couple', 'heart', 'Mempelai', 'Nama, orang tua, foto, Instagram', `
        <div class="sub-head">Mempelai pria</div>
        <div class="row row-2">${f.text(groom('nickname'), 'Nama panggilan', { max: 30 })}${f.text(groom('fullName'), 'Nama lengkap & gelar', { max: 120 })}</div>
        ${f.i18n(groom('parents'), 'Keterangan orang tua', { multiline: true, rows: 2, placeholder: 'Putra pertama dari Bapak ... & Ibu ...' })}
        <div class="row row-2">${f.image(groom('photo'), 'Foto')}${f.text(groom('instagram'), 'Instagram (tanpa @)', { max: 40 })}</div>
        <div class="sub-head">Mempelai wanita</div>
        <div class="row row-2">${f.text(bride('nickname'), 'Nama panggilan', { max: 30 })}${f.text(bride('fullName'), 'Nama lengkap & gelar', { max: 120 })}</div>
        ${f.i18n(bride('parents'), 'Keterangan orang tua', { multiline: true, rows: 2, placeholder: 'Putri kedua dari Bapak ... & Ibu ...' })}
        <div class="row row-2">${f.image(bride('photo'), 'Foto')}${f.text(bride('instagram'), 'Instagram (tanpa @)', { max: 40 })}</div>
      `),
      section('events', 'calendar', 'Tanggal & Acara', 'Akad/pemberkatan, resepsi, lokasi & peta', `
        <div class="row row-2">
          ${f.datetime('weddingDate', 'Tanggal utama', { hint: 'Untuk hitung mundur & tanggal di sampul.' })}
          ${f.select('timeZone', 'Zona waktu', tzOptions)}
        </div>
        ${events}
        <button type="button" class="btn btn-soft" data-act="add" data-list="events">${icon('plus')} Tambah acara</button>
      `),
      section('texts', 'text', 'Teks & Doa', 'Salam pembuka, kutipan, penutup, hashtag', `
        <div class="field"><span class="label">Template teks berdasarkan agama</span>
          <div class="toolbar" style="margin:0"><select id="religionSelect" style="max-width:240px">${religionOptions}</select>
          <button type="button" class="btn btn-soft btn-sm" data-act="apply-religion">Terapkan template</button></div>
          <small class="hint">Akan mengganti salam pembuka, kutipan, dan penutup di bawah.</small></div>
        ${f.i18n('opening', 'Salam pembuka', { multiline: true })}
        ${f.i18n('quote.text', 'Kutipan / ayat', { multiline: true })}
        ${f.text('quote.source', 'Sumber kutipan', { placeholder: 'QS. Ar-Rum: 21' })}
        ${f.i18n('closing', 'Kata penutup', { multiline: true })}
        ${f.text('hashtag', 'Hashtag', { placeholder: '#RakaAyuSelamanya', max: 60 })}
      `),
      section('story', 'book', 'Kisah Cinta', 'Timeline perjalanan kalian (opsional)', `
        ${story || '<p class="muted small">Belum ada cerita. Bagian ini tidak tampil jika kosong.</p>'}
        <button type="button" class="btn btn-soft" data-act="add" data-list="story">${icon('plus')} Tambah cerita</button>
      `),
      section('gallery', 'image', 'Galeri Foto', `${config.gallery.length} foto`, `
        <div class="gallery-grid">${gallery}</div>
        <button type="button" class="btn btn-soft" data-act="gallery-add">${icon('upload')} Tambah foto</button>
        <small class="hint">Bisa pilih banyak sekaligus. Foto otomatis dikompres agar ringan dibuka di HP (maks. 30 foto).</small>
      `),
      section('extras', 'video', 'Live Streaming & Dress Code', 'Opsional', `
        ${f.toggle('livestream.enabled', 'Tampilkan live streaming')}
        <div class="row row-2">${f.text('livestream.platform', 'Platform', { placeholder: 'YouTube Live / Instagram Live / Zoom' })}${f.text('livestream.url', 'Link', { placeholder: 'https://...', max: 600 })}</div>
        <div class="sub-head">Dress code</div>
        ${f.toggle('dressCode.enabled', 'Tampilkan dress code')}
        <div class="field"><span class="label">Warna</span><div class="colors-row">${colors}
          <button type="button" class="btn btn-ghost btn-sm" data-act="color-add">${icon('plus')} Warna</button></div></div>
        ${f.i18n('dressCode.note', 'Keterangan', { multiline: true, rows: 2 })}
      `),
      section('rsvp', 'mail', 'RSVP', 'Batas waktu, jumlah tamu, WhatsApp', `
        ${f.toggle('rsvp.enabled', 'Terima konfirmasi kehadiran (RSVP)')}
        <div class="row row-2">
          ${f.date('rsvp.deadline', 'Batas konfirmasi')}
          ${f.number('rsvp.defaultPax', 'Maks. tamu per undangan (default)', { hint: 'Bisa diatur per tamu di menu Tamu.' })}
        </div>
        ${f.text('rsvp.whatsapp', 'No. WhatsApp untuk konfirmasi alternatif (opsional)', { placeholder: '6281234567890', hint: 'Jika diisi, tamu juga bisa konfirmasi via WhatsApp.' })}
        ${f.toggle('admin.notifyEmail', 'Kirim email ke saya setiap ada RSVP baru')}
      `),
      section('gifts', 'gift', 'Amplop Digital & Kado', 'Rekening, e-wallet, QRIS, alamat', `
        ${f.toggle('gifts.enabled', 'Tampilkan bagian hadiah')}
        ${accounts}
        <button type="button" class="btn btn-soft" data-act="add" data-list="gifts.accounts">${icon('plus')} Tambah rekening / e-wallet</button>
        <div class="sub-head">QRIS</div>
        ${f.image('gifts.qrisImage', 'Gambar QRIS', { hint: 'Screenshot QRIS dari aplikasi bank/e-wallet Anda.' })}
        <div class="sub-head">Alamat kirim kado</div>
        <div class="row row-2">${f.text('gifts.address.recipient', 'Nama penerima')}${f.text('gifts.address.phone', 'No. HP penerima')}</div>
        ${f.textarea('gifts.address.text', 'Alamat', { rows: 2 })}
      `)
    ].join('');
  }

  async function viewEditor(id) {
    shell('<div class="spinner"></div>');
    const inv = await api(`/api/invitations/${id}`);
    const config = ensureDefaults(inv.config);
    let saveState = 'saved';
    let pendingUploads = 0;

    shell(`
      ${invHeader(inv, 'edit')}
      <div class="editor">
        <div id="editorForm">${editorSections(config)}</div>
        <aside class="editor-side">
          <div class="card publish-card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem">
              <strong>Publikasi</strong><span class="save-status saved" id="saveStatus">${icon('check')} Tersimpan</span>
            </div>
            <label class="toggle"><input type="checkbox" id="publishToggle" ${inv.published ? 'checked' : ''}><span class="track"></span>
              <span id="publishLabel">${inv.published ? 'Live — tamu bisa membuka' : 'Draft — hanya Anda yang bisa melihat'}</span></label>
            <div class="url-row"><input id="inviteUrl" readonly value="${esc(inv.url)}">
              <button class="btn btn-ghost btn-sm btn-icon" data-act="copy-url" title="Salin">${icon('copy')}</button></div>
            <div class="preview-actions">
              <button class="btn btn-ghost btn-sm" data-act="edit-slug">${icon('link')} Ubah link</button>
              <button class="btn btn-ghost btn-sm" data-act="reload-preview">${icon('refresh')} Muat ulang</button>
              <button class="btn btn-danger btn-sm" data-act="delete-inv">${icon('trash')} Hapus</button>
            </div>
          </div>
          <div class="phone-frame"><iframe id="previewFrame" title="Pratinjau" src="/i/${esc(inv.slug)}?preview=1&open=1"></iframe></div>
          <p class="muted small" style="text-align:center;margin:0">Pratinjau langsung — perubahan tampil otomatis.</p>
        </aside>
      </div>`);

    const frame = $('#previewFrame');
    const statusEl = $('#saveStatus');

    function setStatus(next, message) {
      saveState = next;
      statusEl.className = `save-status ${next}`;
      statusEl.innerHTML = {
        saving: 'Menyimpan…',
        dirty: 'Belum tersimpan',
        saved: `${icon('check')} Tersimpan`,
        error: message || 'Gagal menyimpan'
      }[next];
    }

    function publicCopy() {
      const copy = JSON.parse(JSON.stringify(config));
      delete copy.admin;
      return copy;
    }

    const postPreview = debounce(() => {
      try {
        frame.contentWindow.postMessage({ type: 'invite-config', config: publicCopy() }, location.origin);
      } catch {
        /* frame not ready */
      }
    }, 120);

    const save = debounce(async () => {
      setStatus('saving');
      try {
        await api(`/api/invitations/${id}`, { method: 'PUT', body: { config } });
        setStatus('saved');
      } catch (err) {
        setStatus('error', err.message);
        toast(err.message, 'error');
      }
    }, 900);

    function changed({ rerender = false } = {}) {
      if (rerender) {
        rerenderForm();
      }
      setStatus('dirty');
      postPreview();
      save();
    }

    function rerenderForm() {
      const openSections = $$('#editorForm details[open]').map((d) => d.dataset.sec);
      const scrollY = window.scrollY;
      $('#editorForm').innerHTML = editorSections(config);
      $$('#editorForm details').forEach((d) => {
        d.open = openSections.includes(d.dataset.sec);
      });
      window.scrollTo(0, scrollY);
    }

    function restampDates() {
      const tz = tzById(config.timeZone);
      config.timeZoneLabel = tz.short;
      const fix = (iso) => (iso ? iso.replace(/([+-]\d{2}:\d{2}|Z)$/, tz.offset) : iso);
      config.weddingDate = fix(config.weddingDate);
      config.events.forEach((ev) => {
        ev.start = fix(ev.start);
        ev.end = fix(ev.end);
      });
    }

    async function handleUpload(path, kind) {
      const [file] = await pickFile(kind === 'audio' ? 'audio/mpeg,.mp3' : 'image/*');
      if (!file) {
        return;
      }
      if (kind === 'audio' && file.size > 12 * 1024 * 1024) {
        toast('Ukuran MP3 maksimal 12 MB', 'error');
        return;
      }
      pendingUploads += 1;
      toast('Mengunggah…');
      try {
        const isQris = path === 'gifts.qrisImage';
        const blob = kind === 'image' ? await compressImage(file, isQris ? { maxSide: 1200, quality: 0.92 } : {}) : file;
        const url = await uploadFile(id, blob);
        setPath(config, path, url);
        changed({ rerender: true });
        toast('Berhasil diunggah');
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        pendingUploads -= 1;
      }
    }

    async function addGalleryPhotos() {
      const files = await pickFile('image/*', true);
      if (!files.length) {
        return;
      }
      const room = 30 - config.gallery.length;
      if (room <= 0) {
        toast('Maksimal 30 foto', 'error');
        return;
      }
      const selected = files.slice(0, room);
      pendingUploads += 1;
      try {
        for (let i = 0; i < selected.length; i += 1) {
          toast(`Mengunggah foto ${i + 1}/${selected.length}…`);
          const blob = await compressImage(selected[i]);
          const url = await uploadFile(id, blob);
          config.gallery.push(url);
          changed({ rerender: true });
        }
        toast(`${selected.length} foto ditambahkan`);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        pendingUploads -= 1;
      }
    }

    const newItems = {
      events: () => {
        const day = (config.weddingDate || '').slice(0, 10);
        const offset = tzById(config.timeZone).offset;
        return {
          title: { id: '', en: '' },
          start: day ? `${day}T11:00:00${offset}` : '',
          end: day ? `${day}T13:00:00${offset}` : '',
          venue: '', address: '', mapsQuery: '', mapsUrl: ''
        };
      },
      story: () => ({ year: '', title: { id: '', en: '' }, text: { id: '', en: '' } }),
      'gifts.accounts': () => ({ provider: '', number: '', holder: '' })
    };

    function editSlugModal() {
      modal({
        title: 'Ubah link undangan',
        body: `
          <p class="muted small">Link lama akan berhenti berfungsi. Jika sudah dikirim ke tamu, sebaiknya jangan diubah.</p>
          <label class="field"><span>Link baru</span>
            <div class="input-prefix"><span>${esc(location.host)}/i/</span><input id="newSlug" value="${esc(inv.slug)}" maxlength="40"></div>
            <small id="newSlugHint"></small></label>`,
        foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-save-slug>Simpan</button>',
        onMount(el, close) {
          el.querySelector('[data-save-slug]').addEventListener('click', async () => {
            const slug = el.querySelector('#newSlug').value.trim().toLowerCase();
            try {
              const res = await api(`/api/invitations/${id}`, { method: 'PUT', body: { slug } });
              inv.slug = res.slug;
              inv.url = res.url;
              $('#inviteUrl').value = res.url;
              frame.src = `/i/${res.slug}?preview=1&open=1`;
              close();
              toast('Link diperbarui');
            } catch (err) {
              el.querySelector('#newSlugHint').innerHTML = `<span style="color:var(--danger)">${esc(err.message)}</span>`;
            }
          });
        }
      });
    }

    async function deleteInvitation() {
      modal({
        title: 'Hapus undangan',
        body: `<p>Undangan, semua tamu, RSVP, ucapan, dan foto akan <b>dihapus permanen</b>.</p>
               <label class="field"><span>Ketik <b>${esc(inv.slug)}</b> untuk konfirmasi</span><input id="confirmSlug"></label>`,
        foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" data-confirm-delete>Hapus permanen</button>',
        onMount(el, close) {
          el.querySelector('[data-confirm-delete]').addEventListener('click', async () => {
            if (el.querySelector('#confirmSlug').value.trim() !== inv.slug) {
              toast('Ketik link dengan benar untuk menghapus', 'error');
              return;
            }
            save.cancel();
            await api(`/api/invitations/${id}`, { method: 'DELETE' });
            close();
            toast('Undangan dihapus');
            saveState = 'saved';
            location.hash = '#/';
          });
        }
      });
    }

    frame.addEventListener('load', () => postPreview.flush());

    state.view = {
      isDirty: () => saveState === 'dirty' || saveState === 'saving' || pendingUploads > 0,
      async cleanup() {
        if (saveState === 'dirty') {
          await save.flush();
        }
      },
      onInput(e) {
        const el = e.target;
        if (!el.dataset.path) {
          return;
        }
        let value = el.value;
        if (el.dataset.type === 'bool') {
          value = el.checked;
        } else if (el.dataset.type === 'number') {
          value = Math.max(1, Math.min(20, parseInt(el.value, 10) || 1));
        } else if (el.dataset.type === 'datetime') {
          value = el.value ? `${el.value}:00${tzById(config.timeZone).offset}` : '';
        }
        setPath(config, el.dataset.path, value);
        if (el.dataset.path === 'timeZone') {
          restampDates();
        }
        if (el.dataset.path === 'events.0.start' && !config.weddingDate) {
          config.weddingDate = value;
        }
        changed();
      },
      onChange(e) {
        const el = e.target;
        if (el.id === 'publishToggle') {
          const published = el.checked;
          api(`/api/invitations/${id}`, { method: 'PUT', body: { published } })
            .then(() => {
              inv.published = published;
              $('#publishLabel').textContent = published ? 'Live — tamu bisa membuka' : 'Draft — hanya Anda yang bisa melihat';
              toast(published ? 'Undangan dipublikasikan 🎉' : 'Undangan disembunyikan (draft)');
              const badge = $('.inv-head .badge');
              if (badge) {
                badge.outerHTML = published ? '<span class="badge live"><span class="dot"></span>Live</span>' : '<span class="badge draft">Draft</span>';
              }
              frame.contentWindow.location.reload();
            })
            .catch((err) => {
              el.checked = !published;
              toast(err.message, 'error');
            });
          return;
        }
        if (el.dataset.path && (el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'color' || el.type === 'date' || el.type === 'datetime-local')) {
          this.onInput(e);
        }
      },
      async onClick(e) {
        const theme = e.target.closest('[data-theme-id]');
        if (theme) {
          config.theme = theme.dataset.themeId;
          $$('#editorForm .theme-option').forEach((b) => b.classList.toggle('active', b === theme));
          changed();
          return;
        }
        const btn = e.target.closest('[data-act]');
        if (!btn) {
          return;
        }
        const act = btn.dataset.act;
        const list = btn.dataset.list;
        const index = Number(btn.dataset.index);
        if (act === 'add') {
          getPath(config, list).push(newItems[list]());
          changed({ rerender: true });
        } else if (act === 'remove') {
          const arr = getPath(config, list);
          if (list === 'events' || list === 'story' || list === 'gifts.accounts') {
            const ok = await confirmDialog('Hapus item ini?', { okText: 'Hapus', danger: true });
            if (!ok) {
              return;
            }
          }
          arr.splice(index, 1);
          changed({ rerender: true });
        } else if (act === 'move') {
          const arr = getPath(config, list);
          const target = index + Number(btn.dataset.dir);
          if (target >= 0 && target < arr.length) {
            [arr[index], arr[target]] = [arr[target], arr[index]];
            changed({ rerender: true });
          }
        } else if (act === 'upload') {
          handleUpload(btn.dataset.path, btn.dataset.kind);
        } else if (act === 'clear') {
          setPath(config, btn.dataset.path, '');
          changed({ rerender: true });
        } else if (act === 'gallery-add') {
          addGalleryPhotos();
        } else if (act === 'color-add') {
          if (config.dressCode.colors.length < 8) {
            config.dressCode.colors.push('#c9b38a');
            changed({ rerender: true });
          }
        } else if (act === 'apply-religion') {
          const key = $('#religionSelect').value;
          const ok = await confirmDialog(`Ganti salam pembuka, kutipan, dan penutup dengan template ${P.religions[key].label}?`, { okText: 'Terapkan' });
          if (ok) {
            const preset = P.religions[key];
            config.religion = key;
            config.opening = JSON.parse(JSON.stringify(preset.opening));
            config.quote = JSON.parse(JSON.stringify(preset.quote));
            config.closing = JSON.parse(JSON.stringify(preset.closing));
            changed({ rerender: true });
            toast('Template diterapkan');
          }
        } else if (act === 'copy-url') {
          copyText(inv.url).then(() => toast('Link disalin'));
        } else if (act === 'reload-preview') {
          frame.contentWindow.location.reload();
        } else if (act === 'edit-slug') {
          editSlugModal();
        } else if (act === 'delete-inv') {
          deleteInvitation();
        }
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Guests                                                             */
  /* ------------------------------------------------------------------ */
  function waMessage(template, guest, inv) {
    const config = inv.config;
    return (template || P.defaultWaTemplate)
      .split('{nama}').join(guest.name)
      .split('{link}').join(`${inv.url}?g=${guest.code}`)
      .split('{pasangan}').join(coupleTitle(config))
      .split('{tanggal}').join(longDate(config.weddingDate, config.timeZone))
      .split('{pax}').join(String(guest.pax));
  }

  async function viewGuests(id) {
    shell('<div class="spinner"></div>');
    const [inv, data] = await Promise.all([api(`/api/invitations/${id}`), api(`/api/invitations/${id}/guests`)]);
    ensureDefaults(inv.config);
    let guests = data.guests;
    let stats = data.stats;
    const filters = { q: '', status: 'all', group: '' };
    let showAll = false;
    const defaultPax = inv.config.rsvp?.defaultPax || 2;

    shell(`
      ${invHeader(inv, 'guests')}
      <div id="guestStats"></div>
      ${inv.published ? '' : `<div class="card" style="background:var(--warn-soft);border-color:#ecd5ad;margin-bottom:1rem">
        ⚠️ Undangan masih <b>Draft</b> — tamu belum bisa membuka link. Aktifkan "Publikasi" di Editor sebelum mengirim.</div>`}
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin-bottom:1rem">
        <form class="card" id="addGuestForm">
          <h2>Tambah tamu</h2>
          <label class="field"><span>Nama (sesuai sapaan di undangan)</span><input name="name" required maxlength="80" placeholder="Bapak Budi Santoso & Keluarga"></label>
          <div class="row row-3">
            <label class="field"><span>No. WhatsApp</span><input name="phone" inputmode="tel" placeholder="0812..."></label>
            <label class="field"><span>Maks. tamu</span><input name="pax" type="number" min="1" max="20" value="${defaultPax}"></label>
            <label class="field"><span>Grup</span><input name="group" list="groupList" placeholder="Keluarga"></label>
          </div>
          <button class="btn btn-primary" type="submit">${icon('plus')} Tambah</button>
        </form>
        <div class="card">
          <h2>Tambah banyak sekaligus</h2>
          <label class="field"><span>Satu tamu per baris: Nama | No. WA | Maks. tamu | Grup</span>
            <textarea id="bulkText" rows="5" placeholder="Bapak Joko & Keluarga | 081234567890 | 4 | Keluarga&#10;Rina Wulandari | 081298765432&#10;Teman Kantor PT Maju"></textarea></label>
          <div class="toolbar" style="margin:0">
            <button class="btn btn-primary btn-sm" data-act="bulk-add">${icon('plus')} Tambahkan</button>
            <button class="btn btn-ghost btn-sm" data-act="import-csv">${icon('upload')} Impor CSV / Excel (CSV)</button>
          </div>
        </div>
      </div>
      <details class="card" style="margin-bottom:1rem">
        <summary style="cursor:pointer;font-weight:600">${icon('whatsapp')} Template pesan WhatsApp (undangan & pengingat)</summary>
        <div class="row row-2" style="margin-top:1rem">
          <label class="field"><span>Pesan undangan</span><textarea id="waTemplate" rows="12">${esc(inv.config.admin.waTemplate)}</textarea></label>
          <label class="field"><span>Pesan pengingat (untuk yang belum respon)</span><textarea id="waReminder" rows="12">${esc(inv.config.admin.waReminder)}</textarea></label>
        </div>
        <small class="hint">Variabel: {nama} {link} {pasangan} {tanggal} {pax}. Disimpan otomatis.</small>
      </details>
      <div class="toolbar">
        <input class="search" id="guestSearch" placeholder="Cari nama, nomor, atau kode…">
        <select id="statusFilter">
          <option value="all">Semua status</option>
          <option value="unsent">Belum dikirim</option>
          <option value="sent">Sudah dikirim</option>
          <option value="unopened">Dikirim, belum dibuka</option>
          <option value="opened-norsvp">Dibuka, belum respon</option>
          <option value="norsvp">Belum respon</option>
          <option value="yes">Hadir</option>
          <option value="maybe">Masih ragu</option>
          <option value="no">Tidak hadir</option>
          <option value="checked">Sudah check-in</option>
        </select>
        <select id="groupFilter"></select>
        <a class="btn btn-ghost" href="/api/invitations/${id}/export.csv">${icon('download')} Ekspor CSV</a>
      </div>
      <div id="guestTable"></div>
      <datalist id="groupList"></datalist>`);

    function groups() {
      return Array.from(new Set(guests.map((g) => g.group).filter(Boolean))).sort();
    }

    function renderStats() {
      $('#guestStats').innerHTML = `
        <div class="stats">
          <div class="stat"><b>${stats.guests}</b><span>Total tamu</span></div>
          <div class="stat"><b>${stats.sent}</b><span>Undangan terkirim</span></div>
          <div class="stat"><b>${stats.opened}</b><span>Sudah dibuka</span></div>
          <div class="stat accent"><b>${stats.yes}</b><span>Hadir (${stats.pax} orang)</span></div>
          <div class="stat"><b>${Math.max(0, stats.guests - stats.responses)}</b><span>Belum respon</span></div>
        </div>`;
      const opts = groups();
      $('#groupFilter').innerHTML = `<option value="">Semua grup</option>${opts.map((g) => `<option ${g === filters.group ? 'selected' : ''}>${esc(g)}</option>`).join('')}`;
      $('#groupList').innerHTML = opts.map((g) => `<option value="${esc(g)}">`).join('');
    }

    function matches(g) {
      const q = filters.q.toLowerCase();
      if (q && !(`${g.name} ${g.phone} ${g.code}`.toLowerCase().includes(q))) {
        return false;
      }
      if (filters.group && g.group !== filters.group) {
        return false;
      }
      const a = g.rsvp?.attendance;
      switch (filters.status) {
        case 'unsent': return !g.sentAt;
        case 'sent': return Boolean(g.sentAt);
        case 'unopened': return Boolean(g.sentAt) && !g.openedAt;
        case 'opened-norsvp': return Boolean(g.openedAt) && !a;
        case 'norsvp': return !a;
        case 'yes': case 'no': case 'maybe': return a === filters.status;
        case 'checked': return Boolean(g.checkedInAt);
        default: return true;
      }
    }

    function renderTable() {
      const list = guests.filter(matches);
      const visible = showAll ? list : list.slice(0, 200);
      if (!guests.length) {
        $('#guestTable').innerHTML = '<div class="card empty-state"><div class="big">📇</div><p>Belum ada tamu. Tambahkan satu per satu atau tempel daftar di atas.</p></div>';
        return;
      }
      $('#guestTable').innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>Tamu</th><th>WhatsApp</th><th>Maks</th><th>RSVP</th><th>Kirim / Dibuka</th><th style="text-align:right">Aksi</th></tr></thead>
          <tbody>${visible.map((g) => `
            <tr data-id="${g.id}">
              <td><div class="name">${esc(g.name)}</div>
                <div class="sub">${g.group ? `<span class="badge info">${esc(g.group)}</span> ` : ''}${g.source === 'rsvp' ? '<span class="badge">via link umum</span> ' : ''}<span class="code-pill">${esc(g.code)}</span>${g.checkedInAt ? ' <span class="badge yes">✓ check-in</span>' : ''}</div></td>
              <td class="sub">${g.phone ? esc(g.phone) : '—'}</td>
              <td>${g.pax}</td>
              <td>${attendanceBadge(g.rsvp?.attendance)}${g.rsvp?.attendance === 'yes' ? `<div class="sub">${g.rsvp.guests} orang</div>` : ''}</td>
              <td class="sub">${g.sentAt ? `✓ dikirim ${esc(relTime(g.sentAt))}` : '—'}${g.openedAt ? `<br>👁 dibuka ${esc(relTime(g.openedAt))}${g.openCount > 1 ? ` (${g.openCount}×)` : ''}` : ''}</td>
              <td><div class="acts">
                ${g.sentAt && !g.rsvp
                  ? `<button class="btn btn-soft btn-sm" data-act="remind" title="Kirim pengingat via WhatsApp">${icon('whatsapp')} Ingatkan</button>`
                  : `<button class="btn btn-wa btn-sm" data-act="wa" title="Kirim via WhatsApp">${icon('whatsapp')} Kirim</button>`}
                <button class="btn btn-ghost btn-sm btn-icon" data-act="copy-link" title="Salin link">${icon('link')}</button>
                <button class="btn btn-ghost btn-sm btn-icon" data-act="copy-msg" title="Salin pesan">${icon('copy')}</button>
                <button class="btn btn-ghost btn-sm btn-icon" data-act="edit" title="Edit">${icon('edit')}</button>
                <button class="btn btn-ghost btn-sm btn-icon" data-act="delete" title="Hapus">${icon('trash')}</button>
              </div></td>
            </tr>`).join('')}</tbody>
        </table></div>
        <p class="muted small" style="margin-top:.6rem">Menampilkan ${visible.length} dari ${list.length} tamu${list.length > visible.length ? ` · <button class="link-btn" data-act="show-all">Tampilkan semua</button>` : ''}</p>`;
    }

    async function reload() {
      const fresh = await api(`/api/invitations/${id}/guests`);
      guests = fresh.guests;
      stats = fresh.stats;
      renderStats();
      renderTable();
    }

    async function addGuests(list) {
      if (!list.length) {
        toast('Tidak ada nama yang valid', 'error');
        return;
      }
      try {
        const res = await api(`/api/invitations/${id}/guests`, { method: 'POST', body: { guests: list } });
        toast(`${res.created} tamu ditambahkan`);
        await reload();
        return true;
      } catch (err) {
        toast(err.message, 'error');
        return false;
      }
    }

    const saveTemplate = debounce(async () => {
      inv.config.admin.waTemplate = $('#waTemplate').value;
      inv.config.admin.waReminder = $('#waReminder').value;
      try {
        await api(`/api/invitations/${id}`, { method: 'PUT', body: { config: inv.config } });
        toast('Template disimpan');
      } catch (err) {
        toast(err.message, 'error');
      }
    }, 1000);

    function editGuestModal(guest) {
      modal({
        title: 'Edit tamu',
        body: `
          <form id="editGuestForm">
            <label class="field"><span>Nama</span><input name="name" value="${esc(guest.name)}" maxlength="80" required></label>
            <div class="row row-3">
              <label class="field"><span>No. WhatsApp</span><input name="phone" value="${esc(guest.phone)}"></label>
              <label class="field"><span>Maks. tamu</span><input name="pax" type="number" min="1" max="20" value="${guest.pax}"></label>
              <label class="field"><span>Grup</span><input name="group" value="${esc(guest.group)}" list="groupList"></label>
            </div>
            <label class="toggle"><input type="checkbox" name="sent" ${guest.sentAt ? 'checked' : ''}><span class="track"></span>Tandai sudah dikirim</label>
            <p class="muted small" style="margin-top:1rem">Link personal: <code>${esc(inv.url)}?g=${esc(guest.code)}</code></p>
          </form>`,
        foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-save>Simpan</button>',
        onMount(el, close) {
          el.querySelector('[data-save]').addEventListener('click', async () => {
            const form = el.querySelector('#editGuestForm');
            try {
              await api(`/api/invitations/${id}/guests/${guest.id}`, {
                method: 'PUT',
                body: { name: form.name.value, phone: form.phone.value, pax: Number(form.pax.value), group: form.group.value, sent: form.sent.checked }
              });
              close();
              toast('Tersimpan');
              reload();
            } catch (err) {
              toast(err.message, 'error');
            }
          });
        }
      });
    }

    renderStats();
    renderTable();

    state.view = {
      async onSubmit(e) {
        if (e.target.id !== 'addGuestForm') {
          return;
        }
        e.preventDefault();
        const form = e.target;
        const ok = await addGuests([{ name: form.name.value, phone: form.phone.value, pax: Number(form.pax.value), group: form.group.value }]);
        if (ok) {
          form.name.value = '';
          form.phone.value = '';
          form.name.focus();
        }
      },
      onInput(e) {
        if (e.target.id === 'guestSearch') {
          filters.q = e.target.value;
          renderTable();
        } else if (e.target.id === 'waTemplate' || e.target.id === 'waReminder') {
          saveTemplate();
        }
      },
      onChange(e) {
        if (e.target.id === 'statusFilter') {
          filters.status = e.target.value;
          renderTable();
        } else if (e.target.id === 'groupFilter') {
          filters.group = e.target.value;
          renderTable();
        }
      },
      async onClick(e) {
        const btn = e.target.closest('[data-act]');
        if (!btn) {
          return;
        }
        const act = btn.dataset.act;
        if (act === 'bulk-add') {
          const ok = await addGuests(parseGuestLines($('#bulkText').value));
          if (ok) {
            $('#bulkText').value = '';
          }
          return;
        }
        if (act === 'import-csv') {
          const [file] = await pickFile('.csv,.txt,text/csv');
          if (file) {
            addGuests(rowsToGuests(parseCsv(await file.text())));
          }
          return;
        }
        if (act === 'show-all') {
          showAll = true;
          renderTable();
          return;
        }
        const row = btn.closest('tr[data-id]');
        if (!row) {
          return;
        }
        const guest = guests.find((g) => g.id === Number(row.dataset.id));
        const template = $('#waTemplate').value;
        if (act === 'wa') {
          const text = encodeURIComponent(waMessage(template, guest, inv));
          window.open(`https://wa.me/${guest.phone}?text=${text}`, '_blank', 'noopener');
          if (!guest.sentAt) {
            const res = await api(`/api/invitations/${id}/guests/${guest.id}`, { method: 'PUT', body: { sent: true } }).catch(() => null);
            if (res) {
              Object.assign(guest, res.guest);
              stats.sent += 1;
              renderStats();
              renderTable();
            }
          }
        } else if (act === 'remind') {
          const text = encodeURIComponent(waMessage($('#waReminder').value, guest, inv));
          window.open(`https://wa.me/${guest.phone}?text=${text}`, '_blank', 'noopener');
        } else if (act === 'copy-link') {
          copyText(`${inv.url}?g=${guest.code}`).then(() => toast('Link personal disalin'));
        } else if (act === 'copy-msg') {
          copyText(waMessage(template, guest, inv)).then(() => toast('Pesan disalin'));
        } else if (act === 'edit') {
          editGuestModal(guest);
        } else if (act === 'delete') {
          const ok = await confirmDialog(`Hapus ${guest.name}? RSVP tamu ini juga ikut terhapus.`, { okText: 'Hapus', danger: true });
          if (ok) {
            await api(`/api/invitations/${id}/guests/${guest.id}`, { method: 'DELETE' });
            toast('Tamu dihapus');
            reload();
          }
        }
      },
      cleanup() {
        const changedTemplate = $('#waTemplate')?.value !== inv.config.admin.waTemplate
          || $('#waReminder')?.value !== inv.config.admin.waReminder;
        if (changedTemplate) {
          return saveTemplate.flush();
        }
        saveTemplate.cancel();
        return undefined;
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* RSVPs                                                              */
  /* ------------------------------------------------------------------ */
  async function viewRsvps(id) {
    shell('<div class="spinner"></div>');
    const [inv, data] = await Promise.all([api(`/api/invitations/${id}`), api(`/api/invitations/${id}/rsvps`)]);
    let rsvps = data.rsvps;
    let stats = data.stats;
    const filters = { attendance: 'all', q: '' };

    shell(`
      ${invHeader(inv, 'rsvp')}
      <div id="rsvpStats"></div>
      <div class="toolbar">
        <div class="filter-tabs" id="attTabs">
          <button data-att="all" class="active">Semua</button>
          <button data-att="yes">Hadir</button>
          <button data-att="maybe">Ragu</button>
          <button data-att="no">Tidak</button>
          <button data-att="wishes">Ada ucapan</button>
        </div>
        <input class="search" id="rsvpSearch" placeholder="Cari nama atau ucapan…">
        <button class="btn btn-ghost" data-act="refresh">${icon('refresh')} Muat ulang</button>
        <a class="btn btn-ghost" href="/api/invitations/${id}/export.csv">${icon('download')} Ekspor CSV</a>
      </div>
      <div id="rsvpList"></div>`);

    function renderStats() {
      const total = Math.max(1, stats.yes + stats.maybe + stats.no);
      const pending = Math.max(0, stats.guests - stats.responses);
      $('#rsvpStats').innerHTML = `
        <div class="stats">
          <div class="stat accent"><b>${stats.pax}</b><span>Orang akan hadir (${stats.yes} undangan)</span></div>
          <div class="stat"><b>${stats.maybe}</b><span>Masih ragu</span></div>
          <div class="stat"><b>${stats.no}</b><span>Tidak hadir</span></div>
          <div class="stat"><b>${pending}</b><span>Belum respon</span></div>
          <div class="stat"><b>${stats.wishes}</b><span>Ucapan</span></div>
        </div>
        <div class="card" style="margin-bottom:1.2rem;padding:1rem">
          <div class="progress">
            <i style="width:${(stats.yes / total) * 100}%;background:var(--primary)"></i>
            <i style="width:${(stats.maybe / total) * 100}%;background:var(--accent)"></i>
            <i style="width:${(stats.no / total) * 100}%;background:var(--danger)"></i>
          </div>
          <p class="muted small" style="margin:.5rem 0 0">${stats.responses} respons masuk · siapkan katering untuk ±${stats.pax + Math.round(stats.maybe * 0.5)} orang (hadir + 50% yang ragu)</p>
        </div>`;
    }

    function renderList() {
      const q = filters.q.toLowerCase();
      const list = rsvps.filter((r) => {
        if (filters.attendance === 'wishes' && !r.message) {
          return false;
        }
        if (['yes', 'no', 'maybe'].includes(filters.attendance) && r.attendance !== filters.attendance) {
          return false;
        }
        return !q || `${r.name} ${r.invitedAs} ${r.message}`.toLowerCase().includes(q);
      });
      $('#rsvpList').innerHTML = list.length ? `<div class="rsvp-list">${list.map((r) => `
        <div class="rsvp-item ${r.hidden ? 'is-hidden' : ''}" data-id="${r.id}">
          <span class="avatar-sm">${esc(initials(r.name))}</span>
          <div>
            <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
              <strong>${esc(r.name)}</strong>${attendanceBadge(r.attendance)}
              ${r.attendance === 'yes' ? `<span class="badge">${r.guests} orang</span>` : ''}
              ${r.hidden ? '<span class="badge">Disembunyikan</span>' : ''}
            </div>
            ${r.message ? `<p class="msg">${esc(r.message)}</p>` : ''}
            <div class="meta">
              ${r.invitedAs && r.invitedAs !== r.name ? `<span>Diundang sebagai: ${esc(r.invitedAs)}</span>` : ''}
              ${r.group ? `<span>Grup: ${esc(r.group)}</span>` : ''}
              <span>${r.source === 'rsvp' ? 'Lewat link umum' : 'Link personal'}</span>
              <span>${esc(relTime(r.updatedAt))}</span>
            </div>
          </div>
          <div class="acts" style="display:flex;gap:.3rem">
            ${r.message ? `<button class="btn btn-ghost btn-sm" data-act="toggle-hide">${r.hidden ? 'Tampilkan' : 'Sembunyikan'}</button>` : ''}
            <button class="btn btn-ghost btn-sm btn-icon" data-act="delete" title="Hapus">${icon('trash')}</button>
          </div>
        </div>`).join('')}</div>` : '<div class="card empty-state"><div class="big">💌</div><p>Belum ada RSVP di filter ini.</p></div>';
    }

    async function reload() {
      const fresh = await api(`/api/invitations/${id}/rsvps`);
      rsvps = fresh.rsvps;
      stats = fresh.stats;
      renderStats();
      renderList();
    }

    renderStats();
    renderList();
    const timer = setInterval(() => {
      if (!document.hidden) {
        reload().catch(() => {});
      }
    }, 30000);

    state.view = {
      cleanup() {
        clearInterval(timer);
      },
      onInput(e) {
        if (e.target.id === 'rsvpSearch') {
          filters.q = e.target.value;
          renderList();
        }
      },
      async onClick(e) {
        const tab = e.target.closest('[data-att]');
        if (tab) {
          filters.attendance = tab.dataset.att;
          $$('#attTabs button').forEach((b) => b.classList.toggle('active', b === tab));
          renderList();
          return;
        }
        const btn = e.target.closest('[data-act]');
        if (!btn) {
          return;
        }
        if (btn.dataset.act === 'refresh') {
          await reload();
          toast('Diperbarui');
          return;
        }
        const item = btn.closest('[data-id]');
        const rsvp = rsvps.find((r) => r.id === Number(item.dataset.id));
        if (btn.dataset.act === 'toggle-hide') {
          await api(`/api/invitations/${id}/rsvps/${rsvp.id}`, { method: 'PUT', body: { hidden: !rsvp.hidden } });
          rsvp.hidden = !rsvp.hidden;
          renderList();
          toast(rsvp.hidden ? 'Ucapan disembunyikan dari tamu' : 'Ucapan ditampilkan');
        } else if (btn.dataset.act === 'delete') {
          const ok = await confirmDialog(`Hapus RSVP dari ${rsvp.name}?`, { okText: 'Hapus', danger: true });
          if (ok) {
            await api(`/api/invitations/${id}/rsvps/${rsvp.id}`, { method: 'DELETE' });
            await reload();
            toast('RSVP dihapus');
          }
        }
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Check-in                                                           */
  /* ------------------------------------------------------------------ */
  async function viewCheckin(id) {
    shell('<div class="spinner"></div>');
    const [inv, data] = await Promise.all([api(`/api/invitations/${id}`), api(`/api/invitations/${id}/guests`)]);
    let guests = data.guests;
    let stats = data.stats;
    let current = null;
    let count = 1;
    let stream = null;
    let scanTimer = null;
    const canScan = 'BarcodeDetector' in window && navigator.mediaDevices?.getUserMedia;

    shell(`
      ${invHeader(inv, 'checkin')}
      <div class="checkin">
        <div class="grid">
          <div class="card">
            <h2>Scan atau ketik kode e-pass</h2>
            <form class="checkin-input" id="codeForm">
              <input id="codeInput" maxlength="12" placeholder="ABC123" autocomplete="off" autocapitalize="characters">
              <button class="btn btn-primary" type="submit">Cari</button>
            </form>
            <div style="margin-top:.8rem;display:flex;gap:.5rem;flex-wrap:wrap">
              ${canScan ? `<button class="btn btn-soft" data-act="scan">${icon('scan')} Scan QR dengan kamera</button>` : '<small class="hint">Scan kamera tersedia di Chrome/Edge (Android/desktop) lewat HTTPS. Anda tetap bisa mengetik kode atau mencari nama.</small>'}
            </div>
            <div class="scanner" id="scanner" hidden><video id="scanVideo" playsinline muted></video></div>
          </div>
          <div id="result"></div>
        </div>
        <div class="grid">
          <div class="card" id="checkinStats"></div>
          <div class="card">
            <h2>Cari berdasarkan nama</h2>
            <input id="nameSearch" placeholder="Ketik nama tamu…">
            <div id="nameResults" style="margin-top:.6rem"></div>
          </div>
          <div class="card">
            <h2>Check-in terakhir</h2>
            <div id="recent"></div>
          </div>
        </div>
      </div>`);

    function renderStats() {
      $('#checkinStats').innerHTML = `
        <div style="display:flex;gap:1.5rem;align-items:flex-end;flex-wrap:wrap">
          <div><div class="big-count">${stats.checkedInPax}</div><span class="muted small">orang sudah datang</span></div>
          <div><b style="font-size:1.4rem">${stats.checkedIn}</b><br><span class="muted small">undangan check-in</span></div>
          <div><b style="font-size:1.4rem">${stats.pax}</b><br><span class="muted small">orang konfirmasi hadir</span></div>
        </div>
        <div class="progress" style="margin-top:1rem"><i style="width:${Math.min(100, (stats.checkedInPax / Math.max(1, stats.pax)) * 100)}%;background:var(--primary)"></i></div>`;
      const recent = guests.filter((g) => g.checkedInAt).sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt)).slice(0, 8);
      $('#recent').innerHTML = recent.length ? recent.map((g) => `
        <div style="display:flex;justify-content:space-between;gap:.5rem;padding:.45rem 0;border-bottom:1px solid var(--line)">
          <span>${esc(g.name)} <span class="muted small">· ${g.checkedInCount} orang</span></span>
          <span class="muted small">${esc(fmtDate(g.checkedInAt, inv.config.timeZone, { hour: '2-digit', minute: '2-digit' }))}</span>
        </div>`).join('') : '<p class="muted small">Belum ada tamu yang check-in.</p>';
    }

    function renderResult(kind, html) {
      $('#result').innerHTML = `<div class="result-card ${kind}">${html}</div>`;
    }

    function showGuest(guest, already) {
      current = guest;
      count = guest.checkedInCount || guest.rsvp?.guests || 1;
      const rsvpText = guest.rsvp ? `${attendanceBadge(guest.rsvp.attendance)} ${guest.rsvp.attendance === 'yes' ? `· konfirmasi ${guest.rsvp.guests} orang` : ''}` : attendanceBadge(null);
      renderResult(already ? 'warn' : 'ok', `
        <span class="code-pill">${esc(guest.code)}</span>
        <h3>${esc(guest.name)}</h3>
        <p>${guest.group ? `<span class="badge info">${esc(guest.group)}</span> ` : ''}${rsvpText}</p>
        ${already ? `<p><b>Sudah check-in</b> pukul ${esc(fmtDate(guest.checkedInAt, inv.config.timeZone, { hour: '2-digit', minute: '2-digit' }))} (${guest.checkedInCount} orang)</p>` : ''}
        <div class="stepper"><button type="button" data-act="minus">−</button><b id="countValue">${count}</b><button type="button" data-act="plus">+</button></div>
        <div class="muted small">Jumlah orang yang datang (maks. undangan: ${guest.pax})</div>
        <div style="margin-top:1rem"><button class="btn btn-primary btn-lg" data-act="confirm">${icon('check')} ${already ? 'Perbarui jumlah' : 'Check-in sekarang'}</button></div>`);
    }

    async function lookup(code) {
      const clean = String(code || '').trim();
      if (!clean) {
        return;
      }
      try {
        const res = await api(`/api/invitations/${id}/checkin`, { method: 'POST', body: { code: clean } });
        showGuest(res.guest, res.alreadyCheckedIn);
      } catch (err) {
        current = null;
        renderResult('err', `<h3>Tidak ditemukan</h3><p>${esc(err.message)}</p>`);
      }
    }

    async function confirmCheckin() {
      if (!current) {
        return;
      }
      try {
        const res = await api(`/api/invitations/${id}/checkin`, { method: 'POST', body: { code: current.code, confirm: true, count } });
        stats = res.stats;
        const index = guests.findIndex((g) => g.id === res.guest.id);
        if (index >= 0) {
          guests[index] = res.guest;
        }
        renderStats();
        renderResult('ok', `<div class="big-count">✓</div><h3>${esc(res.guest.name)}</h3><p>Check-in ${res.guest.checkedInCount} orang berhasil. Selamat datang!</p>`);
        current = null;
        $('#codeInput').value = '';
        $('#codeInput').focus();
      } catch (err) {
        toast(err.message, 'error');
      }
    }

    function stopScan() {
      clearInterval(scanTimer);
      scanTimer = null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      const scanner = $('#scanner');
      if (scanner) {
        scanner.hidden = true;
      }
    }

    async function startScan() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = $('#scanVideo');
        video.srcObject = stream;
        $('#scanner').hidden = false;
        await video.play();
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        scanTimer = setInterval(async () => {
          try {
            const codes = await detector.detect(video);
            if (codes.length) {
              stopScan();
              if (navigator.vibrate) {
                navigator.vibrate(80);
              }
              lookup(codes[0].rawValue);
            }
          } catch {
            /* frame not ready */
          }
        }, 300);
      } catch (err) {
        stopScan();
        toast('Kamera tidak bisa dibuka: ' + err.message, 'error');
      }
    }

    renderStats();
    setTimeout(() => $('#codeInput')?.focus(), 50);

    state.view = {
      cleanup: stopScan,
      onSubmit(e) {
        if (e.target.id === 'codeForm') {
          e.preventDefault();
          lookup($('#codeInput').value);
        }
      },
      onInput(e) {
        if (e.target.id !== 'nameSearch') {
          return;
        }
        const q = e.target.value.trim().toLowerCase();
        const found = q.length < 2 ? [] : guests.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 8);
        $('#nameResults').innerHTML = found.map((g) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.45rem 0;border-bottom:1px solid var(--line)">
            <span>${esc(g.name)} ${g.checkedInAt ? '<span class="badge yes">✓</span>' : ''}<br><span class="muted small">${esc(g.group || '')} ${esc(g.code)}</span></span>
            <button class="btn btn-soft btn-sm" data-act="pick" data-code="${esc(g.code)}">Pilih</button>
          </div>`).join('') || (q.length >= 2 ? '<p class="muted small">Tidak ada yang cocok.</p>' : '');
      },
      onClick(e) {
        const btn = e.target.closest('[data-act]');
        if (!btn) {
          return;
        }
        const act = btn.dataset.act;
        if (act === 'scan') {
          if (stream) {
            stopScan();
          } else {
            startScan();
          }
        } else if (act === 'pick') {
          lookup(btn.dataset.code);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (act === 'plus' && current) {
          count = Math.min(Math.max(current.pax, 1) + 5, count + 1);
          $('#countValue').textContent = count;
        } else if (act === 'minus' && current) {
          count = Math.max(1, count - 1);
          $('#countValue').textContent = count;
        } else if (act === 'confirm') {
          confirmCheckin();
        }
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */
  async function boot() {
    try {
      const me = await api('/api/auth/me');
      state.user = me.user;
      state.appName = me.appName || state.appName;
      document.title = `Dashboard · ${state.appName}`;
    } catch {
      state.user = null;
    }
    router();
  }

  boot();
})();
