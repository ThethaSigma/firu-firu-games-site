const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'site-construction.js'), 'utf8');

async function harness({ reduced = false, saved = false, brokenCanvas = false, width = 1000, seed = 123456, withCard = false, frameMs = 32, animationSource = source } = {}) {
  class Events {
    listeners = new Map();
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
    emit(type, event = {}) { for (const fn of [...(this.listeners.get(type) || [])]) fn(event); }
  }
  const created = [];
  const drawingLabels = [];
  const cursors = [];
  class TextNode {
    constructor(data) { this.data = data; this.nodeType = 3; this.parentNode = null; }
    get parentElement() { return this.parentNode; }
  }
  const graphics = new Proxy({ measureText: text => ({ width: text.length * 7 }), fillText: text => drawingLabels.push(text), translate: (x, y) => cursors.push({ x, y }) }, { get: (target, key) => target[key] || (() => {}) });
  class Element extends Events {
    constructor(tag = 'div', top = 20) {
      super(); this.tagName = tag.toUpperCase(); this.nodeType = 1; this.top = top; this.dataset = {}; this.children = []; this.hidden = false; this.attrs = {};
      const classes = new Set(); this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) };
      const values = new Map();
      this.style = { setProperty(key, value) { values.set(key, value); }, removeProperty(key) { values.delete(key); }, getPropertyValue: key => values.get(key) || '', getPropertyPriority: () => '' }; created.push(this);
    }
    setAttribute(key, value) { this.attrs[key] = value; }
    getAttribute(key) { return this.attrs[key] ?? null; }
    removeAttribute(key) { delete this.attrs[key]; if (key.startsWith('data-')) delete this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())]; }
    getBoundingClientRect() { return { left: 20, right: 300, top: this.top, bottom: this.top + 80, width: 280, height: 80 }; }
    appendChild(e) { this.children.push(e); e.parent = this; e.parentNode = this; return e; }
    append(...items) { items.forEach(e => this.appendChild(e)); }
    remove() { this.removed = true; if (this.parent) this.parent.children = this.parent.children.filter(e => e !== this); }
    contains(e) { return this === e || this.children.some(c => c === e || c.contains?.(e)); }
    getContext() { return brokenCanvas ? null : graphics; }
    closest(selector) { if (selector.includes('aria-hidden')) return this.getAttribute('aria-hidden') === 'true' ? this : this.parentNode?.closest(selector) || null; return this.isLink ? this : null; }
    querySelectorAll(selector) {
      const result = [];
      const walk = e => { for (const child of e.children || []) if (child.nodeType === 1) { if (selector === 'img' ? child.tagName === 'IMG' : /^(H2|H3|P|SMALL|FIGCAPTION)$/.test(child.tagName)) result.push(child); walk(child); } };
      walk(this); return result;
    }
    get textContent() { return this.children.map(child => child.nodeType === 3 ? child.data : child.textContent).join(''); }
    set textContent(value) { for (const child of this.children) child.parentNode = null; this.children = []; if (value) this.appendChild(new TextNode(value)); }
    focus() { document.activeElement = this; }
  }
  const replay = new Element('button');
  const brand = new Element('a');
  const panel = new Element('div', 300);
  const download = new Element('a', 320); panel.appendChild(download);
  const below = new Element('h2', 1500);
  below.textContent = 'Firu ile iki oyun';
  const card = new Element('article', 1700);
  const quote = new Element('p', 1720);
  quote.textContent = 'Firu 🐾 büyüyor. İki oyun, tek macera.';
  card.appendChild(quote);
  const hero = new Element('div');
  const document = new Events();
  Object.assign(document, {
    body: new Element('body'), documentElement: new Element('html'), hidden: false, activeElement: null,
    fonts: { ready: Promise.resolve() },
    getElementById: id => id === 'buildReplay' ? replay : null,
    createElement: tag => new Element(tag),
    createTreeWalker: element => {
      const nodes = []; const walk = e => { for (const child of e.children || []) { if (child.nodeType === 3) nodes.push(child); else walk(child); } }; walk(element);
      let i = 0; return { nextNode: () => nodes[i++] || null };
    },
    querySelector: selector => ({ '.hero-world': hero, '.brand': brand, '.hero-copy': panel, '.hero .official-store-link': download })[selector] || null,
    querySelectorAll: selector => selector.startsWith('.hero-copy') ? [download] : selector.startsWith('.section-head') ? withCard ? [below, card] : [below] : []
  });
  document.documentElement.lang = 'tr';
  const window = new Events();
  const motion = new Events(); motion.matches = reduced;
  const frames = new Map(), timers = new Map(); let serial = 0;
  const seededMath = Object.create(Math);
  seededMath.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  Object.assign(window, { matchMedia: () => motion, requestAnimationFrame: fn => { frames.set(++serial, fn); return serial; }, scrollTo() {} });
  const environment = vm.createContext({
    window, document, innerWidth: width, innerHeight: 800, devicePixelRatio: 1, URLSearchParams, Math: seededMath,
    location: { search: '' }, sessionStorage: { getItem: () => saved ? '1' : null, setItem() {} },
    requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (fn, ms) => { timers.set(++serial, { fn, ms }); return serial; }, clearTimeout: id => timers.delete(id),
    getComputedStyle: () => ({ display: 'block' }), console: { warn() {} }
  });
  vm.runInContext(animationSource, environment);
  await new Promise(resolve => setImmediate(resolve));
  let now = 0;
  const drawingTimes = new Map();
  const textFrames = [];
  const cursorFrames = [];
  function tick() {
    cursors.length = 0;
    now += frameMs; const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn(now));
    cursorFrames.push([...cursors]);
    for (const e of created) if (e.dataset.crewState === 'drawing' && !drawingTimes.has(e)) drawingTimes.set(e, now);
    textFrames.push({ time: now, text: quote.textContent, state: quote.dataset.crewState, correction: quote.dataset.crewCorrection, box: card.dataset.crewState, scale: card.style.getPropertyValue('--crew-scale-x'), headingText: below.textContent, headingScale: below.style.getPropertyValue('--crew-heading-scale') });
  }
  function advance() {
    for (let step = 0; step < Math.ceil(16000 / frameMs) && frames.size; step++) tick();
  }
  const hidden = () => created.filter(e => !e.removed && e.dataset.crewState);
  return { window, document, motion, replay, frames, created, brand, panel, download, below, card, quote, advance, tick, textFrames, cursorFrames, hidden, drawingTimes, environment, drawingLabels, get elapsed() { return now; } };
}

for (const width of [1440, 390]) test(`opening and the next section finish within the faster timing budget at width ${width}`, async () => {
  const h = await harness({ width, withCard: true, frameMs: 16 });
  h.advance();
  assert.ok(h.elapsed <= 2500, `opening took ${h.elapsed} ms`);
  const openingEnd = h.elapsed;
  h.below.top = 100; h.card.top = 250; h.quote.top = 270;
  h.window.emit('scroll'); h.advance();
  assert.equal(h.hidden().length, 0);
  assert.ok(h.elapsed - openingEnd <= 1800, `section took ${h.elapsed - openingEnd} ms`);
});

for (const width of [1000, 390]) test(`only working cursors appear and one remaining heading gets one cursor at width ${width}`, async () => {
  const h = await harness({ width });
  h.advance();
  assert.ok(h.cursorFrames.every(frame => frame.length <= (width < 760 ? 10 : 24)));
  assert.ok(h.cursorFrames.some(frame => frame.length > 1), 'busy scenes still use multiple workers');
  const start = h.cursorFrames.length;
  h.below.top = 250; h.window.emit('scroll'); h.advance();
  const headingFrames = h.cursorFrames.slice(start);
  assert.ok(headingFrames.some(frame => frame.length === 1));
  assert.ok(headingFrames.every(frame => frame.length <= 1), 'idle workers must not orbit the single remaining job');
  assert.ok(h.created.find(e => e.className === 'crew-canvas').removed, 'the cursor overlay disappears after the final job');
  assert.equal(h.frames.size, 0);
});

test('builds the visible page, sleeps offscreen, and wakes when the next section arrives', async () => {
  const h = await harness();
  assert.equal(h.window.firuConstruction.active, true);
  h.advance();
  assert.equal(h.brand.dataset.crewState, undefined);
  assert.equal(h.panel.dataset.crewState, undefined);
  assert.equal(h.download.dataset.crewState, undefined);
  assert.equal(h.below.dataset.crewState, 'waiting');
  assert.equal(h.frames.size, 0, 'idle construction must not keep a rendering loop running');
  h.below.top = 250;
  h.window.emit('scroll'); h.advance();
  assert.equal(h.window.firuConstruction.active, false);
  assert.equal(h.hidden().length, 0);
});

test('skip restores every target, removes overlays, and restores focus to a download', async () => {
  const h = await harness();
  const skip = h.created.find(e => e.className === 'crew-skip'); skip.focus(); skip.emit('click');
  assert.equal(h.window.firuConstruction.active, false);
  assert.equal(h.hidden().length, 0);
  assert.equal(h.frames.size, 0);
  assert.equal(h.document.activeElement, h.download);
  assert.ok(h.created.filter(e => e.className === 'crew-hud' || e.className === 'crew-canvas').every(e => e.removed));
});

test('hero pieces start independently and use multiple reveal directions', async () => {
  const h = await harness();
  const tiles = h.created.filter(e => e.className === 'crew-shutter');
  const directions = new Set(tiles.map(e => e.dataset.crewEdge));
  assert.equal(directions.size, 4);
  h.advance();
  const starts = tiles.map(e => h.drawingTimes.get(e)).filter(time => time !== undefined);
  assert.ok(starts.length > 12);
  assert.ok(new Set(starts).size > 8, 'the crew must not reveal its pieces on one shared clock');
  assert.ok(tiles.every(e => e.removed && e.dataset.crewEdge === undefined));
});

test('resizes a box before typing its text, preserves Unicode, and restores layout styles', async () => {
  const h = await harness({ withCard: true, frameMs: 16 });
  const original = h.quote.textContent;
  const node = h.quote.children[0];
  h.advance();
  h.below.top = 100; h.card.top = 250; h.quote.top = 270;
  h.window.emit('scroll'); h.advance();
  const partial = h.textFrames.filter(frame => frame.state === 'typing' && frame.text.length > 0 && frame.text.length < original.length);
  assert.ok(partial.length > 3, 'the paragraph must contain real intermediate character prefixes');
  assert.ok(partial.every(frame => (frame.correction === 'mistake' || original.startsWith(frame.text)) && !/[\uD800-\uDBFF]$/.test(frame.text)));
  const sizing = h.textFrames.filter(frame => frame.box === 'sizing');
  assert.ok(new Set(sizing.map(frame => frame.scale)).size > 2);
  assert.ok(Number(sizing[0].scale) < .8);
  assert.equal(h.quote.textContent, original);
  assert.equal(h.quote.children[0], node, 'typing must preserve the original text node');
  assert.equal(h.quote.style.getPropertyValue('width'), '');
  assert.equal(h.quote.style.getPropertyValue('height'), '');
  assert.equal(h.quote.getAttribute('aria-label'), null);
  assert.equal(h.card.style.getPropertyValue('--crew-scale-x'), '');
});

test('a selected typo is backspaced and corrected without changing the final paragraph', async () => {
  const h = await harness({ withCard: true });
  const original = h.quote.textContent;
  h.advance(); h.below.top = 100; h.card.top = 250; h.quote.top = 270;
  h.window.emit('scroll'); h.advance();
  const mistake = h.textFrames.find(frame => frame.correction === 'mistake');
  const deleted = h.textFrames.find(frame => frame.correction === 'delete');
  const corrected = h.textFrames.find(frame => frame.correction === 'corrected' && frame.text.length > mistake.text.length);
  assert.ok(mistake && !original.startsWith(mistake.text));
  assert.equal(deleted.text.length, mistake.text.length - 1);
  assert.ok(original.startsWith(deleted.text));
  assert.ok(corrected && original.startsWith(corrected.text));
  assert.equal(h.quote.textContent, original);
  assert.equal(h.quote.dataset.crewCorrection, undefined);
});

test('headings finish typing small, grow past their target, then settle and remove the transform', async () => {
  const h = await harness({ frameMs: 16 });
  const original = h.below.textContent;
  h.advance(); h.below.top = 200; h.window.emit('scroll'); h.advance();
  const typed = h.textFrames.filter(frame => frame.headingText === original && frame.headingScale);
  assert.ok(typed.some(frame => Number(frame.headingScale) < .8));
  assert.ok(typed.some(frame => Number(frame.headingScale) > 1.02));
  assert.ok(typed.some(frame => Math.abs(Number(frame.headingScale) - 1) < .001));
  assert.equal(h.below.style.getPropertyValue('--crew-heading-scale'), '');
  assert.equal(h.below.dataset.crewHeading, undefined);
  assert.equal(h.below.textContent, original);
});

test('alignment guides measure displacement and skip removes an unfinished heading scale', async () => {
  const h = await harness();
  h.advance(); h.below.top = 200; h.window.emit('scroll');
  for (let i = 0; i < 100; i++) {
    h.tick();
    if (h.below.dataset.crewState === 'typing' && Number(h.below.style.getPropertyValue('--crew-heading-scale')) > .7) break;
  }
  assert.ok(h.drawingLabels.some(label => /^\d+ px$/.test(label)));
  h.created.find(e => e.className === 'crew-skip').emit('click');
  assert.equal(h.below.style.getPropertyValue('--crew-heading-scale'), '');
  assert.equal(h.below.dataset.crewHeading, undefined);
  assert.equal(h.hidden().length, 0);
});

for (const exit of ['skip', 'language']) test(`${exit} during typing restores text without overwriting translated nodes`, async () => {
  const h = await harness({ withCard: true });
  const original = h.quote.textContent;
  h.advance(); h.below.top = 100; h.card.top = 250; h.quote.top = 270;
  h.window.emit('scroll');
  for (let i = 0; i < 100; i++) {
    h.tick();
    if (h.quote.dataset.crewState === 'typing' && h.quote.textContent.length > 0 && h.quote.textContent.length < original.length) break;
  }
  assert.equal(h.quote.dataset.crewState, 'typing');
  assert.equal(h.quote.getAttribute('aria-label'), original);
  if (exit === 'language') {
    h.quote.textContent = 'Two games. One adventure.';
    h.window.emit('firu:languagechange');
  } else h.created.find(e => e.className === 'crew-skip').emit('click');
  assert.equal(h.quote.textContent, exit === 'language' ? 'Two games. One adventure.' : original);
  assert.equal(h.quote.style.getPropertyValue('width'), '');
  assert.equal(h.hidden().length, 0);
});

test('different crew timings finish cleanly on narrow and wide screens', async () => {
  for (const width of [390, 1440]) for (const seed of [1, 42, 4096]) {
    const h = await harness({ width, seed });
    h.advance();
    assert.equal(h.frames.size, 0);
    assert.equal(h.download.dataset.crewState, undefined);
    h.below.top = 200; h.window.emit('scroll'); h.advance();
    assert.equal(h.window.firuConstruction.active, false);
    assert.equal(h.hidden().length, 0);
  }
});

for (const event of ['resize', 'firu:languagechange']) test(`${event} leaves no stale masks or hidden content`, async () => {
  const h = await harness();
  if (event === 'resize') h.environment.innerWidth = 600;
  h.window.emit(event);
  assert.equal(h.window.firuConstruction.active, false);
  assert.equal(h.hidden().length, 0);
});

test('mobile address-bar height changes preserve the crew and resize its canvas', async () => {
  const h = await harness({ width: 390, withCard: true });
  h.advance();
  for (const height of [700, 844, 760, 800]) {
    h.environment.innerHeight = height;
    h.window.emit('resize'); h.advance();
    assert.equal(h.window.firuConstruction.active, true);
    assert.equal(h.below.dataset.crewState, 'waiting');
    assert.equal(h.card.dataset.crewState, 'waiting');
    assert.equal(h.created.find(e => e.className === 'crew-canvas').height, height);
    assert.equal(h.document.documentElement.dataset.crewResult, undefined);
  }
  h.below.top = 120; h.card.top = 250; h.quote.top = 270;
  h.window.emit('scroll'); h.advance();
  assert.ok(h.textFrames.some(frame => frame.state === 'typing' && frame.text.length > 0 && frame.text.length < 'Firu 🐾 büyüyor. İki oyun, tek macera.'.length));
  assert.equal(h.hidden().length, 0);
});

test('a sliver at the bottom does not start a section before the user can see it', async () => {
  const h = await harness({ width: 390, withCard: true });
  h.advance();
  h.card.top = 770; h.quote.top = 790;
  h.window.emit('scroll'); h.advance();
  assert.equal(h.card.dataset.crewState, 'waiting');
  assert.equal(h.quote.dataset.crewState, 'waiting');
  h.card.top = 600; h.quote.top = 620;
  h.window.emit('scroll'); h.advance();
  assert.equal(h.card.dataset.crewState, undefined);
  assert.equal(h.quote.dataset.crewState, undefined);
});

test('typing pauses outside the viewport and resumes at the same character after scrolling back', async () => {
  const h = await harness({ width: 390, withCard: true });
  const original = h.quote.textContent;
  h.advance(); h.below.top = 120; h.card.top = 250; h.quote.top = 270;
  h.window.emit('scroll');
  for (let i = 0; i < 120; i++) {
    h.tick();
    if (h.quote.dataset.crewState === 'typing' && h.quote.textContent.length > 3 && h.quote.textContent.length < original.length - 3) break;
  }
  assert.equal(h.quote.dataset.crewState, 'typing');
  const partial = h.quote.textContent;
  h.window.scrollY = 1200; h.window.emit('scroll'); h.advance();
  assert.equal(h.quote.textContent, partial);
  assert.equal(h.frames.size, 0, 'offscreen work should sleep rather than finish invisibly');
  for (let i = 0; i < 80; i++) h.tick();
  assert.equal(h.quote.textContent, partial);
  h.window.scrollY = 0; h.window.emit('scroll'); h.tick();
  assert.equal(h.quote.textContent, partial, 'the paused time must not be counted as typing time');
  h.advance();
  assert.equal(h.quote.textContent, original);
  assert.equal(h.hidden().length, 0);
});

test('opening a game cancels construction without cancelling the click', async () => {
  const h = await harness(); let cancelled = false;
  h.document.emit('click', { target: { closest: () => ({ id: 'openDemo' }) }, preventDefault() { cancelled = true; } });
  assert.equal(h.hidden().length, 0);
  assert.equal(cancelled, false);
});

test('section navigation keeps building but download links reveal the complete page', async () => {
  const h = await harness();
  const click = href => h.document.emit('click', { target: { closest: selector => selector === 'a' ? { getAttribute: () => href } : null } });
  click('#yorumlar');
  assert.equal(h.window.firuConstruction.active, true);
  click('#oyunlar');
  assert.equal(h.window.firuConstruction.active, true);
  click('https://play.google.com/store/apps/details?id=com.firufirugames.app');
  assert.equal(h.window.firuConstruction.active, false);
  assert.equal(h.hidden().length, 0);
});

test('reduced motion and saved visits start with the complete site visible', async () => {
  for (const options of [{ reduced: true }, { saved: true }]) {
    const h = await harness(options);
    assert.equal(h.window.firuConstruction.active, false);
    assert.equal(h.hidden().length, 0);
    assert.equal(h.frames.size, 0);
  }
});

test('missing canvas support fails open instead of hiding the page', async () => {
  const h = await harness({ brokenCanvas: true });
  assert.equal(h.window.firuConstruction.active, false);
  assert.equal(h.hidden().length, 0);
});

test('replay replaces the current crew and motion/background changes reveal the page', async () => {
  const h = await harness();
  h.replay.emit('click'); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.created.filter(e => e.className === 'crew-hud' && !e.removed).length, 1);
  h.motion.matches = true; h.motion.emit('change');
  assert.equal(h.hidden().length, 0);
  assert.equal(h.replay.hidden, true);
  h.motion.matches = false; h.motion.emit('change'); h.replay.emit('click');
  h.document.hidden = true; h.document.emit('visibilitychange');
  assert.equal(h.hidden().length, 0);
  assert.equal(h.window.firuConstruction.active, false);
});
