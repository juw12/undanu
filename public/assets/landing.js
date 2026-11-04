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

/* Landing page: switch the hero phone between the demo for each religion. */
(() => {
  'use strict';
  const frame = document.getElementById('heroDemo');
  const chips = document.querySelectorAll('.demo-chip[data-src]');
  if (!frame || !chips.length) {
    return;
  }
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((other) => other.classList.toggle('active', other === chip));
      frame.src = chip.dataset.src;
    });
  });
})();
