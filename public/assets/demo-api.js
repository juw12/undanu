/*
 * Undanu — static demo backend (GitHub Pages only).
 *
 * The real dashboard talks to the Python server. On GitHub Pages there is no server, so this file
 * answers the dashboard's /api/... requests inside the browser, mirroring server.py's responses.
 * Data lives in this browser's localStorage (key below) and can be reset from the demo bar.
 * Loaded by docs/app/index.html (built by tools/build_pages.py) before app.js; never by the server.
 */
(function () {
  'use strict';

  const SEED = window.UNDANU_DEMO_SEED;
  const STORE_KEY = 'undanu_demo_db_v1';
  const SITE_ROOT = new URL('../', location.href);
  const DEMO_PAGE = new URL('demo/', SITE_ROOT);
  const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const DEFAULT_MEALS = ['Halal', 'Non-halal', 'Vegetarian'];
  const realFetch = window.fetch.bind(window);

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const nowIso = () => new Date().toISOString();
  const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
  const clampInt = (value, low, high, fallback) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.max(low, Math.min(high, n)) : fallback;
  };
  const cleanText = (value, max) => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }

  // Invitation pages: every demo invitation opens the static demo page; ?dash=<slug> makes it
  // show that invitation's saved config from this browser.
  window.UNDANU_DEMO = {
    inviteHref(slug, query = '') {
      const params = new URLSearchParams(String(query).replace(/^\?/, ''));
      params.set('switcher', '0');
      params.set('dash', slug);
      return `${DEMO_PAGE.pathname}?${params}`;
    }
  };

  /* ---------------------------------------------------------------- */
  /* Storage                                                          */
  /* ---------------------------------------------------------------- */
  function normalisePhone(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = `62${digits.slice(1)}`;
    } else if (digits.startsWith('8')) {
      digits = `62${digits}`;
    }
    return digits.slice(0, 16);
  }

  function newCode(db, invitationId) {
    for (;;) {
      let code = '';
      for (let i = 0; i < 6; i += 1) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      if (!db.guests.some((g) => g.invitationId === invitationId && g.code === code)) {
        return code;
      }
    }
  }

  function freshDb() {
    const db = {
      seq: 100,
      loggedIn: true,
      user: { id: 1, email: SEED.user.email, name: SEED.user.name },
      review: null,
      invitations: [],
      guests: [],
      rsvps: [],
      gifts: [],
      tables: []
    };
    const invitation = {
      id: 1,
      slug: SEED.slug,
      published: true,
      config: clone(SEED.config),
      createdAt: ago(60 * 24 * 5),
      updatedAt: ago(45)
    };
    db.invitations.push(invitation);

    SEED.guests.forEach((g, i) => {
      db.guests.push({
        id: (db.seq += 1),
        invitationId: invitation.id,
        code: newCode(db, invitation.id),
        name: g.name,
        phone: normalisePhone(g.phone),
        pax: g.pax,
        grp: g.group,
        source: 'list',
        sentAt: g.sent ? ago(60 * 26 - i * 37) : null,
        openedAt: g.opened ? ago(60 * 20 - i * 41) : null,
        openCount: g.opened ? 1 + (i % 3) : 0,
        checkedInAt: null,
        checkedInCount: 0,
        meal: g.meal || '',
        dietNote: '',
        tableId: null,
        createdAt: ago(60 * 24 * 4)
      });
    });
    const byName = (name) => db.guests.find((g) => g.name === name);

    Object.entries(SEED.rsvps).forEach(([name, r], i) => {
      const guest = byName(name);
      if (r.attendance !== 'no') {
        guest.meal = r.meal || guest.meal;
        guest.dietNote = r.dietNote || '';
      }
      const stamp = ago(60 * 14 - i * 97);
      db.rsvps.push({
        id: (db.seq += 1),
        invitationId: invitation.id,
        guestId: guest.id,
        name,
        attendance: r.attendance,
        guests: r.attendance === 'no' ? 0 : r.guests,
        message: r.message,
        song: r.song || '',
        hidden: false,
        likes: r.likes || 0,
        reply: r.reply || '',
        createdAt: stamp,
        updatedAt: stamp
      });
    });

    SEED.gifts.forEach((gift, i) => {
      db.gifts.push({
        id: (db.seq += 1),
        invitationId: invitation.id,
        guestId: byName(gift.guest)?.id || null,
        name: gift.guest,
        method: gift.method,
        amount: gift.amount,
        message: gift.message,
        createdAt: ago(60 * 9 - i * 53)
      });
    });

    SEED.tables.forEach(([name, capacity], i) => {
      db.tables.push({ id: (db.seq += 1), invitationId: invitation.id, name, capacity, sort: i });
    });
    autoSeat(db, invitation.id, { includeMaybe: true, includePending: true, keepExisting: false });

    const [checkedName, checkedCount] = SEED.checkedIn;
    const checked = byName(checkedName);
    checked.checkedInAt = ago(12);
    checked.checkedInCount = checkedCount;
    return db;
  }

  function loadDb() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (stored && stored.seedVersion === SEED.version) {
        return stored;
      }
    } catch {
      /* corrupted -> rebuild */
    }
    const db = freshDb();
    db.seedVersion = SEED.version;
    return db;
  }

  let db = loadDb();

  function saveDb() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(db));
    } catch {
      /* storage full / private mode: keep working in memory */
    }
  }
  saveDb();

  /* ---------------------------------------------------------------- */
  /* Domain helpers (mirroring server.py)                             */
  /* ---------------------------------------------------------------- */
  function ownInvitation(id) {
    const invitation = db.invitations.find((inv) => inv.id === Number(id));
    if (!invitation) {
      throw new ApiError(404, 'Undangan tidak ditemukan.');
    }
    return invitation;
  }

  // Function declarations (hoisted): freshDb() uses them while the store is being built.
  function rsvpFor(guestId, database = db) {
    return database.rsvps.find((r) => r.guestId === guestId);
  }

  function tableById(tableId) {
    return db.tables.find((t) => t.id === tableId);
  }

  function guestsOf(invitationId) {
    return db.guests.filter((g) => g.invitationId === invitationId);
  }

  function inviteUrl() {
    return DEMO_PAGE.href;
  }

  function mealOptions(config) {
    const raw = config?.rsvp?.mealOptions;
    const list = Array.isArray(raw) ? raw : DEFAULT_MEALS;
    return Array.from(new Set(list.map((m) => cleanText(m, 40)).filter(Boolean))).slice(0, 8);
  }

  function cleanMeal(value, options) {
    const wanted = cleanText(value, 40).toLowerCase();
    return options.find((option) => option.toLowerCase() === wanted) || '';
  }

  function guestPayload(g) {
    const r = rsvpFor(g.id);
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      phone: g.phone,
      pax: g.pax,
      group: g.grp,
      source: g.source,
      sentAt: g.sentAt,
      openedAt: g.openedAt,
      openCount: g.openCount,
      checkedInAt: g.checkedInAt,
      checkedInCount: g.checkedInCount,
      meal: g.meal,
      dietNote: g.dietNote,
      tableId: g.tableId,
      tableName: g.tableId ? tableById(g.tableId)?.name || null : null,
      rsvp: r ? { attendance: r.attendance, guests: r.guests, message: r.message, updatedAt: r.updatedAt } : null
    };
  }

  function stats(invitationId) {
    const guests = guestsOf(invitationId);
    const rsvps = db.rsvps.filter((r) => r.invitationId === invitationId);
    const gifts = db.gifts.filter((g) => g.invitationId === invitationId);
    const tables = db.tables.filter((t) => t.invitationId === invitationId);
    const meals = {};
    rsvps.filter((r) => r.attendance === 'yes').forEach((r) => {
      const guest = db.guests.find((g) => g.id === r.guestId);
      const key = guest?.meal || '';
      meals[key] = meals[key] || { meal: key, parties: 0, pax: 0 };
      meals[key].parties += 1;
      meals[key].pax += r.guests;
    });
    return {
      gifts: gifts.length,
      giftAmount: gifts.reduce((sum, g) => sum + (g.amount || 0), 0),
      guests: guests.length,
      sent: guests.filter((g) => g.sentAt).length,
      opened: guests.filter((g) => g.openedAt).length,
      checkedIn: guests.filter((g) => g.checkedInAt).length,
      checkedInPax: guests.reduce((sum, g) => sum + (g.checkedInCount || 0), 0),
      responses: rsvps.length,
      yes: rsvps.filter((r) => r.attendance === 'yes').length,
      no: rsvps.filter((r) => r.attendance === 'no').length,
      maybe: rsvps.filter((r) => r.attendance === 'maybe').length,
      pax: rsvps.filter((r) => r.attendance === 'yes').reduce((sum, r) => sum + r.guests, 0),
      wishes: rsvps.filter((r) => r.message).length,
      meals: Object.values(meals).sort((a, b) => b.pax - a.pax),
      tables: tables.length,
      seats: tables.reduce((sum, t) => sum + t.capacity, 0),
      seatedParties: guests.filter((g) => g.tableId).length
    };
  }

  function invitationSummary(inv) {
    const couple = inv.config.couple || {};
    return {
      id: inv.id,
      slug: inv.slug,
      published: inv.published,
      groom: couple.groom?.nickname || '',
      bride: couple.bride?.nickname || '',
      weddingDate: inv.config.weddingDate || '',
      theme: inv.config.theme || 'ivory',
      updatedAt: inv.updatedAt,
      stats: stats(inv.id)
    };
  }

  function validateSlug(slug, excludeId) {
    const clean = String(slug || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(clean) || clean.includes('--')) {
      throw new ApiError(400, "Link hanya boleh huruf kecil, angka, dan tanda '-' (3–40 karakter).");
    }
    if (['app', 'api', 'demo', 'admin', 'assets'].includes(clean)) {
      throw new ApiError(400, 'Link ini tidak tersedia.');
    }
    if (db.invitations.some((inv) => inv.slug === clean && inv.id !== excludeId)) {
      throw new ApiError(409, 'Link ini sudah dipakai. Coba yang lain.');
    }
    return clean;
  }

  function seatsNeeded(database, guest, includeMaybe, includePending) {
    const r = rsvpFor(guest.id, database);
    if (!r) {
      return includePending ? guest.pax : 0;
    }
    if (r.attendance === 'yes') {
      return Math.max(1, r.guests || 1);
    }
    if (r.attendance === 'maybe') {
      return includeMaybe ? Math.max(1, r.guests || guest.pax) : 0;
    }
    return 0;
  }

  // Same algorithm as plan_seating() in server.py: groups stay together, parties are never split.
  function planSeating(parties, tables) {
    const free = {};
    const order = tables.map((t) => t.id);
    tables.forEach((t) => {
      free[t.id] = t.capacity - t.load;
    });
    const groups = new Map();
    parties.forEach((p) => {
      const key = p.group.trim().toLowerCase() || `\u0000solo-${p.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(p);
    });
    const total = (members) => members.reduce((sum, p) => sum + p.seats, 0);
    const orderedGroups = [...groups.values()].sort((a, b) => (total(b) - total(a)) || (a[0].id - b[0].id));
    const assignment = {};
    const unseated = [];
    orderedGroups.forEach((members) => {
      const groupTables = [];
      [...members].sort((a, b) => (b.seats - a.seats) || (a.id - b.id)).forEach((party) => {
        let table = null;
        const fitsOwn = groupTables.filter((t) => free[t] >= party.seats);
        if (fitsOwn.length) {
          table = fitsOwn.reduce((best, t) => ((free[t] < free[best] || (free[t] === free[best] && order.indexOf(t) < order.indexOf(best))) ? t : best));
        } else {
          const fitsAny = order.filter((t) => free[t] >= party.seats);
          if (!fitsAny.length) {
            unseated.push(party);
            return;
          }
          table = fitsAny.reduce((best, t) => ((free[t] > free[best]) ? t : best));
          groupTables.push(table);
        }
        free[table] -= party.seats;
        assignment[party.id] = table;
      });
    });
    return { assignment, unseated };
  }

  function autoSeat(database, invitationId, { includeMaybe, includePending, keepExisting }) {
    const tables = database.tables
      .filter((t) => t.invitationId === invitationId)
      .sort((a, b) => a.sort - b.sort || a.id - b.id)
      .map((t) => ({ id: t.id, capacity: t.capacity, load: 0 }));
    if (!tables.length) {
      throw new ApiError(400, 'Buat meja dulu sebelum mengatur tempat duduk.');
    }
    const load = Object.fromEntries(tables.map((t) => [t.id, 0]));
    const parties = [];
    database.guests.filter((g) => g.invitationId === invitationId).sort((a, b) => a.id - b.id).forEach((guest) => {
      const seats = seatsNeeded(database, guest, includeMaybe, includePending);
      if (seats === 0) {
        guest.tableId = null;
      } else if (keepExisting && guest.tableId in load) {
        load[guest.tableId] += seats;
      } else {
        guest.tableId = null;
        parties.push({ id: guest.id, group: guest.grp || '', seats, name: guest.name });
      }
    });
    tables.forEach((t) => {
      t.load = load[t.id];
    });
    const { assignment, unseated } = planSeating(parties, tables);
    Object.entries(assignment).forEach(([guestId, tableId]) => {
      database.guests.find((g) => g.id === Number(guestId)).tableId = tableId;
    });
    const maxCapacity = Math.max(...tables.map((t) => t.capacity));
    return {
      seated: Object.keys(assignment).length,
      unseated: unseated.map((p) => ({ id: p.id, name: p.name, seats: p.seats, tooBig: p.seats > maxCapacity }))
    };
  }

  function ownTableId(invitationId, value) {
    if (value === null || value === undefined || value === '' || value === 0) {
      return null;
    }
    const table = db.tables.find((t) => t.id === Number(value) && t.invitationId === invitationId);
    if (!table) {
      throw new ApiError(400, 'Meja tidak ditemukan.');
    }
    return table.id;
  }

  /* ---------------------------------------------------------------- */
  /* Routes                                                           */
  /* ---------------------------------------------------------------- */
  const routes = [];
  const route = (method, pattern, handler) => routes.push([method, new RegExp(`^${pattern}$`), handler]);
  const userPayload = () => ({ ...db.user, isAdmin: false });

  route('GET', '/api/auth/me', () => ({ user: db.loggedIn ? userPayload() : null, appName: 'Undanu' }));
  route('POST', '/api/auth/(login|register)', () => {
    db.loggedIn = true;
    return { user: userPayload() };
  });
  route('POST', '/api/auth/logout', () => {
    db.loggedIn = false;
    return { ok: true };
  });
  route('POST', '/api/auth/password', () => ({ ok: true }));
  route('POST', '/api/auth/forgot', () => ({ ok: true }));
  route('POST', '/api/auth/reset', () => {
    throw new ApiError(400, 'Reset kata sandi tidak tersedia di demo.');
  });
  route('POST', '/api/auth/delete-account', () => {
    db = freshDb();
    db.seedVersion = SEED.version;
    db.loggedIn = false;
    return { ok: true };
  });

  route('GET', '/api/invitations', () => ({
    invitations: [...db.invitations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(invitationSummary)
  }));
  route('GET', '/api/slug-check', (m, body, query) => {
    try {
      validateSlug(query.get('slug'), query.get('exclude') ? Number(query.get('exclude')) : null);
      return { available: true };
    } catch (err) {
      return { available: false, message: err.message };
    }
  });
  route('POST', '/api/invitations', (m, body) => {
    if (db.invitations.length >= 10) {
      throw new ApiError(400, 'Maksimal 10 undangan per akun.');
    }
    const stamp = nowIso();
    const invitation = {
      id: (db.seq += 1),
      slug: validateSlug(body.slug),
      published: false,
      config: body.config || {},
      createdAt: stamp,
      updatedAt: stamp
    };
    db.invitations.push(invitation);
    return [201, { invitation: invitationSummary(invitation) }];
  });
  route('GET', '/api/invitations/(\\d+)', (m) => {
    const inv = ownInvitation(m[1]);
    return { id: inv.id, slug: inv.slug, published: inv.published, config: inv.config, url: inviteUrl(), stats: stats(inv.id) };
  });
  route('PUT', '/api/invitations/(\\d+)', (m, body) => {
    const inv = ownInvitation(m[1]);
    if ('slug' in body && body.slug !== inv.slug) {
      inv.slug = validateSlug(body.slug, inv.id);
    }
    if ('config' in body) {
      inv.config = body.config;
    }
    if ('published' in body) {
      inv.published = Boolean(body.published);
    }
    inv.updatedAt = nowIso();
    return { ok: true, slug: inv.slug, published: inv.published, url: inviteUrl() };
  });
  route('DELETE', '/api/invitations/(\\d+)', (m) => {
    const inv = ownInvitation(m[1]);
    const guestIds = new Set(guestsOf(inv.id).map((g) => g.id));
    db.invitations = db.invitations.filter((i) => i.id !== inv.id);
    db.guests = db.guests.filter((g) => g.invitationId !== inv.id);
    db.rsvps = db.rsvps.filter((r) => !guestIds.has(r.guestId));
    db.gifts = db.gifts.filter((g) => g.invitationId !== inv.id);
    db.tables = db.tables.filter((t) => t.invitationId !== inv.id);
    return { ok: true };
  });
  route('POST', '/api/invitations/(\\d+)/upload', (m, body) => {
    ownInvitation(m[1]);
    if (!(body instanceof Blob)) {
      throw new ApiError(400, 'Format file tidak didukung.');
    }
    const type = body.type || '';
    const kind = type.startsWith('image/') ? 'image' : type.startsWith('audio/') ? 'audio' : type.startsWith('video/') ? 'video' : '';
    if (!kind) {
      throw new ApiError(400, 'Format file tidak didukung (JPG, PNG, WEBP, GIF, MP3, MP4, WEBM, atau MOV).');
    }
    // Demo only: the file stays in this tab (not uploaded anywhere, gone after a reload).
    return [201, { url: URL.createObjectURL(body), kind }];
  });

  route('GET', '/api/invitations/(\\d+)/guests', (m) => {
    const inv = ownInvitation(m[1]);
    return { guests: guestsOf(inv.id).sort((a, b) => b.id - a.id).map(guestPayload), stats: stats(inv.id) };
  });
  route('POST', '/api/invitations/(\\d+)/guests', (m, body) => {
    const inv = ownInvitation(m[1]);
    const items = Array.isArray(body.guests) ? body.guests : [];
    if (!items.length) {
      throw new ApiError(400, 'Daftar tamu kosong.');
    }
    if (guestsOf(inv.id).length + items.length > 500) {
      throw new ApiError(400, 'Di demo maksimal 500 tamu per undangan.');
    }
    const defaultPax = clampInt(inv.config.rsvp?.defaultPax, 1, 20, 2);
    const options = mealOptions(inv.config);
    let created = 0;
    items.forEach((item) => {
      const name = cleanText(item?.name, 80);
      if (!name) {
        return;
      }
      db.guests.push({
        id: (db.seq += 1),
        invitationId: inv.id,
        code: newCode(db, inv.id),
        name,
        phone: normalisePhone(item.phone),
        pax: clampInt(item.pax, 1, 20, defaultPax),
        grp: cleanText(item.group, 40),
        source: 'list',
        sentAt: null,
        openedAt: null,
        openCount: 0,
        checkedInAt: null,
        checkedInCount: 0,
        meal: cleanMeal(item.meal, options),
        dietNote: '',
        tableId: null,
        createdAt: nowIso()
      });
      created += 1;
    });
    return [201, { created }];
  });
  route('PUT', '/api/invitations/(\\d+)/guests/(\\d+)', (m, body) => {
    const inv = ownInvitation(m[1]);
    const guest = guestsOf(inv.id).find((g) => g.id === Number(m[2]));
    if (!guest) {
      throw new ApiError(404, 'Tamu tidak ditemukan.');
    }
    const name = 'name' in body ? cleanText(body.name, 80) : guest.name;
    if (!name) {
      throw new ApiError(400, 'Nama tamu wajib diisi.');
    }
    guest.name = name;
    if ('phone' in body) {
      guest.phone = normalisePhone(body.phone);
    }
    if ('pax' in body) {
      guest.pax = clampInt(body.pax, 1, 20, guest.pax);
    }
    if ('group' in body) {
      guest.grp = cleanText(body.group, 40);
    }
    if ('meal' in body) {
      guest.meal = cleanText(body.meal, 40);
    }
    if ('dietNote' in body) {
      guest.dietNote = cleanText(body.dietNote, 120);
    }
    if ('tableId' in body) {
      guest.tableId = ownTableId(inv.id, body.tableId);
    }
    if ('sent' in body) {
      guest.sentAt = body.sent ? (guest.sentAt || nowIso()) : null;
    }
    if ('checkedIn' in body) {
      guest.checkedInAt = body.checkedIn ? (guest.checkedInAt || nowIso()) : null;
      guest.checkedInCount = body.checkedIn ? clampInt(body.checkedInCount, 1, 50, Math.max(1, guest.checkedInCount)) : 0;
    }
    return { guest: guestPayload(guest) };
  });
  route('DELETE', '/api/invitations/(\\d+)/guests/(\\d+)', (m) => {
    const inv = ownInvitation(m[1]);
    const guestId = Number(m[2]);
    db.guests = db.guests.filter((g) => !(g.id === guestId && g.invitationId === inv.id));
    db.rsvps = db.rsvps.filter((r) => r.guestId !== guestId);
    db.gifts.forEach((g) => {
      if (g.guestId === guestId) {
        g.guestId = null;
      }
    });
    return { ok: true };
  });
  route('POST', '/api/invitations/(\\d+)/checkin', (m, body) => {
    const inv = ownInvitation(m[1]);
    const code = cleanText(body.code, 200).toUpperCase().split('|')[0].trim().replace(/^INV-/, '');
    const guest = guestsOf(inv.id).find((g) => g.code === code);
    if (!guest) {
      throw new ApiError(404, `Kode ${code || '-'} tidak ditemukan.`);
    }
    const already = Boolean(guest.checkedInAt);
    if (body.confirm) {
      guest.checkedInAt = guest.checkedInAt || nowIso();
      guest.checkedInCount = clampInt(body.count, 1, 50, rsvpFor(guest.id)?.guests || 1);
    }
    return { guest: guestPayload(guest), alreadyCheckedIn: already, stats: stats(inv.id) };
  });

  route('GET', '/api/invitations/(\\d+)/rsvps', (m) => {
    const inv = ownInvitation(m[1]);
    const rsvps = db.rsvps
      .filter((r) => r.invitationId === inv.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((r) => {
        const g = db.guests.find((guest) => guest.id === r.guestId) || {};
        return {
          id: r.id,
          name: r.name,
          invitedAs: g.name,
          code: g.code,
          group: g.grp,
          pax: g.pax,
          source: g.source,
          attendance: r.attendance,
          guests: r.guests,
          message: r.message,
          hidden: r.hidden,
          song: r.song,
          likes: r.likes,
          reply: r.reply,
          meal: g.meal || '',
          dietNote: g.dietNote || '',
          tableName: g.tableId ? tableById(g.tableId)?.name || null : null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        };
      });
    return { rsvps, stats: stats(inv.id) };
  });
  route('PUT', '/api/invitations/(\\d+)/rsvps/(\\d+)', (m, body) => {
    const inv = ownInvitation(m[1]);
    const r = db.rsvps.find((x) => x.id === Number(m[2]) && x.invitationId === inv.id);
    if (!r) {
      throw new ApiError(404, 'RSVP tidak ditemukan.');
    }
    if ('hidden' in body) {
      r.hidden = Boolean(body.hidden);
    }
    if ('reply' in body) {
      r.reply = cleanText(body.reply, 500);
    }
    return { ok: true };
  });
  route('DELETE', '/api/invitations/(\\d+)/rsvps/(\\d+)', (m) => {
    const inv = ownInvitation(m[1]);
    db.rsvps = db.rsvps.filter((r) => !(r.id === Number(m[2]) && r.invitationId === inv.id));
    return { ok: true };
  });

  route('GET', '/api/invitations/(\\d+)/gifts', (m) => {
    const inv = ownInvitation(m[1]);
    const gifts = db.gifts
      .filter((g) => g.invitationId === inv.id)
      .sort((a, b) => b.id - a.id)
      .map((gift) => {
        const guest = db.guests.find((g) => g.id === gift.guestId);
        return {
          id: gift.id,
          name: gift.name,
          invitedAs: guest?.name || null,
          group: guest?.grp || null,
          method: gift.method,
          amount: gift.amount,
          message: gift.message,
          createdAt: gift.createdAt
        };
      });
    return { gifts, stats: stats(inv.id) };
  });
  route('DELETE', '/api/invitations/(\\d+)/gifts/(\\d+)', (m) => {
    const inv = ownInvitation(m[1]);
    db.gifts = db.gifts.filter((g) => !(g.id === Number(m[2]) && g.invitationId === inv.id));
    return { ok: true };
  });

  const tablesOf = (invitationId) => db.tables
    .filter((t) => t.invitationId === invitationId)
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
    .map((t) => ({ id: t.id, name: t.name, capacity: t.capacity, sort: t.sort }));
  route('GET', '/api/invitations/(\\d+)/tables', (m) => ({ tables: tablesOf(ownInvitation(m[1]).id) }));
  route('PUT', '/api/invitations/(\\d+)/tables', (m, body) => {
    const inv = ownInvitation(m[1]);
    if (!Array.isArray(body.tables)) {
      throw new ApiError(400, 'Daftar meja tidak valid.');
    }
    if (body.tables.length > 200) {
      throw new ApiError(400, 'Maksimal 200 meja.');
    }
    const keep = new Set();
    body.tables.forEach((item, index) => {
      const name = cleanText(item?.name, 40) || `Meja ${index + 1}`;
      const capacity = clampInt(item?.capacity, 1, 50, 10);
      const existing = db.tables.find((t) => t.id === Number(item?.id) && t.invitationId === inv.id);
      if (existing) {
        Object.assign(existing, { name, capacity, sort: index });
        keep.add(existing.id);
      } else {
        const id = (db.seq += 1);
        db.tables.push({ id, invitationId: inv.id, name, capacity, sort: index });
        keep.add(id);
      }
    });
    const removed = new Set(db.tables.filter((t) => t.invitationId === inv.id && !keep.has(t.id)).map((t) => t.id));
    db.guests.forEach((g) => {
      if (removed.has(g.tableId)) {
        g.tableId = null;
      }
    });
    db.tables = db.tables.filter((t) => !removed.has(t.id));
    return { tables: tablesOf(inv.id) };
  });
  route('PUT', '/api/invitations/(\\d+)/seating', (m, body) => {
    const inv = ownInvitation(m[1]);
    (Array.isArray(body.assignments) ? body.assignments : []).forEach((item) => {
      const tableId = ownTableId(inv.id, item?.tableId);
      const guest = guestsOf(inv.id).find((g) => g.id === Number(item?.guestId));
      if (guest) {
        guest.tableId = tableId;
      }
    });
    return { ok: true, stats: stats(inv.id) };
  });
  route('POST', '/api/invitations/(\\d+)/seating/auto', (m, body) => {
    const inv = ownInvitation(m[1]);
    const result = autoSeat(db, inv.id, {
      includeMaybe: Boolean(body.includeMaybe),
      includePending: Boolean(body.includePending),
      keepExisting: Boolean(body.keepExisting)
    });
    return { ...result, stats: stats(inv.id) };
  });

  route('GET', '/api/reviews/mine', () => ({ review: db.review }));
  route('POST', '/api/reviews', (m, body) => {
    const rating = clampInt(body.rating, 0, 5, 0);
    const text = cleanText(body.text, 600);
    if (rating < 1 || text.length < 10) {
      throw new ApiError(400, 'Pilih bintang dan tulis ulasan minimal 10 karakter.');
    }
    db.review = {
      id: 1,
      name: cleanText(body.name, 60) || db.user.name,
      couple: cleanText(body.couple, 60),
      rating,
      text,
      approved: false,
      updatedAt: nowIso()
    };
    return { review: db.review };
  });

  /* ---------------------------------------------------------------- */
  /* fetch() interception                                             */
  /* ---------------------------------------------------------------- */
  function jsonResponse(status, data) {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  }

  window.fetch = async function demoFetch(input, init = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
    if (!url.pathname.startsWith('/api/') || url.origin !== location.origin) {
      return realFetch(input, init);
    }
    const method = (init.method || 'GET').toUpperCase();
    let body = init.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body ?? {};
    for (const [routeMethod, pattern, handler] of routes) {
      const match = method === routeMethod && url.pathname.match(pattern);
      if (match) {
        try {
          const result = handler(match, body, url.searchParams);
          saveDb();
          await new Promise((resolve) => setTimeout(resolve, 60));   // feel like a network call
          return Array.isArray(result) ? jsonResponse(result[0], result[1]) : jsonResponse(200, result);
        } catch (err) {
          return jsonResponse(err.status || 500, { error: err.message || 'Terjadi kesalahan.' });
        }
      }
    }
    return jsonResponse(404, { error: 'Fitur ini tidak tersedia di demo.' });
  };

  /* ---------------------------------------------------------------- */
  /* CSV export, links, WhatsApp, demo bar                            */
  /* ---------------------------------------------------------------- */
  function exportCsv(invitationId) {
    const inv = ownInvitation(invitationId);
    const labels = { yes: 'Hadir', no: 'Tidak Hadir', maybe: 'Masih Ragu' };
    const cell = (value) => {
      let text = value === null || value === undefined ? '' : String(value);
      if (/^[=+\-@]/.test(text)) {
        text = `'${text}`;
      }
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const rows = [['Nama', 'Grup', 'WhatsApp', 'Kode', 'Link', 'Maks Tamu', 'Status RSVP', 'Jumlah Hadir', 'Menu',
      'Catatan Makanan', 'Meja', 'Ucapan', 'Request Lagu', 'Undangan Dikirim', 'Dibuka', 'Check-in', 'Jumlah Check-in', 'Sumber']];
    guestsOf(inv.id).sort((a, b) => a.name.localeCompare(b.name)).forEach((g) => {
      const r = rsvpFor(g.id);
      rows.push([g.name, g.grp, g.phone, g.code, `${inviteUrl()}?g=${g.code}`, g.pax, labels[r?.attendance] || 'Belum',
        r?.guests || 0, g.meal, g.dietNote, g.tableId ? tableById(g.tableId)?.name : '', r?.message || '', r?.song || '',
        g.sentAt || '', g.openedAt || '', g.checkedInAt || '', g.checkedInCount, g.source === 'list' ? 'Daftar tamu' : 'Link umum']);
    });
    const csv = `\ufeff${rows.map((row) => row.map(cell).join(',')).join('\r\n')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `tamu-${inv.slug}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) {
      return;
    }
    const href = link.getAttribute('href');
    const csv = href.match(/^\/api\/invitations\/(\d+)\/export\.csv$/);
    if (csv) {
      e.preventDefault();
      exportCsv(csv[1]);
    } else if (href === '/') {
      e.preventDefault();
      location.href = SITE_ROOT.href;
    }
  }, true);

  // Never message the sample phone numbers: open WhatsApp's own contact picker instead.
  const realOpen = window.open.bind(window);
  window.open = function demoOpen(url, ...rest) {
    const target = String(url || '');
    if (/^https:\/\/wa\.me\/\d+/.test(target)) {
      return realOpen(target.replace(/^https:\/\/wa\.me\/\d+/, 'https://wa.me/'), ...rest);
    }
    return realOpen(url, ...rest);
  };

  function addDemoBar() {
    const bar = document.createElement('div');
    bar.className = 'demo-bar';
    bar.innerHTML = `
      <span><b>Mode demo</b> · data hanya tersimpan di browser ini</span>
      <button type="button" data-demo-reset>Reset demo</button>
      <a href="https://github.com/juw12/undanu#deploy" target="_blank" rel="noopener">Deploy versi asli</a>`;
    bar.querySelector('[data-demo-reset]').addEventListener('click', () => {
      localStorage.removeItem(STORE_KEY);
      location.hash = '#/';
      location.reload();
    });
    document.body.appendChild(bar);
    document.body.classList.add('has-demo-bar');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDemoBar);
  } else {
    addDemoBar();
  }
})();
