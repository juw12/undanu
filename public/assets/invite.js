/* =====================================================================
   Public invitation page runtime.
   Data comes from the server (inline JSON) and RSVPs go to the API.
   ===================================================================== */
(() => {
  'use strict';

  const DATA = JSON.parse(document.getElementById('invite-data').textContent || '{}');
  let C = DATA.config || {};
  const SLUG = DATA.slug;
  // Static demo (GitHub Pages): no backend, RSVPs are simulated in the browser.
  const STATIC_DEMO = Boolean(DATA.staticDemo);
  const params = new URLSearchParams(location.search);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------------------------ */
  /* Strings                                                            */
  /* ------------------------------------------------------------------ */
  const STRINGS = {
    id: {
      coverEyebrow: 'Undangan Pernikahan',
      dear: 'Kepada Yth. Bapak/Ibu/Saudara/i',
      defaultGuest: 'Tamu Undangan',
      sorryTypo: 'Mohon maaf apabila ada kesalahan penulisan nama dan gelar',
      openInvitation: 'Buka Undangan',
      theWeddingOf: 'The Wedding of',
      saveTheDate: 'Simpan Tanggal',
      days: 'Hari', hours: 'Jam', minutes: 'Menit', seconds: 'Detik',
      married: 'Hari bahagia telah tiba — terima kasih atas doa restunya',
      coupleTitle: 'Mempelai',
      eventsTitle: 'Rangkaian Acara',
      directions: 'Petunjuk Arah',
      showMap: 'Peta',
      hideMap: 'Tutup Peta',
      icsFile: 'Kalender',
      until: 'Selesai',
      livestreamTitle: 'Siaran Langsung',
      livestreamText: 'Bagi yang berhalangan hadir, saksikan momen bahagia kami secara virtual melalui',
      watch: 'Tonton Siaran',
      dresscodeTitle: 'Dress Code',
      storyTitle: 'Kisah Kami',
      galleryTitle: 'Galeri',
      photo: 'Foto',
      rsvpTitle: 'Konfirmasi Kehadiran',
      rsvpIntro: 'Mohon konfirmasi kehadiran Anda sebelum {date}.',
      rsvpIntroNoDate: 'Mohon konfirmasi kehadiran Anda.',
      rsvpPax: ' Undangan ini berlaku untuk {pax} orang.',
      rsvpClosed: 'Konfirmasi kehadiran sudah ditutup. Terima kasih!',
      name: 'Nama',
      attendance: 'Kehadiran',
      attend: 'Hadir',
      notAttend: 'Tidak Hadir',
      maybe: 'Masih Ragu',
      guests: 'Jumlah Tamu',
      person: 'orang',
      message: 'Ucapan & Doa',
      messagePh: 'Tulis ucapan dan doa terbaik untuk kedua mempelai...',
      send: 'Kirim Konfirmasi',
      sending: 'Mengirim...',
      viaWa: 'Konfirmasi via WhatsApp',
      required: 'Mohon isi nama dan pilih status kehadiran.',
      sendFailed: 'Gagal mengirim. Periksa koneksi lalu coba lagi.',
      thanksYes: 'Terima kasih, {name}! Kami tidak sabar bertemu dengan Anda.',
      thanksMaybe: 'Terima kasih, {name}! Kami harap Anda bisa hadir.',
      thanksNo: 'Terima kasih, {name}, atas doa dan ucapannya.',
      passTitle: 'E-Pass Tamu',
      passText: 'Simpan & tunjukkan kode ini kepada penerima tamu saat tiba.',
      editRsvp: 'Ubah Konfirmasi',
      wishesTitle: 'Ucapan & Doa',
      wishesCount: '{n} ucapan',
      noWishes: 'Belum ada ucapan. Jadilah yang pertama!',
      loadMore: 'Lihat lebih banyak',
      justNow: 'baru saja',
      giftTitle: 'Tanda Kasih',
      giftIntro: 'Doa restu Anda adalah karunia terindah bagi kami. Namun jika ingin memberikan tanda kasih, Anda dapat mengirimkannya melalui:',
      copy: 'Salin',
      copied: 'Tersalin!',
      holderPrefix: 'a.n.',
      qrisTitle: 'Scan QRIS',
      qrisText: 'Bisa dari semua aplikasi bank & e-wallet',
      sendGiftTo: 'Kirim Kado',
      copyAddress: 'Salin Alamat',
      weAre: 'Kami yang berbahagia',
      share: 'Bagikan Undangan',
      shareText: 'Undangan pernikahan {couple}',
      linkCopied: 'Tautan undangan disalin',
      footer: 'Dibuat dengan ♥ untuk hari bahagia kami',
      poweredBy: 'Buat undanganmu sendiri di {app}',
      previewBanner: 'PRATINJAU — undangan belum dipublikasikan',
      navHome: 'Beranda', navCouple: 'Mempelai', navEvents: 'Acara', navGallery: 'Galeri', navRsvp: 'RSVP', navGift: 'Hadiah',
      videoTitle: 'Video',
      watchHere: 'Putar di sini',
      liveNow: 'Sedang berlangsung — tonton sekarang!',
      songRequest: 'Request lagu untuk acara (opsional)',
      songPh: 'Judul lagu – penyanyi',
      shareTitle: 'Bagikan undangan',
      storyShort: 'Story IG',
      copyLink: 'Salin link',
      moreApps: 'Aplikasi lain…',
      close: 'Tutup',
      storyMaking: 'Membuat gambar story…',
      storyReady: 'Gambar tersimpan — unggah ke Instagram Story ✨',
      like: 'Suka',
      coupleReply: 'Balasan mempelai',
      giftConfirmTitle: 'Konfirmasi Tanda Kasih',
      donationConfirm: 'Konfirmasi Donasi',
      giftConfirmText: 'Sudah mengirim? Beri tahu kami agar kami bisa mengucapkan terima kasih secara langsung.',
      giftConfirmBtn: 'Isi konfirmasi',
      giftMethod: 'Dikirim melalui',
      giftAmount: 'Nominal (opsional)',
      giftMessage: 'Pesan (opsional)',
      giftOther: 'Lainnya',
      giftPhysical: 'Kado fisik',
      giftSubmit: 'Kirim konfirmasi',
      giftSent: 'Terima kasih! Konfirmasi Anda sudah kami terima. 🙏',
      donationTitle: 'Donasi',
      donationIntro: 'Sebagai pengganti kado, kami mengajak Anda berbagi kebaikan melalui donasi berikut:',
      donateNow: 'Donasi sekarang',
      waRsvp: 'Halo, saya *{name}* ingin mengonfirmasi kehadiran di pernikahan {couple}:\n\nKehadiran: *{att}*\nJumlah tamu: {n}\n\nUcapan: {msg}'
    },
    en: {
      coverEyebrow: 'Wedding Invitation',
      dear: 'Dear',
      defaultGuest: 'Our Honoured Guest',
      sorryTypo: 'Please forgive us for any misspelling of your name or title',
      openInvitation: 'Open Invitation',
      theWeddingOf: 'The Wedding of',
      saveTheDate: 'Save the Date',
      days: 'Days', hours: 'Hours', minutes: 'Mins', seconds: 'Secs',
      married: 'The big day has arrived — thank you for your blessings',
      coupleTitle: 'The Couple',
      eventsTitle: 'Wedding Events',
      directions: 'Directions',
      showMap: 'Map',
      hideMap: 'Hide Map',
      icsFile: 'Calendar',
      until: 'Finish',
      livestreamTitle: 'Live Streaming',
      livestreamText: 'If you are unable to attend, join our happy moment virtually via',
      watch: 'Watch Live',
      dresscodeTitle: 'Dress Code',
      storyTitle: 'Our Story',
      galleryTitle: 'Gallery',
      photo: 'Photo',
      rsvpTitle: 'RSVP',
      rsvpIntro: 'Kindly confirm your attendance before {date}.',
      rsvpIntroNoDate: 'Kindly confirm your attendance.',
      rsvpPax: ' This invitation is valid for {pax} guest(s).',
      rsvpClosed: 'RSVP is now closed. Thank you!',
      name: 'Name',
      attendance: 'Attendance',
      attend: 'Attending',
      notAttend: 'Not Attending',
      maybe: 'Not Sure',
      guests: 'Number of Guests',
      person: 'guest(s)',
      message: 'Wishes & Prayers',
      messagePh: 'Write your best wishes for the couple...',
      send: 'Send RSVP',
      sending: 'Sending...',
      viaWa: 'RSVP via WhatsApp',
      required: 'Please enter your name and choose your attendance.',
      sendFailed: 'Failed to send. Check your connection and try again.',
      thanksYes: 'Thank you, {name}! We can’t wait to see you.',
      thanksMaybe: 'Thank you, {name}! We hope you can make it.',
      thanksNo: 'Thank you, {name}, for your kind wishes.',
      passTitle: 'Guest E-Pass',
      passText: 'Save & show this code at the reception desk.',
      editRsvp: 'Change RSVP',
      wishesTitle: 'Wishes',
      wishesCount: '{n} wishes',
      noWishes: 'No wishes yet. Be the first!',
      loadMore: 'Show more',
      justNow: 'just now',
      giftTitle: 'Wedding Gift',
      giftIntro: 'Your blessing is the greatest gift for us. However, if you wish to give a token of love, you may send it via:',
      copy: 'Copy',
      copied: 'Copied!',
      holderPrefix: '',
      qrisTitle: 'Scan QRIS',
      qrisText: 'Works with any Indonesian bank or e-wallet app',
      sendGiftTo: 'Send a Gift',
      copyAddress: 'Copy Address',
      weAre: 'With love',
      share: 'Share Invitation',
      shareText: 'Wedding invitation of {couple}',
      linkCopied: 'Invitation link copied',
      footer: 'Made with ♥ for our special day',
      poweredBy: 'Create your own invitation at {app}',
      previewBanner: 'PREVIEW — this invitation is not published yet',
      navHome: 'Home', navCouple: 'Couple', navEvents: 'Events', navGallery: 'Gallery', navRsvp: 'RSVP', navGift: 'Gift',
      videoTitle: 'Video',
      watchHere: 'Play here',
      liveNow: 'Happening now — watch live!',
      songRequest: 'Request a song for the party (optional)',
      songPh: 'Song title – artist',
      shareTitle: 'Share invitation',
      storyShort: 'IG Story',
      copyLink: 'Copy link',
      moreApps: 'More apps…',
      close: 'Close',
      storyMaking: 'Creating story image…',
      storyReady: 'Image saved — post it to your Instagram Story ✨',
      like: 'Like',
      coupleReply: 'Reply from the couple',
      giftConfirmTitle: 'Gift Confirmation',
      donationConfirm: 'Donation Confirmation',
      giftConfirmText: 'Already sent something? Let us know so we can thank you personally.',
      giftConfirmBtn: 'Confirm',
      giftMethod: 'Sent via',
      giftAmount: 'Amount (optional)',
      giftMessage: 'Message (optional)',
      giftOther: 'Other',
      giftPhysical: 'Physical gift',
      giftSubmit: 'Send confirmation',
      giftSent: 'Thank you! We have received your confirmation. 🙏',
      donationTitle: 'Donation',
      donationIntro: 'In lieu of gifts, we invite you to share kindness through this donation:',
      donateNow: 'Donate now',
      waRsvp: 'Hello, this is *{name}* confirming my RSVP for the wedding of {couple}:\n\nAttendance: *{att}*\nGuests: {n}\n\nWishes: {msg}'
    }
  };

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    map: '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3z"/>',
    whatsapp: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/><path d="M8.5 9.5c.5 2.5 3 5 5.5 5.5l1.2-1.2 1.8.8-.4 1.6c-3.8.4-8.2-4-7.8-7.8l1.6-.4.8 1.8z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    shirt: '<path d="M20.4 6.6 16 3a4 4 0 0 1-8 0L3.6 6.6a1 1 0 0 0-.2 1.3l2 3a1 1 0 0 0 1.3.3L8 10.5V21h8V10.5l1.3.7a1 1 0 0 0 1.3-.3l2-3a1 1 0 0 0-.2-1.3z"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V3c.6 2.5 2.5 4.5 5.5 4.8"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/>'
  };
  const icon = (name) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function safeUrl(value) {
    const text = String(value || '').trim();
    if (/^\/uploads\/\d+\/[A-Za-z0-9_-]+\.(jpg|png|webp|gif|mp3|mp4|webm|mov)$/.test(text)) {
      return text;
    }
    if (/^https?:\/\/[^\s"'<>]+$/i.test(text)) {
      return text;
    }
    return '';
  }

  const safeColor = (value) => (/^#[0-9a-f]{3,8}$/i.test(String(value || '')) ? value : '#cccccc');

  function loadJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  }

  /* ------------------------------------------------------------------ */
  /* State                                                              */
  /* ------------------------------------------------------------------ */
  function pickLang() {
    const lang = params.get('lang') || loadJSON('inv_lang') || C.defaultLang || 'id';
    return STRINGS[lang] ? lang : 'id';
  }

  const state = {
    lang: pickLang(),
    wishes: [],
    wishesTotal: 0,
    opened: false,
    musicOn: false,
    lightboxIndex: 0,
    galleryItems: [],
    rsvp: null
  };

  const codeKey = `inv_code_${SLUG}`;
  const guest = {
    name: DATA.guest?.name || (params.get('to') || '').trim().slice(0, 80),
    code: DATA.guest?.code || loadJSON(codeKey) || '',
    pax: DATA.guest?.pax || clamp(parseInt(C.rsvp?.defaultPax, 10) || 2, 1, 20)
  };
  if (DATA.guest?.rsvp) {
    state.rsvp = { ...DATA.guest.rsvp, name: DATA.guest.name, code: DATA.guest.code };
  }

  function t(key, vars) {
    let text = STRINGS[state.lang][key] ?? STRINGS.id[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.split('{' + k + '}').join(v);
      }
    }
    return text;
  }

  function L(value) {
    if (value == null) {
      return '';
    }
    if (typeof value === 'object') {
      return value[state.lang] || value.id || value.en || '';
    }
    return String(value);
  }

  const locale = () => (state.lang === 'id' ? 'id-ID' : 'en-GB');
  const validDate = (iso) => Boolean(iso) && !Number.isNaN(new Date(iso).getTime());

  function fmt(iso, options) {
    if (!validDate(iso)) {
      return '';
    }
    return new Intl.DateTimeFormat(locale(), { timeZone: C.timeZone || 'Asia/Jakarta', ...options }).format(new Date(iso));
  }

  const fmtLongDate = (iso) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = (iso) => fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false });
  const couple = () => C.couple || { groom: {}, bride: {} };
  const orderedCouple = () => {
    const pair = [couple().groom || {}, couple().bride || {}];
    return C.brideFirst ? pair.reverse() : pair;
  };
  const nick = (person) => person.nickname || '…';
  const initial = (person) => (person.nickname || '?').charAt(0).toUpperCase();
  const coupleNames = () => orderedCouple().map(nick).join(' & ');

  function attendanceLabel(value) {
    return { yes: t('attend'), no: t('notAttend'), maybe: t('maybe') }[value] || '';
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                          */
  /* ------------------------------------------------------------------ */
  function renderAll() {
    document.body.dataset.theme = params.get('theme') || C.theme || 'sage';
    const hero = safeUrl(C.heroPhoto);
    document.documentElement.style.setProperty('--hero-img', hero ? `url("${hero}")` : '');
    if (!hero) {
      document.documentElement.style.removeProperty('--hero-img');
    }
    document.documentElement.lang = state.lang;
    applyStaticText();
    renderBindings();
    renderSymbol();
    renderHeroMedia();
    renderQuote();
    renderCouple();
    renderEvents();
    renderLivestream();
    renderDressCode();
    renderStory();
    renderGallery();
    renderRsvpSection();
    renderGifts();
    renderClosing();
    renderNav();
    renderWishes();
    updateCountdown();
    $('#langBtn').textContent = state.lang === 'id' ? 'EN' : 'ID';
    $('#musicBtn').hidden = !hasMusic();
    $('#musicBtn').title = musicUrl() ? '' : (SONGS[songId()]?.title || '');
    observeReveals();
  }

  function applyStaticText() {
    $$('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    $$('[data-i18n-ph]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    $$('[data-i18n-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nLabel));
    });
    $$('[data-icon]').forEach((el) => {
      el.innerHTML = icon(el.dataset.icon);
    });
    $('#guestName').textContent = guest.name || t('defaultGuest');
    const powered = $('#poweredBy');
    if (powered) {
      powered.textContent = t('poweredBy', { app: DATA.appName || 'UndanganKita' });
      powered.href = DATA.homeUrl || '/';
    }
  }

  function renderBindings() {
    const [first, second] = orderedCouple();
    const date = C.weddingDate;
    const values = {
      couple: `${nick(first)} & ${nick(second)}`,
      initials: `${initial(first)}${initial(second)}`,
      initialsAmp: `${initial(first)} & ${initial(second)}`,
      dateLong: fmtLongDate(date),
      dateNumeric: validDate(date)
        ? `${fmt(date, { day: '2-digit' })} · ${fmt(date, { month: '2-digit' })} · ${fmt(date, { year: 'numeric' })}`
        : '',
      hashtag: C.hashtag || ''
    };
    $$('[data-bind]').forEach((el) => {
      el.textContent = values[el.dataset.bind] ?? '';
    });
  }

  const SYMBOLS = {
    islam: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    kristen: 'cross',
    katolik: 'cross',
    hindu: 'ॐ',
    buddha: '☸',
    konghucu: '囍'
  };
  const CROSS_SVG = '<svg viewBox="0 0 24 34" width="20" height="28" fill="currentColor" aria-hidden="true"><rect x="10" y="0" width="4" height="34" rx="1"/><rect x="3" y="8" width="18" height="4" rx="1"/></svg>';

  function renderSymbol() {
    const symbol = SYMBOLS[C.religion] || '';
    const show = Boolean(symbol) && C.showSymbol !== false;
    $$('[data-symbol]').forEach((el) => {
      el.hidden = !show;
      el.classList.toggle('arabic', C.religion === 'islam');
      el.innerHTML = !show ? '' : symbol === 'cross' ? CROSS_SVG : `<span>${esc(symbol)}</span>`;
    });
  }

  let slideTimer = null;
  function renderHeroMedia() {
    const home = $('#home');
    home.querySelector('.hero-media')?.remove();
    home.classList.remove('has-media');
    clearInterval(slideTimer);
    const mode = C.heroMode || 'photo';
    const heroVideo = safeUrl(C.heroVideo);
    const poster = safeUrl(C.heroPhoto);
    let media = null;
    if (mode === 'video' && heroVideo) {
      media = document.createElement('div');
      media.className = 'hero-media';
      media.innerHTML = `<video autoplay muted loop playsinline preload="auto" ${poster ? `poster="${esc(poster)}"` : ''} src="${esc(heroVideo)}"></video>`;
    } else if (mode === 'slideshow') {
      const photos = Array.from(new Set([poster, ...galleryItems().map((item) => item.src)].filter(Boolean))).slice(0, 6);
      if (photos.length >= 2) {
        media = document.createElement('div');
        media.className = 'hero-media slides';
        media.innerHTML = photos.map((src, i) => `<img src="${esc(src)}" alt="" class="${i === 0 ? 'active' : ''}">`).join('');
        if (!reduceMotion) {
          let index = 0;
          slideTimer = setInterval(() => {
            const slides = media.querySelectorAll('img');
            slides[index].classList.remove('active');
            index = (index + 1) % slides.length;
            slides[index].classList.add('active');
          }, 5000);
        }
      }
    }
    if (media) {
      home.prepend(media);
      home.classList.add('has-media');
      media.querySelector('video')?.play().catch(() => {});
    }
  }

  function renderQuote() {
    const text = L(C.quote?.text);
    $('#quote').hidden = !text;
    $('#quoteText').textContent = text ? `“${text}”` : '';
    $('#quoteSource').textContent = C.quote?.source || '';
  }

  function personCard(person) {
    const photoUrl = safeUrl(person.photo);
    const photo = photoUrl
      ? `<img src="${esc(photoUrl)}" alt="${esc(person.fullName)}" loading="lazy">`
      : `<span class="monogram">${esc(initial(person))}</span>`;
    const handle = String(person.instagram || '').replace(/[^A-Za-z0-9._]/g, '');
    const tiktokHandle = String(person.tiktok || '').replace(/[^A-Za-z0-9._]/g, '');
    const socials = [
      handle ? `<a class="ig" href="https://instagram.com/${encodeURIComponent(handle)}" target="_blank" rel="noopener">${icon('instagram')} @${esc(handle)}</a>` : '',
      tiktokHandle ? `<a class="ig" href="https://www.tiktok.com/@${encodeURIComponent(tiktokHandle)}" target="_blank" rel="noopener">${icon('tiktok')} @${esc(tiktokHandle)}</a>` : ''
    ].join('');
    const instagram = socials ? `<div class="socials">${socials}</div>` : '';
    return `
      <article class="person reveal">
        <div class="portrait">${photo}</div>
        <h3 class="person-nick">${esc(nick(person))}</h3>
        <p class="person-name">${esc(person.fullName)}</p>
        <p class="person-parents">${esc(L(person.parents))}</p>
        ${instagram}
      </article>`;
  }

  function renderCouple() {
    $('#openingText').textContent = L(C.opening);
    const [first, second] = orderedCouple();
    $('#coupleList').innerHTML = personCard(first) + '<div class="amp reveal">&amp;</div>' + personCard(second);
  }

  const events = () => (Array.isArray(C.events) ? C.events : []);
  const mapsQuery = (ev) => ev.mapsQuery || `${ev.venue || ''} ${ev.address || ''}`.trim();

  function directionsUrl(ev) {
    return safeUrl(ev.mapsUrl) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(ev))}`;
  }

  function renderEvents() {
    const list = events();
    $('#events').hidden = !list.length && !C.livestream?.enabled && !C.dressCode?.enabled;
    const tz = C.timeZoneLabel ? ` ${esc(C.timeZoneLabel)}` : '';
    $('#eventList').innerHTML = list.map((ev, i) => {
      const end = validDate(ev.end) ? esc(fmtTime(ev.end)) : esc(t('until'));
      const time = validDate(ev.start) ? `${esc(fmtTime(ev.start))} – ${end}${tz}` : '';
      return `
        <article class="event reveal">
          <h3>${esc(L(ev.title))}</h3>
          <div class="event-date">
            <span class="side">${esc(fmt(ev.start, { weekday: 'long' }))}</span>
            <span class="day">${esc(fmt(ev.start, { day: '2-digit' }))}</span>
            <span class="side">${esc(fmt(ev.start, { month: 'long' }))}<br>${esc(fmt(ev.start, { year: 'numeric' }))}</span>
          </div>
          <div class="meta">
            ${time ? `<span class="time">${icon('clock')} ${time}</span>` : ''}
            <strong>${esc(ev.venue)}</strong>
            <span>${esc(ev.address)}</span>
          </div>
          <div class="actions">
            <a class="btn btn-primary btn-sm" href="${esc(directionsUrl(ev))}" target="_blank" rel="noopener">${icon('pin')} ${esc(t('directions'))}</a>
            <button type="button" class="btn btn-ghost btn-sm" data-action="map" data-idx="${i}">${icon('map')} <span>${esc(t('showMap'))}</span></button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="gcal" data-idx="${i}">${icon('calendar')} Google</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="ics" data-idx="${i}">${icon('download')} ${esc(t('icsFile'))}</button>
          </div>
          <div class="map" id="map-${i}" hidden></div>
        </article>`;
    }).join('');
  }

  function embedUrl(url) {
    const youtube = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url || '');
    if (youtube) {
      return `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0&playsinline=1`;
    }
    const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url || '');
    return vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : '';
  }

  const iframePlayer = (src) => `<div class="video-frame"><iframe src="${esc(src)}" title="Video" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;

  function liveWindow() {
    const list = events().filter((ev) => validDate(ev.start));
    if (!list.length) {
      return null;
    }
    const starts = list.map((ev) => new Date(ev.start).getTime());
    const ends = list.map((ev) => (validDate(ev.end) ? new Date(ev.end).getTime() : new Date(ev.start).getTime() + 3 * 3600e3));
    return [Math.min(...starts) - 30 * 60e3, Math.max(...ends) + 30 * 60e3];
  }

  function isLive() {
    const range = liveWindow();
    const now = Date.now();
    return Boolean(C.livestream?.enabled && safeUrl(C.livestream?.url) && range && now >= range[0] && now <= range[1]);
  }

  function renderLivestream() {
    const ls = C.livestream;
    const url = safeUrl(ls?.url);
    state.liveRendered = isLive();
    if (!ls || !ls.enabled || !url) {
      $('#livestream').innerHTML = '';
      return;
    }
    const embed = embedUrl(url);
    const live = state.liveRendered;
    $('#livestream').innerHTML = `
      <div class="card info-card reveal" id="liveCard">
        <h3>${icon('video')} ${esc(t('livestreamTitle'))} ${live ? '<span class="live-badge">LIVE</span>' : ''}</h3>
        <p>${live ? esc(t('liveNow')) : `${esc(t('livestreamText'))} <strong>${esc(ls.platform || '')}</strong>.`}</p>
        <div id="livePlayer">${embed && live ? iframePlayer(embed) : ''}</div>
        <div class="actions">
          ${embed && !live ? `<button type="button" class="btn btn-ghost btn-sm" data-action="embed-live">▶ ${esc(t('watchHere'))}</button>` : ''}
          <a class="btn btn-primary btn-sm" href="${esc(url)}" target="_blank" rel="noopener">${icon('video')} ${esc(t('watch'))}</a>
        </div>
      </div>`;
  }

  function updateLiveState() {
    const live = isLive();
    $('#livePill').hidden = !live;
    if (live !== state.liveRendered) {
      renderLivestream();
      revealVisibleNow();
    }
  }

  function renderDressCode() {
    const dc = C.dressCode;
    if (!dc || !dc.enabled) {
      $('#dresscode').innerHTML = '';
      return;
    }
    const swatches = (dc.colors || []).map((c) => `<span class="swatch" style="background:${safeColor(c)}"></span>`).join('');
    $('#dresscode').innerHTML = `
      <div class="card info-card reveal">
        <h3>${icon('shirt')} ${esc(t('dresscodeTitle'))}</h3>
        <div class="swatches">${swatches}</div>
        <p>${esc(L(dc.note))}</p>
      </div>`;
  }

  function renderStory() {
    const story = Array.isArray(C.story) ? C.story : [];
    $('#story').hidden = !story.length;
    $('#storyList').innerHTML = story.map((item) => `
      <li class="reveal">
        <span class="tl-year">${esc(item.year)}</span>
        <h3>${esc(L(item.title))}</h3>
        <p>${esc(L(item.text))}</p>
      </li>`).join('');
  }

  function cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function placeholderImage(index) {
    const primary = cssVar('--primary') || '#6b7b5b';
    const accent = cssVar('--accent') || '#b8955a';
    const light = cssVar('--surface-2') || '#e9e4d6';
    const heights = [800, 560, 680, 560, 800, 680];
    const w = 600;
    const h = heights[index % heights.length];
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${primary}" stop-opacity=".45"/>
        </linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <rect x="18" y="18" width="${w - 36}" height="${h - 36}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
        <g transform="translate(${w / 2} ${h / 2 - 20}) rotate(${index * 23 - 30})" fill="${primary}" fill-opacity=".28" stroke="${primary}" stroke-opacity=".6" stroke-width="2">
          <path d="M0 110 C 6 40 6 -40 0 -110" fill="none"/>
          <path d="M0 60 C 30 50 54 20 60 -10 C 30 -6 8 22 0 60Z"/>
          <path d="M0 20 C -30 10 -54 -20 -58 -48 C -28 -44 -6 -16 0 20Z"/>
          <path d="M0 -30 C 24 -40 42 -64 44 -90 C 20 -84 4 -60 0 -30Z"/>
          <circle cx="0" cy="-114" r="8" fill="${accent}" fill-opacity=".8" stroke="none"/>
        </g>
      </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  const isVideoUrl = (url) => /\.(mp4|webm|mov)$/i.test(url || '');

  function galleryItems() {
    return (Array.isArray(C.gallery) ? C.gallery : []).map((item) => {
      if (item && typeof item === 'object') {
        return { src: safeUrl(item.src), video: safeUrl(item.video) };
      }
      const url = safeUrl(item);
      return isVideoUrl(url) ? { src: '', video: url } : { src: url, video: '' };
    }).filter((item) => item.src || item.video);
  }

  function renderVideo() {
    const video = C.video || {};
    const url = safeUrl(video.url);
    const box = $('#videoBox');
    if (!video.enabled || !url) {
      box.innerHTML = '';
      return false;
    }
    const embed = embedUrl(url);
    const player = embed
      ? iframePlayer(embed)
      : `<div class="video-frame"><video controls playsinline preload="metadata" src="${esc(url)}"></video></div>`;
    box.innerHTML = `<h3 class="sub-title reveal">${esc(L(video.title) || t('videoTitle'))}</h3><div class="reveal">${player}</div>`;
    return true;
  }

  function renderGallery() {
    let items = galleryItems();
    if (!items.length && DATA.preview) {
      items = Array.from({ length: 4 }, (_, i) => ({ src: placeholderImage(i), video: '' }));
    }
    const hasVideo = renderVideo();
    $('#gallery').hidden = !items.length && !hasVideo;
    state.galleryItems = items;
    $('#galleryGrid').innerHTML = items.map((item, i) => {
      const media = item.src
        ? `<img src="${esc(item.src)}" alt="${esc(t('photo'))} ${i + 1}" loading="lazy">`
        : `<video src="${esc(item.video)}#t=0.1" preload="metadata" muted playsinline></video>`;
      const badge = item.src && item.video
        ? '<span class="media-badge">LIVE</span>'
        : (!item.src ? '<span class="media-badge play">▶</span>' : '');
      return `<button type="button" class="reveal" data-action="lightbox" data-idx="${i}" aria-label="${esc(t('photo'))} ${i + 1}">${media}${badge}</button>`;
    }).join('');
  }

  function rsvpEnabled() {
    return C.rsvp?.enabled !== false;
  }

  function renderRsvpSection() {
    const deadline = C.rsvp?.deadline;
    let intro = validDate(deadline)
      ? t('rsvpIntro', { date: fmt(deadline + 'T12:00:00', { day: 'numeric', month: 'long', year: 'numeric' }) })
      : t('rsvpIntroNoDate');
    if (DATA.guest) {
      intro += t('rsvpPax', { pax: guest.pax });
    }
    $('#rsvpIntro').textContent = rsvpEnabled() ? intro : t('rsvpClosed');
    const select = $('#rsvpGuests');
    const current = select.value || '1';
    select.innerHTML = Array.from({ length: guest.pax }, (_, i) => `<option value="${i + 1}">${i + 1} ${esc(t('person'))}</option>`).join('');
    select.value = Number(current) <= guest.pax ? current : '1';
    $('[data-action="wa-rsvp"]').hidden = !String(C.rsvp?.whatsapp || '').replace(/\D/g, '');
    $('#songField').hidden = !C.rsvp?.songRequests;
    if (!rsvpEnabled()) {
      $('#rsvpForm').hidden = true;
      $('#rsvpDone').hidden = !state.rsvp;
    }
    if (state.rsvp && !$('#rsvpDone').hidden) {
      showRsvpDone(state.rsvp);
    }
  }

  function formatAccount(number) {
    const digits = String(number || '').replace(/\s+/g, '');
    return /^\d+$/.test(digits) ? digits.replace(/(.{4})/g, '$1 ').trim() : String(number || '');
  }

  function renderGifts() {
    const gifts = C.gifts || {};
    const accounts = Array.isArray(gifts.accounts) ? gifts.accounts.filter((a) => a && a.number) : [];
    const qrisUrl = safeUrl(gifts.qrisImage);
    const addr = gifts.address && gifts.address.text ? gifts.address : null;
    const charity = gifts.mode === 'charity';
    const charityUrl = safeUrl(gifts.charity?.url);
    const charityCard = charity && gifts.charity?.name ? `
      <div class="card gift-extra reveal">
        <span class="gift-icon">${icon('heart')}</span>
        <h3>${esc(gifts.charity.name)}</h3>
        <p>${esc(L(gifts.charity.description))}</p>
        ${charityUrl ? `<a class="btn btn-primary btn-sm" href="${esc(charityUrl)}" target="_blank" rel="noopener">${esc(t('donateNow'))}</a>` : ''}
      </div>` : '';
    const hasContent = accounts.length || qrisUrl || addr || charityCard;
    $('#gift').hidden = gifts.enabled === false || !hasContent;
    $('#gift .section-title').textContent = charity ? t('donationTitle') : t('giftTitle');
    $('#gift .lead').textContent = charity ? t('donationIntro') : t('giftIntro');
    const methodOptions = [
      ...accounts.map((acc) => acc.provider).filter(Boolean),
      ...(qrisUrl ? ['QRIS'] : []),
      ...(addr ? [t('giftPhysical')] : []),
      t('giftOther')
    ];
    const confirmCard = gifts.confirmations === false ? '' : `
      <div class="card gift-extra gift-confirm reveal">
        <h3>${esc(charity ? t('donationConfirm') : t('giftConfirmTitle'))}</h3>
        <p>${esc(t('giftConfirmText'))}</p>
        <button type="button" class="btn btn-ghost btn-sm" data-action="gift-toggle" id="giftToggle">${esc(t('giftConfirmBtn'))}</button>
        <form id="giftForm" class="form gift-form" hidden novalidate>
          <label class="field"><span>${esc(t('name'))}</span><input name="name" maxlength="80" value="${esc(guest.name)}" required></label>
          <label class="field"><span>${esc(t('giftMethod'))}</span><select name="method">${methodOptions.map((m) => `<option>${esc(m)}</option>`).join('')}</select></label>
          <label class="field"><span>${esc(t('giftAmount'))}</span><input name="amount" inputmode="numeric" placeholder="Rp"></label>
          <label class="field"><span>${esc(t('giftMessage'))}</span><textarea name="message" rows="2" maxlength="300"></textarea></label>
          <p class="form-error" id="giftError" hidden></p>
          <button class="btn btn-primary btn-block" type="submit">${esc(t('giftSubmit'))}</button>
        </form>
        <p class="gift-done" id="giftDone" hidden>${esc(t('giftSent'))}</p>
      </div>`;
    const prefix = t('holderPrefix');
    const cards = accounts.map((acc) => `
      <div class="bank-card reveal">
        <div class="bank-top"><span class="chip"></span><span class="provider">${esc(acc.provider)}</span></div>
        <div class="bank-number">${esc(formatAccount(acc.number))}</div>
        <div class="bank-bottom">
          <span class="holder">${prefix ? esc(prefix) + ' ' : ''}${esc(acc.holder)}</span>
          <button type="button" class="btn btn-sm" data-action="copy" data-copy="${esc(String(acc.number).replace(/\s+/g, ''))}">${icon('copy')} ${esc(t('copy'))}</button>
        </div>
      </div>`).join('');
    const qris = qrisUrl ? `
      <div class="card gift-extra qris reveal">
        <span class="gift-icon">${icon('qr')}</span>
        <h3>${esc(t('qrisTitle'))}</h3>
        <p>${esc(t('qrisText'))}</p>
        <img src="${esc(qrisUrl)}" alt="QRIS" loading="lazy">
      </div>` : '';
    const address = addr ? `
      <div class="card gift-extra reveal">
        <span class="gift-icon">${icon('gift')}</span>
        <h3>${esc(t('sendGiftTo'))}</h3>
        <p><strong>${esc(addr.recipient)}</strong>${addr.phone ? ' · ' + esc(addr.phone) : ''}<br>${esc(addr.text)}</p>
        <button type="button" class="btn btn-ghost btn-sm" data-action="copy" data-copy="${esc(`${addr.recipient || ''}${addr.phone ? ' (' + addr.phone + ')' : ''}\n${addr.text}`)}">${icon('copy')} ${esc(t('copyAddress'))}</button>
      </div>` : '';
    $('#giftList').innerHTML = charityCard + cards + qris + address + confirmCard;
  }

  function renderClosing() {
    $('#closingText').textContent = L(C.closing);
    const tag = String(C.hashtag || '').replace(/^#/, '').replace(/[^\p{L}\p{N}_]/gu, '');
    const el = $('.closing .hashtag');
    if (el && tag) {
      el.innerHTML = `<a href="https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/" target="_blank" rel="noopener">#${esc(tag)}</a>`;
    }
  }

  function renderNav() {
    const items = [
      ['home', 'home', 'navHome'],
      ['couple', 'heart', 'navCouple'],
      ['events', 'calendar', 'navEvents'],
      ['gallery', 'image', 'navGallery'],
      ['rsvp', 'mail', 'navRsvp'],
      ['gift', 'gift', 'navGift']
    ].filter(([id]) => {
      const section = document.getElementById(id);
      return section && !section.hidden;
    });
    const active = $('#bottomNav a.active')?.getAttribute('href') || '#home';
    $('#bottomNav').innerHTML = items.map(([id, ic, label]) =>
      `<a href="#${id}" class="${'#' + id === active ? 'active' : ''}">${icon(ic)}<span>${esc(t(label))}</span></a>`
    ).join('');
  }

  /* ------------------------------------------------------------------ */
  /* Wishes / RSVP                                                      */
  /* ------------------------------------------------------------------ */
  function timeAgo(iso) {
    const seconds = (new Date(iso) - Date.now()) / 1000;
    if (!Number.isFinite(seconds)) {
      return '';
    }
    const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) {
        return rtf.format(Math.round(seconds / size), unit);
      }
    }
    return t('justNow');
  }

  function renderWishes() {
    const list = state.wishes;
    const container = $('#wishesList');
    $('#wishesCount').textContent = state.wishesTotal ? `· ${t('wishesCount', { n: state.wishesTotal })}` : '';
    if (!list.length) {
      container.innerHTML = `<li class="empty">${esc(t('noWishes'))}</li>`;
      $('#wishesMore').hidden = true;
      return;
    }
    container.innerHTML = list.map((w) => `
      <li class="wish">
        <span class="avatar">${esc(String(w.name || '?').trim().charAt(0).toUpperCase())}</span>
        <div>
          <div class="wish-head">
            <span class="wish-name">${esc(w.name)}</span>
            ${w.attendance ? `<span class="badge ${esc(w.attendance)}">${esc(attendanceLabel(w.attendance))}</span>` : ''}
          </div>
          <p>${esc(w.message)}</p>
          <div class="wish-foot">
            <time datetime="${esc(w.time)}">${esc(timeAgo(w.time))}</time>
            <button type="button" class="like ${likedWishes.has(String(w.id)) ? 'on' : ''}" data-action="like" data-id="${esc(w.id)}" aria-label="${esc(t('like'))}">♥ <span>${Number(w.likes) || 0}</span></button>
          </div>
          ${w.reply ? `<div class="wish-reply"><b>${esc(t('coupleReply'))}</b><p>${esc(w.reply)}</p></div>` : ''}
        </div>
      </li>`).join('');
    $('#wishesMore').hidden = list.length >= state.wishesTotal;
  }

  const likedWishes = new Set(loadJSON(`liked_${SLUG}`, []).map(String));

  function voterId() {
    let voter = loadJSON('inv_voter');
    if (!voter) {
      voter = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
      saveJSON('inv_voter', voter);
    }
    return voter;
  }

  async function likeWish(id) {
    if (likedWishes.has(id)) {
      return;
    }
    likedWishes.add(id);
    saveJSON(`liked_${SLUG}`, Array.from(likedWishes));
    const wish = state.wishes.find((w) => String(w.id) === id);
    if (!wish) {
      return;
    }
    wish.likes = (Number(wish.likes) || 0) + 1;
    renderWishes();
    if (STATIC_DEMO) {
      return;
    }
    try {
      const result = await api(`/api/public/${SLUG}/wishes/${encodeURIComponent(id)}/like`, {
        method: 'POST',
        body: JSON.stringify({ voter: voterId() })
      });
      wish.likes = result.likes;
      renderWishes();
    } catch {
      /* keep optimistic count */
    }
  }

  async function submitGift(form) {
    const data = Object.fromEntries(new FormData(form));
    const body = {
      name: String(data.name || '').trim(),
      method: data.method,
      amount: parseInt(String(data.amount || '').replace(/\D/g, ''), 10) || 0,
      message: String(data.message || '').trim(),
      guestCode: guest.code || undefined
    };
    const errorBox = $('#giftError');
    if (!body.name) {
      errorBox.textContent = t('required');
      errorBox.hidden = false;
      return;
    }
    try {
      if (!STATIC_DEMO) {
        await api(`/api/public/${SLUG}/gift`, { method: 'POST', body: JSON.stringify(body) });
      }
      form.hidden = true;
      $('#giftToggle').hidden = true;
      $('#giftDone').hidden = false;
    } catch (err) {
      errorBox.textContent = err.message || t('sendFailed');
      errorBox.hidden = false;
    }
  }

  async function loadWishes({ append = false } = {}) {
    if (STATIC_DEMO) {
      state.wishes = loadJSON(`demo_wishes_${SLUG}`, []).concat(DATA.sampleWishes || []);
      state.wishesTotal = state.wishes.length;
      renderWishes();
      return;
    }
    try {
      const offset = append ? state.wishes.length : 0;
      const data = await api(`/api/public/${SLUG}/wishes?offset=${offset}&limit=10`);
      state.wishesTotal = data.total;
      state.wishes = append ? state.wishes.concat(data.wishes) : data.wishes;
      renderWishes();
    } catch (err) {
      console.warn('wishes', err);
    }
  }

  function readForm() {
    const form = $('#rsvpForm');
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const attendance = data.get('attendance');
    const errorBox = $('#rsvpError');
    if (!name || !attendance) {
      errorBox.textContent = t('required');
      errorBox.hidden = false;
      return null;
    }
    errorBox.hidden = true;
    return {
      name,
      attendance,
      guests: attendance === 'no' ? 0 : clamp(parseInt(data.get('guests'), 10) || 1, 1, guest.pax),
      message: String(data.get('message') || '').trim().slice(0, 500),
      song: String(data.get('song') || '').trim().slice(0, 120)
    };
  }

  async function submitRsvp(event) {
    event.preventDefault();
    const data = readForm();
    if (!data) {
      return;
    }
    const button = $('#rsvpSubmit');
    button.disabled = true;
    button.textContent = t('sending');
    try {
      const result = STATIC_DEMO
        ? simulateRsvp(data)
        : await api(`/api/public/${SLUG}/rsvp`, {
          method: 'POST',
          body: JSON.stringify({ ...data, guestCode: guest.code || undefined })
        });
      guest.code = result.code;
      if (!DATA.guest) {
        saveJSON(codeKey, result.code);
      }
      state.rsvp = { ...data, guests: result.guests, code: result.code };
      showRsvpDone(state.rsvp);
      loadWishes();
    } catch (err) {
      const box = $('#rsvpError');
      box.textContent = err.message || t('sendFailed');
      box.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = t('send');
    }
  }

  function simulateRsvp(data) {
    const code = guest.code || Math.random().toString(36).slice(2, 8).toUpperCase();
    if (data.message) {
      const wishes = loadJSON(`demo_wishes_${SLUG}`, []).filter((w) => w.id !== code);
      wishes.unshift({ id: code, name: data.name, attendance: data.attendance, message: data.message, time: new Date().toISOString() });
      saveJSON(`demo_wishes_${SLUG}`, wishes);
    }
    return { code, guests: data.guests };
  }

  function renderQr(container, text) {
    if (!window.qrcode) {
      container.innerHTML = '';
      return;
    }
    if (window.qrcode.stringToBytesFuncs && window.qrcode.stringToBytesFuncs['UTF-8']) {
      window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
    }
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    container.innerHTML = `<img alt="QR" src="${qr.createDataURL(6, 2)}">`;
  }

  function showRsvpDone(entry) {
    $('#rsvpForm').hidden = true;
    $('#rsvpDone').hidden = false;
    const key = { yes: 'thanksYes', maybe: 'thanksMaybe', no: 'thanksNo' }[entry.attendance] || 'thanksYes';
    $('#doneTitle').textContent = t(key, { name: entry.name });
    const pass = $('#pass');
    if (entry.attendance === 'yes' && entry.code) {
      pass.hidden = false;
      $('#passCode').textContent = entry.code;
      $('#passName').textContent = `${entry.name} · ${entry.guests} ${t('person')}`;
      renderQr($('#passQr'), `${entry.code}|${entry.name}|${entry.guests}`);
    } else {
      pass.hidden = true;
    }
    $('[data-action="rsvp-edit"]').hidden = !rsvpEnabled();
  }

  function showRsvpForm() {
    const saved = state.rsvp;
    const form = $('#rsvpForm');
    if (saved) {
      form.elements.name.value = saved.name || '';
      const radio = form.querySelector(`input[name="attendance"][value="${saved.attendance}"]`);
      if (radio) {
        radio.checked = true;
      }
      form.elements.guests.value = String(Math.max(1, saved.guests || 1));
      form.elements.message.value = saved.message || '';
      form.elements.song.value = saved.song || '';
      $('#guestsField').hidden = saved.attendance === 'no';
    }
    $('#rsvpDone').hidden = true;
    form.hidden = false;
  }

  function whatsappRsvp() {
    const data = new FormData($('#rsvpForm'));
    const attendance = data.get('attendance') || 'yes';
    const message = t('waRsvp', {
      name: String(data.get('name') || guest.name || '-').trim(),
      couple: coupleNames(),
      att: attendanceLabel(attendance),
      n: attendance === 'no' ? 0 : (data.get('guests') || 1),
      msg: String(data.get('message') || '-').trim()
    });
    const number = String(C.rsvp?.whatsapp || '').replace(/\D/g, '');
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  async function initRsvp() {
    const form = $('#rsvpForm');
    form.elements.name.value = guest.name;
    form.addEventListener('change', (e) => {
      if (e.target.name === 'attendance') {
        $('#guestsField').hidden = e.target.value === 'no';
      }
    });
    form.addEventListener('submit', submitRsvp);
    if (state.rsvp) {
      showRsvpDone(state.rsvp);
      return;
    }
    // Anonymous guest who already responded on this device: fetch their response.
    if (!DATA.guest && guest.code && !STATIC_DEMO) {
      try {
        const data = await api(`/api/public/${SLUG}?g=${encodeURIComponent(guest.code)}`);
        if (data.guest) {
          guest.pax = data.guest.pax;
          if (data.guest.rsvp) {
            state.rsvp = { ...data.guest.rsvp, name: data.guest.name, code: data.guest.code };
            showRsvpDone(state.rsvp);
          }
        } else {
          guest.code = '';
        }
      } catch {
        /* ignore */
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Calendar                                                           */
  /* ------------------------------------------------------------------ */
  const toCalDate = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const shareUrl = () => (STATIC_DEMO ? `${location.origin}${location.pathname}` : `${location.origin}/i/${SLUG}`);

  function eventEnd(ev) {
    return validDate(ev.end) ? ev.end : new Date(new Date(ev.start).getTime() + 2 * 3600 * 1000).toISOString();
  }

  function googleCalUrl(ev) {
    const query = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${L(ev.title)} — ${coupleNames()}`,
      dates: `${toCalDate(ev.start)}/${toCalDate(eventEnd(ev))}`,
      details: `${t('coverEyebrow')} ${coupleNames()}\n${shareUrl()}`,
      location: `${ev.venue || ''}, ${ev.address || ''}`
    });
    return `https://calendar.google.com/calendar/render?${query.toString()}`;
  }

  function downloadIcs(ev) {
    const icsText = (s) => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UndanganKita//ID', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}@undangan`,
      `DTSTAMP:${toCalDate(new Date().toISOString())}`,
      `DTSTART:${toCalDate(ev.start)}`,
      `DTEND:${toCalDate(eventEnd(ev))}`,
      `SUMMARY:${icsText(`${L(ev.title)} — ${coupleNames()}`)}`,
      `LOCATION:${icsText(`${ev.venue || ''}, ${ev.address || ''}`)}`,
      `DESCRIPTION:${icsText(`${t('coverEyebrow')} ${coupleNames()} ${shareUrl()}`)}`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${String(L(ev.title) || 'acara').replace(/\s+/g, '-')}-${SLUG}.ics`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 500);
  }

  function toggleMap(index, button) {
    const box = document.getElementById(`map-${index}`);
    const label = button.querySelector('span');
    if (box.hidden) {
      if (!box.innerHTML) {
        const query = encodeURIComponent(mapsQuery(events()[index]));
        box.innerHTML = `<iframe src="https://maps.google.com/maps?q=${query}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe>`;
      }
      box.hidden = false;
      label.textContent = t('hideMap');
    } else {
      box.hidden = true;
      label.textContent = t('showMap');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Music: uploaded audio, or built-in WebAudio music box (Canon in D) */
  /* ------------------------------------------------------------------ */
  // Built-in song library: public-domain melodies and an original gamelan-style pattern.
  const ELISE = (() => {
    const m1 = [[76], [75], [76], [71], [74], [72]];
    const m2 = [[69, 45], [52], [57], [60], [64], [69]];
    const m3 = [[71, 40], [52], [56], [64], [68], [71]];
    const m4 = [[72, 45], [52], [57], [64], [76], [75]];
    const m7 = [[71, 40], [52], [56], [64], [72], [71]];
    const m8 = [[69, 45], [52], [57], [], [], []];
    return [[76], [75], ...m1, ...m2, ...m3, ...m4, ...m1, ...m2, ...m7, ...m8];
  })();
  const JOY = (() => {
    const phrase = (ending) => [[76, 2], [76, 2], [77, 2], [79, 2], [79, 2], [77, 2], [76, 2], [74, 2],
      [72, 2], [72, 2], [74, 2], [76, 2], ...ending];
    const melody = [...phrase([[76, 3], [74, 1], [74, 4]]), ...phrase([[74, 3], [72, 1], [72, 4]])];
    const steps = [];
    melody.forEach(([note, length]) => {
      steps.push([note]);
      for (let i = 1; i < length; i += 1) {
        steps.push([]);
      }
    });
    const bass = [48, 43, 48, 43, 48, 43, 48, 48];
    return steps.map((notes, i) => (i % 4 === 0 ? [...notes, bass[Math.floor(i / 8) % bass.length]] : notes));
  })();
  const GAMELAN_SCALE = [62, 64, 67, 69, 71, 74];
  const GAMELAN_CORE = [2, 3, 2, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 2, 0];
  const SONGS = {
    canon: { title: 'Canon in D — Pachelbel', step: 0.32 },
    elise: {
      title: 'Für Elise — Beethoven',
      step: 0.19,
      notes: (n) => ELISE[n % ELISE.length].map((m) => [m, m < 60 ? 0.12 : 0.2, m < 60 ? 1.4 : 1.1])
    },
    joy: {
      title: 'Ode to Joy — Beethoven',
      step: 0.24,
      notes: (n) => JOY[n % JOY.length].map((m) => [m, m < 60 ? 0.16 : 0.2, m < 60 ? 2 : 1.4])
    },
    gamelan: {
      title: 'Gamelan Lembut',
      step: 0.3,
      metal: true,
      notes: (n) => {
        const beat = n % 16;
        const core = GAMELAN_SCALE[GAMELAN_CORE[beat]];
        const out = [[core, 0.18, 2.2]];
        if (n % 2 === 1) {
          out.push([GAMELAN_SCALE[(GAMELAN_CORE[beat] + 2) % GAMELAN_SCALE.length] + 12, 0.08, 1.2]);
        }
        if (beat % 4 === 0) {
          out.push([57, 0.12, 2.5]);
        }
        if (beat === 0) {
          out.push([38, 0.35, 5]);
        }
        return out;
      }
    }
  };
  const songId = () => {
    const preset = C.music?.preset || (C.music?.builtIn === false ? 'none' : 'canon');
    return SONGS[preset] ? preset : 'none';
  };

  const MusicBox = (() => {
    let ctx = null;
    let out = null;
    let timer = null;
    let nextTime = 0;
    let step = 0;
    let song = SONGS.canon;
    const NOTE = 0.32;
    const chords = [
      [62, 66, 69], [57, 61, 64], [59, 62, 66], [54, 57, 61],
      [55, 59, 62], [50, 54, 57], [55, 59, 62], [57, 61, 64]
    ];
    const pattern = [0, 1, 2, 3, 2, 1, 3, 1];
    const melody = [78, 76, 74, 73, 71, 69, 71, 73];
    const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

    function init() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
      out = ctx.createGain();
      out.gain.value = 0;
      out.connect(ctx.destination);
      const delay = ctx.createDelay();
      delay.delayTime.value = NOTE * 1.5;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.3;
      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      out.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(ctx.destination);
    }

    function pluck(midi, time, volume, length = 1.8) {
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();
      const overtoneGain = ctx.createGain();
      osc.type = song.metal ? 'sine' : 'triangle';
      overtone.type = 'sine';
      osc.frequency.value = freq(midi);
      // Gamelan bars ring with an inharmonic partial; the music box uses the octave.
      overtone.frequency.value = song.metal ? freq(midi) * 2.76 : freq(midi + 12);
      overtoneGain.gain.value = song.metal ? 0.35 : 0.25;
      osc.connect(gain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(gain);
      gain.connect(out);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(volume, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
      osc.start(time);
      overtone.start(time);
      osc.stop(time + length + 0.05);
      overtone.stop(time + length + 0.05);
    }

    function schedule() {
      if (song.notes) {
        while (nextTime < ctx.currentTime + 0.6) {
          song.notes(step).forEach(([midi, volume, length]) => pluck(midi, nextTime, volume, length));
          nextTime += song.step;
          step += 1;
        }
        return;
      }
      while (nextTime < ctx.currentTime + 0.6) {
        const chordIndex = Math.floor(step / 8) % chords.length;
        const chord = chords[chordIndex];
        const tones = [chord[0], chord[1], chord[2], chord[0] + 12];
        const beat = step % 8;
        if (beat === 0) {
          pluck(chord[0] - 12, nextTime, 0.4, 2.6);
          if (Math.floor(step / 64) % 2 === 1) {
            pluck(melody[chordIndex], nextTime, 0.18, 2.4);
          }
        }
        pluck(tones[pattern[beat]], nextTime, beat === 0 ? 0.22 : 0.14);
        nextTime += NOTE;
        step += 1;
      }
    }

    return {
      start(id) {
        if (!ctx) {
          init();
        }
        if (SONGS[id] !== song) {
          song = SONGS[id] || SONGS.canon;
          step = 0;
        }
        ctx.resume();
        out.gain.cancelScheduledValues(ctx.currentTime);
        out.gain.setTargetAtTime(0.55, ctx.currentTime, 0.4);
        nextTime = ctx.currentTime + 0.1;
        clearInterval(timer);
        timer = setInterval(schedule, 150);
        schedule();
      },
      stop() {
        if (!ctx) {
          return;
        }
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
        clearInterval(timer);
        timer = null;
      }
    };
  })();

  const audio = $('#bgm');
  const musicUrl = () => safeUrl(C.music?.url);
  const hasMusic = () => Boolean(musicUrl()) || songId() !== 'none';

  function setMusicUi(on) {
    state.musicOn = on;
    const button = $('#musicBtn');
    button.classList.toggle('playing', on);
    button.setAttribute('aria-pressed', String(on));
  }

  function startMusic() {
    const url = musicUrl();
    if (url) {
      if (audio.getAttribute('src') !== url) {
        audio.src = url;
        audio.volume = 0.7;
      }
      audio.play().then(() => setMusicUi(true)).catch(() => setMusicUi(false));
    } else if (songId() !== 'none') {
      try {
        MusicBox.start(songId());
        setMusicUi(true);
      } catch {
        setMusicUi(false);
      }
    }
  }

  function stopMusic() {
    audio.pause();
    MusicBox.stop();
    setMusicUi(false);
  }

  let resumeOnVisible = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.musicOn) {
      resumeOnVisible = true;
      stopMusic();
    } else if (!document.hidden && resumeOnVisible) {
      resumeOnVisible = false;
      startMusic();
    }
  });

  /* ------------------------------------------------------------------ */
  /* Cover, petals, countdown, reveal, nav                              */
  /* ------------------------------------------------------------------ */
  function startPetals() {
    const box = $('#petals');
    if (reduceMotion || box.childElementCount) {
      return;
    }
    for (let i = 0; i < 14; i += 1) {
      const petal = document.createElement('span');
      const size = 8 + Math.random() * 10;
      petal.className = 'petal';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.width = `${size}px`;
      petal.style.height = `${size * 0.8}px`;
      petal.style.opacity = String(0.3 + Math.random() * 0.4);
      petal.style.animationDuration = `${10 + Math.random() * 9}s`;
      petal.style.animationDelay = `${-Math.random() * 18}s`;
      petal.style.setProperty('--drift', `${(Math.random() - 0.3) * 160}px`);
      box.appendChild(petal);
    }
  }

  function openInvitation({ instant = false } = {}) {
    if (state.opened) {
      return;
    }
    state.opened = true;
    const cover = $('#cover');
    const reveal = () => {
      document.body.classList.remove('locked');
      document.body.classList.add('opened');
      startPetals();
    };
    window.scrollTo(0, 0);
    if (instant) {
      cover.hidden = true;
      reveal();
      return;
    }
    $('#envelope').classList.add('open');
    startMusic();
    setTimeout(() => {
      cover.classList.add('gone');
      reveal();
      setTimeout(() => {
        cover.hidden = true;
      }, 1300);
    }, reduceMotion ? 50 : 1400);
  }

  function updateCountdown() {
    if (!validDate(C.weddingDate)) {
      $('#countdown').hidden = true;
      return;
    }
    const diff = new Date(C.weddingDate) - Date.now();
    $('#countdown').hidden = diff <= 0;
    $('#countdownDone').hidden = diff > 0;
    if (diff <= 0) {
      return;
    }
    const total = Math.floor(diff / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    $('#cdD').textContent = Math.floor(total / 86400);
    $('#cdH').textContent = pad(Math.floor((total % 86400) / 3600));
    $('#cdM').textContent = pad(Math.floor((total % 3600) / 60));
    $('#cdS').textContent = pad(total % 60);
  }

  let revealObserver = null;
  function observeReveals() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach((el) => el.classList.add('in'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    $$('.reveal:not(.in)').forEach((el) => revealObserver.observe(el));
  }

  function revealVisibleNow() {
    $$('.reveal').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('in');
      }
    });
  }

  function observeSections() {
    if (!('IntersectionObserver' in window)) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          $$('#bottomNav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'couple', 'events', 'gallery', 'rsvp', 'gift'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Lightbox, share, copy, toast, language                             */
  /* ------------------------------------------------------------------ */
  function openLightbox(index) {
    state.lightboxIndex = index;
    updateLightbox();
    $('#lightbox').hidden = false;
  }

  function updateLightbox() {
    const items = state.galleryItems;
    const item = items[state.lightboxIndex];
    const img = $('#lbImg');
    const video = $('#lbVideo');
    video.pause();
    if (item.video) {
      const motion = Boolean(item.src);
      img.hidden = true;
      video.hidden = false;
      video.muted = motion;
      video.loop = motion;
      video.controls = !motion;
      if (item.src) {
        video.poster = item.src;
      } else {
        video.removeAttribute('poster');
      }
      video.src = item.video;
      video.play().catch(() => {});
    } else {
      video.hidden = true;
      video.removeAttribute('src');
      img.hidden = false;
      img.src = item.src;
    }
    $('#lbCount').textContent = `${state.lightboxIndex + 1} / ${items.length}`;
  }

  function stepLightbox(delta) {
    const count = state.galleryItems.length;
    state.lightboxIndex = (state.lightboxIndex + delta + count) % count;
    updateLightbox();
  }

  function closeLightbox() {
    $('#lightbox').hidden = true;
    $('#lbVideo').pause();
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve) => {
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
      resolve();
    });
  }

  let toastTimer = null;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function openShareSheet() {
    $('#nativeShare').hidden = !navigator.share;
    $('#shareSheet').hidden = false;
  }

  function closeShareSheet() {
    $('#shareSheet').hidden = true;
  }

  async function handleShare(kind) {
    const url = shareUrl();
    const message = t('shareText', { couple: coupleNames() });
    const enc = encodeURIComponent;
    const targets = {
      wa: `https://wa.me/?text=${enc(`${message}\n${url}`)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      x: `https://twitter.com/intent/tweet?text=${enc(message)}&url=${enc(url)}`,
      tg: `https://t.me/share/url?url=${enc(url)}&text=${enc(message)}`
    };
    if (targets[kind]) {
      window.open(targets[kind], '_blank', 'noopener');
    } else if (kind === 'copy') {
      await copyText(url);
      toast(t('linkCopied'));
    } else if (kind === 'native') {
      try {
        await navigator.share({ title: document.title, text: message, url });
      } catch {
        /* cancelled */
      }
    } else if (kind === 'story') {
      await shareStory();
    }
    closeShareSheet();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function storyImage() {
    try {
      await Promise.all([
        document.fonts.load('170px "Great Vibes"'),
        document.fonts.load('500 54px "Cormorant Garamond"'),
        document.fonts.load('400 34px "Jost"')
      ]);
    } catch {
      /* fall back to system fonts */
    }
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext('2d');
    const primary = cssVar('--primary') || '#6b7b5b';
    const dark = cssVar('--primary-dark') || '#4a573e';
    const accent = cssVar('--accent') || '#b8955a';
    const gradient = g.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, primary);
    gradient.addColorStop(1, dark);
    g.fillStyle = gradient;
    g.fillRect(0, 0, width, height);
    const photo = safeUrl(C.heroPhoto);
    if (photo) {
      try {
        const img = await loadImage(photo);
        const scale = Math.max(width / img.width, height / img.height);
        g.drawImage(img, (width - img.width * scale) / 2, (height - img.height * scale) / 2, img.width * scale, img.height * scale);
        g.fillStyle = 'rgba(0, 0, 0, 0.45)';
        g.fillRect(0, 0, width, height);
      } catch {
        /* keep gradient */
      }
    }
    g.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    g.lineWidth = 3;
    g.strokeRect(60, 60, width - 120, height - 120);
    g.strokeRect(78, 78, width - 156, height - 156);
    const [first, second] = orderedCouple();
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.font = '400 34px Jost, sans-serif';
    if ('letterSpacing' in g) {
      g.letterSpacing = '10px';
    }
    g.fillText(t('theWeddingOf').toUpperCase(), width / 2, 700);
    if ('letterSpacing' in g) {
      g.letterSpacing = '0px';
    }
    g.font = '170px "Great Vibes", cursive';
    g.fillText(nick(first), width / 2, 900);
    g.fillStyle = accent;
    g.font = '110px "Great Vibes", cursive';
    g.fillText('&', width / 2, 1015);
    g.fillStyle = '#ffffff';
    g.font = '170px "Great Vibes", cursive';
    g.fillText(nick(second), width / 2, 1175);
    g.font = '500 54px "Cormorant Garamond", serif';
    g.fillText(fmtLongDate(C.weddingDate), width / 2, 1310);
    const venue = events()[0]?.venue;
    if (venue) {
      g.font = '400 38px Jost, sans-serif';
      g.fillText(venue, width / 2, 1380);
    }
    if (C.hashtag) {
      g.fillStyle = accent;
      g.font = '500 44px Jost, sans-serif';
      g.fillText(C.hashtag, width / 2, 1500);
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.85)';
    g.font = '400 30px Jost, sans-serif';
    g.fillText(shareUrl().replace(/^https?:\/\//, ''), width / 2, 1770);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  async function shareStory() {
    toast(t('storyMaking'));
    const blob = await storyImage();
    const file = new File([blob], `undangan-${SLUG}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: document.title });
      } catch {
        /* cancelled */
      }
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 1000);
    toast(t('storyReady'));
  }

  function toggleLang() {
    state.lang = state.lang === 'id' ? 'en' : 'id';
    saveJSON('inv_lang', state.lang);
    renderAll();
    revealVisibleNow();
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                             */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    if (e.target === $('#lightbox')) {
      closeLightbox();
      return;
    }
    if (e.target === $('#shareSheet')) {
      closeShareSheet();
      return;
    }
    const shareButton = e.target.closest('[data-share]');
    if (shareButton) {
      handleShare(shareButton.dataset.share);
      return;
    }
    const el = e.target.closest('[data-action]');
    if (!el) {
      return;
    }
    const index = Number(el.dataset.idx || 0);
    switch (el.dataset.action) {
      case 'open':
        openInvitation();
        break;
      case 'map':
        toggleMap(index, el);
        break;
      case 'gcal':
        if (events()[index] && validDate(events()[index].start)) {
          window.open(googleCalUrl(events()[index]), '_blank', 'noopener');
        }
        break;
      case 'ics':
        if (events()[index] && validDate(events()[index].start)) {
          downloadIcs(events()[index]);
        }
        break;
      case 'copy':
        copyText(el.dataset.copy).then(() => toast(t('copied')));
        break;
      case 'lightbox':
        openLightbox(index);
        break;
      case 'lb-close':
        closeLightbox();
        break;
      case 'lb-prev':
        stepLightbox(-1);
        break;
      case 'lb-next':
        stepLightbox(1);
        break;
      case 'more':
        loadWishes({ append: true });
        break;
      case 'lang':
        toggleLang();
        break;
      case 'music':
        if (state.musicOn) {
          stopMusic();
        } else {
          startMusic();
        }
        break;
      case 'share':
        openShareSheet();
        break;
      case 'close-sheet':
        closeShareSheet();
        break;
      case 'like':
        likeWish(String(el.dataset.id));
        break;
      case 'gift-toggle':
        $('#giftForm').hidden = !$('#giftForm').hidden;
        break;
      case 'embed-live': {
        const embed = embedUrl(safeUrl(C.livestream?.url));
        if (embed) {
          $('#livePlayer').innerHTML = iframePlayer(embed);
          el.remove();
          stopMusic();
        }
        break;
      }
      case 'wa-rsvp':
        whatsappRsvp();
        break;
      case 'rsvp-edit':
        showRsvpForm();
        break;
      default:
        break;
    }
  });

  document.addEventListener('keydown', (e) => {
    if ($('#lightbox').hidden) {
      return;
    }
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      stepLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      stepLightbox(1);
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'giftForm') {
      e.preventDefault();
      submitGift(e.target);
    }
  });

  // Pause background music when a guest plays a video with sound.
  document.addEventListener('play', (e) => {
    if (e.target.tagName === 'VIDEO' && !e.target.muted && state.musicOn) {
      stopMusic();
    }
  }, true);

  let touchStartX = 0;
  $('#lightbox').addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  $('#lightbox').addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      stepLightbox(dx < 0 ? 1 : -1);
    }
  });

  // Live preview from the dashboard editor (same-origin iframe only).
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !DATA.preview) {
      return;
    }
    if (e.data && e.data.type === 'invite-config' && e.data.config) {
      C = e.data.config;
      renderAll();
      revealVisibleNow();
    }
  });

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */
  function init() {
    if (DATA.preview && !DATA.published) {
      const banner = document.createElement('div');
      banner.className = 'preview-banner';
      banner.textContent = t('previewBanner');
      document.body.appendChild(banner);
    }
    initRsvp();
    renderAll();
    observeSections();
    loadWishes();
    if (DATA.guest && !DATA.preview && !STATIC_DEMO) {
      api(`/api/public/${SLUG}/open`, { method: 'POST', body: JSON.stringify({ guestCode: DATA.guest.code }) }).catch(() => {});
    }
    setInterval(() => {
      updateCountdown();
      updateLiveState();
    }, 1000);
    updateLiveState();
    if (params.get('open') === '1') {
      openInvitation({ instant: true });
      revealVisibleNow();
    }
  }

  init();
})();
