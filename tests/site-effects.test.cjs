const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'site-effects.js'), 'utf8');

function harness({ reduced = false, missing = false } = {}) {
  const listeners = {};
  const ticker = { dataset: {}, classList: { add: value => { ticker.ready = value; } } };
  const toggle = {
    hidden: true, attrs: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener: (event, callback) => { listeners[event] = callback; }
  };
  const motion = {
    matches: reduced,
    addEventListener: (event, callback) => { listeners.motion = callback; }
  };
  const document = {
    hidden: false,
    getElementById: id => missing ? null : id === 'gameTicker' ? ticker : toggle,
    addEventListener: (event, callback) => { listeners[event] = callback; }
  };
  vm.runInNewContext(source, { document, window: { matchMedia: () => motion } });
  return { ticker, toggle, document, motion, listeners };
}

test('marquee starts only after its pause control has been initialized', () => {
  const { ticker, toggle } = harness();
  assert.equal(ticker.ready, 'is-ready');
  assert.equal(ticker.dataset.paused, 'false');
  assert.equal(toggle.hidden, false);
  assert.equal(toggle.attrs['aria-pressed'], 'false');
});

test('pause and resume update both animation state and the accessible toggle', () => {
  const { ticker, toggle, listeners } = harness();
  listeners.click();
  assert.equal(ticker.dataset.paused, 'true');
  assert.equal(toggle.attrs['aria-pressed'], 'true');
  listeners.click();
  assert.equal(ticker.dataset.paused, 'false');
  assert.equal(toggle.attrs['aria-pressed'], 'false');
});

test('backgrounding pauses motion without losing the manual pause choice', () => {
  const { ticker, toggle, document, listeners } = harness();
  document.hidden = true;
  listeners.visibilitychange();
  assert.equal(ticker.dataset.paused, 'true');
  assert.equal(toggle.attrs['aria-pressed'], 'false');
  document.hidden = false;
  listeners.visibilitychange();
  assert.equal(ticker.dataset.paused, 'false');
  listeners.click();
  document.hidden = true;
  listeners.visibilitychange();
  document.hidden = false;
  listeners.visibilitychange();
  assert.equal(ticker.dataset.paused, 'true');
  assert.equal(toggle.attrs['aria-pressed'], 'true');
});

test('reduced-motion changes hide the unnecessary control and preserve user pause', () => {
  const { motion, toggle, ticker, listeners } = harness({ reduced: true });
  assert.equal(toggle.hidden, true);
  motion.matches = false;
  listeners.motion();
  assert.equal(toggle.hidden, false);
  listeners.click();
  motion.matches = true;
  listeners.motion();
  motion.matches = false;
  listeners.motion();
  assert.equal(toggle.hidden, false);
  assert.equal(ticker.dataset.paused, 'true');
});

test('pages without a marquee remain usable', () => {
  assert.doesNotThrow(() => harness({ missing: true }));
});

test('loop groups have identical bilingual content and the duplicate is aria-hidden', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const groups = [...html.matchAll(/<div class="ticker-group[^"]*"([^>]*)>([\s\S]*?)<\/div>/g)];
  assert.equal(groups.length, 2);
  assert.equal(groups[0][2], groups[1][2]);
  assert.match(groups[1][1], /aria-hidden="true"/);
  assert.equal((groups[0][2].match(/data-tr=/g) || []).length, 4);
  assert.equal((groups[0][2].match(/data-en=/g) || []).length, 4);
});
