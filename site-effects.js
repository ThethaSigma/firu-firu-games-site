(() => {
  'use strict';

  const ticker = document.getElementById('gameTicker');
  const toggle = document.getElementById('tickerToggle');
  if (!ticker || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pausedByUser = false;

  function syncTicker() {
    // A manual pause survives language changes and background/foreground switches.
    ticker.dataset.paused = String(pausedByUser || document.hidden);
    toggle.setAttribute('aria-pressed', String(pausedByUser));
    toggle.hidden = reducedMotion.matches;
  }

  toggle.addEventListener('click', () => {
    pausedByUser = !pausedByUser;
    syncTicker();
  });
  document.addEventListener('visibilitychange', syncTicker);
  reducedMotion.addEventListener('change', syncTicker);

  syncTicker();
  ticker.classList.add('is-ready');
})();
