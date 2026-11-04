/* Installable app (PWA): registers the service worker and shows an "Install app" button.
   Buttons marked [data-install] are revealed when the browser can install the app;
   on iPhone/iPad (no install prompt) they show Add-to-Home-Screen instructions instead. */
(() => {
  'use strict';
  if (!document.querySelector('link[rel="manifest"]')) {
    return; // static demo build (GitHub Pages) is not installable
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* non-fatal */ });
    });
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) {
    document.documentElement.classList.add('is-installed-app');
    return;
  }
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const english = () => (document.documentElement.lang || 'id').startsWith('en');
  let deferredPrompt = null;

  function buttons() {
    let found = Array.from(document.querySelectorAll('[data-install]'));
    if (!found.length && document.body) {
      const floating = document.createElement('button');
      floating.type = 'button';
      floating.className = 'install-fab';
      floating.dataset.install = 'fab';
      floating.hidden = true;
      document.body.appendChild(floating);
      found = [floating];
    }
    return found;
  }

  function showButtons() {
    buttons().forEach((button) => {
      if (button.dataset.install === 'fab') {
        button.textContent = english() ? '⤓ Install app' : '⤓ Pasang aplikasi';
      }
      button.hidden = false;
    });
  }

  function hideButtons() {
    document.querySelectorAll('[data-install]').forEach((button) => {
      button.hidden = true;
    });
  }

  function iosHelp() {
    const message = english()
      ? 'To install Undanu on your iPhone/iPad: tap the Share button in Safari, then choose "Add to Home Screen".'
      : 'Cara memasang Undanu di iPhone/iPad: ketuk tombol Bagikan (Share) di Safari, lalu pilih "Tambahkan ke Layar Utama".';
    window.alert(message);
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-install]');
    if (!button) {
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;
      if (choice && choice.outcome === 'accepted') {
        hideButtons();
      }
    } else if (isIOS) {
      iosHelp();
    }
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showButtons();
  });
  window.addEventListener('appinstalled', hideButtons);

  if (isIOS) {
    document.addEventListener('DOMContentLoaded', showButtons);
    if (document.readyState !== 'loading') {
      showButtons();
    }
  }
})();
