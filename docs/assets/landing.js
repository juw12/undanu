/* Landing page: show approved couple reviews (hidden when unavailable, e.g. the static demo). */
(async () => {
  'use strict';
  const section = document.getElementById('ulasan');
  if (!section) {
    return;
  }
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  try {
    const response = await fetch('/api/reviews/public', { headers: { 'X-Requested-With': 'fetch' } });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    if (!data.reviews || !data.reviews.length) {
      return;
    }
    document.getElementById('reviewSummary').textContent = `★ ${data.average} dari 5 · ${data.total} ulasan`;
    document.getElementById('reviewsGrid').innerHTML = data.reviews.map((r) => `
      <article class="review">
        <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <p>“${esc(r.text)}”</p>
        <div class="who"><b>${esc(r.name)}</b>${r.couple ? ` · ${esc(r.couple)}` : ''}</div>
      </article>`).join('');
    section.hidden = false;
  } catch {
    /* keep hidden */
  }
})();

/* Landing page: Bahasa Indonesia / English, and the hero demo for each religion/tradition. */
(() => {
  'use strict';
  const STORAGE_KEY = 'undanu_lang';
  const GUEST = { id: 'Keluarga Santoso', en: 'The Santoso Family' };
  const translatable = Array.from(document.querySelectorAll('[data-en]'));
  translatable.forEach((el) => {
    el.dataset.id = el.innerHTML;
  });

  const frame = document.getElementById('heroDemo');
  const demoLink = document.getElementById('heroDemoLink');
  const chips = Array.from(document.querySelectorAll('.demo-chip[data-agama]'));
  const toggle = document.getElementById('langToggle');
  let lang = 'id';
  let agama = 'umum';

  function storedLang() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function demoUrl(base, extra) {
    const url = new URL(base, location.href);
    url.searchParams.set('lang', lang);
    url.searchParams.set('to', GUEST[lang]);
    Object.entries(extra || {}).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.pathname + url.search;
  }

  function updateDemo() {
    if (frame) {
      frame.src = demoUrl(frame.getAttribute('src'), { agama, switcher: '0' });
    }
    if (demoLink) {
      demoLink.href = demoUrl(demoLink.getAttribute('href'), { agama });
    }
  }

  function setLang(next, { remember = true } = {}) {
    lang = next === 'en' ? 'en' : 'id';
    translatable.forEach((el) => {
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.id;
    });
    document.documentElement.lang = lang;
    if (toggle) {
      toggle.textContent = lang === 'en' ? 'ID' : 'EN';
    }
    if (remember) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* private mode */
      }
    }
    updateDemo();
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((other) => other.classList.toggle('active', other === chip));
      agama = chip.dataset.agama;
      updateDemo();
    });
  });
  toggle?.addEventListener('click', () => setLang(lang === 'en' ? 'id' : 'en'));

  const initial = storedLang() || ((navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : 'en');
  if (initial === 'en') {
    setLang('en', { remember: false });
  }
})();
