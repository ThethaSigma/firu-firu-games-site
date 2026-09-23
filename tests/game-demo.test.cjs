const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness() {
  const context2d = new Proxy({ measureText: text => ({ width: text.length * 7 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }) },
    { get: (target, key) => key in target ? target[key] : () => {} });
  class Element {
    constructor() {
      this.listeners = {}; this.attrs = {}; this.style = {}; this.dataset = {};
      this.children = []; this.hidden = false; this.isConnected = true;
      this.clientWidth = 820; this.clientHeight = 580;
      const classes = new Set();
      this.classList = { add: k => classes.add(k), remove: k => classes.delete(k),
        contains: k => classes.has(k), toggle: (k, on) => on ? classes.add(k) : classes.delete(k) };
    }
    addEventListener(name, cb) { (this.listeners[name] ||= []).push(cb); }
    emit(name, event = {}) { for (const cb of this.listeners[name] || []) cb({ preventDefault() {}, stopPropagation() {}, ...event }); }
    setAttribute(k, v) { this.attrs[k] = v; }
    getAttribute(k) { return this.attrs[k] ?? null; }
    focus() { document.activeElement = this; }
    getContext() { return context2d; }
    getBoundingClientRect() { return { left: 0, width: 400, height: 700 }; }
    getClientRects() { return [1]; }
    querySelectorAll() { return []; }
  }
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const tabs = ['jump', 'pop'].map(game => { const el = get(game + '-tab'); el.dataset.game = game; return el; });
  const document = new Element();
  Object.assign(document, { documentElement: { lang: 'tr' }, body: get('body'),
    getElementById: get, createElement: () => new Element(), querySelector: get,
    querySelectorAll: selector => selector === '.game-tab' ? tabs : [] });
  get('demoProgress').children = [new Element(), new Element(), new Element()];
  class Image extends Element { constructor() { super(); this.complete = false; this.naturalWidth = 0; } }
  class Audio { cloneNode() { return this; } play() { return Promise.resolve(); } }
  const window = new Element(); window.devicePixelRatio = 1;
  const sandbox = { document, window, Image, Audio, performance: { now: () => 0 },
    localStorage: { getItem: () => null, setItem() {} },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    ResizeObserver: class { observe() {} }, console };
  let source = fs.readFileSync(path.join(__dirname, '..', 'game-demo.js'), 'utf8');
  source = source.replace(/\}\)\(\);\s*$/, `globalThis.demo = {
    startGame, pauseGame, activateOverlay, setDemoDrawer, selectGame, resizeCanvas,
    updateJump, updateBubblePaws, splitBubble, fireHarpoon, loseJumpLife, jumpAction,
    state: () => ({ game, running, paused, score, bubbleLevel, overlayMode,
      jump: jumpState, bubble: bubbleState, keys, heldFire })
  };})();`);
  vm.runInNewContext(source, sandbox);
  return { demo: sandbox.demo, get, window, document };
}

test('closed demos never start or capture page Space', () => {
  const { demo, window } = harness();
  demo.startGame(); window.emit('keydown', { code: 'Space', key: ' ' });
  assert.equal(demo.state().running, false);
  assert.equal(demo.state().heldFire, false);
});

test('pause, close, reopen and resume preserve the run and clear input', () => {
  const { demo, window } = harness();
  demo.setDemoDrawer(true); demo.startGame();
  window.emit('keydown', { key: 'ArrowRight' }); demo.updateJump(1 / 60);
  assert.equal(demo.state().keys.right, true);
  const player = demo.state().jump.player;
  const x = player.x;
  demo.setDemoDrawer(false);
  assert.equal(demo.state().paused, true); assert.equal(demo.state().keys.right, false);
  demo.setDemoDrawer(true); demo.activateOverlay();
  assert.equal(demo.state().running, true);
  assert.equal(demo.state().jump.player, player); assert.equal(player.x, x);
});

test('viewport changes never reset physics or the score', () => {
  const { demo, get } = harness(); demo.setDemoDrawer(true); demo.startGame();
  demo.updateJump(1 / 60);
  const before = JSON.stringify(demo.state().jump);
  get('gameStage').clientWidth = 320; get('gameStage').clientHeight = 400;
  demo.resizeCanvas();
  assert.equal(JSON.stringify(demo.state().jump), before);
  assert.ok(parseFloat(get('game-screen').style.width) <= 320);
  assert.ok(parseFloat(get('game-screen').style.height) <= 400);
});

test('Paw Jump starts with a guaranteed air jump pickup and requires a charge', () => {
  const { demo } = harness(); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().jump;
  assert.ok(s.items.some(item => item.type === 'air'));
  s.player.vy = 200; demo.jumpAction(); assert.equal(s.player.vy, 200);
  s.doubleJumps = 1; demo.jumpAction();
  assert.equal(s.player.vy, -560); assert.equal(s.doubleJumps, 0);
  demo.loseJumpLife(); assert.equal(s.lives, 2);
  assert.ok(Number.isFinite(s.player.y));
});

test('Paw Jump survives an extended no-input run without invalid coordinates', () => {
  const { demo } = harness(); demo.setDemoDrawer(true); demo.startGame();
  for (let i = 0; i < 1800 && demo.state().running; i++) demo.updateJump(1 / 60);
  const s = demo.state().jump;
  assert.ok(Number.isFinite(s.player.x) && Number.isFinite(s.player.y));
  assert.ok(s.platforms.length > 0); assert.ok(s.lives >= 0);
});

test('Bubble Paws walks, fires with cooldown, and stops held fire on blur', () => {
  const { demo, window } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  window.emit('keydown', { key: 'ArrowRight' });
  window.emit('keydown', { code: 'Space', key: ' ' });
  const s = demo.state().bubble; const startX = s.player.x;
  demo.fireHarpoon(); assert.equal(s.harpoons.length, 1);
  demo.updateBubblePaws(1 / 60);
  assert.ok(s.player.x > startX); assert.ok(s.player.walkTime > 0);
  assert.equal(demo.state().heldFire, true);
  window.emit('blur'); assert.equal(demo.state().heldFire, false);
  assert.equal(demo.state().paused, true);
});

function clearLevel(demo) {
  const s = demo.state().bubble;
  let safety = 0;
  while (s.bubbles.length && safety++ < 100) demo.splitBubble(0);
  assert.equal(s.bubbles.length, 0);
  for (let i = 0; i < 40; i++) demo.updateBubblePaws(1 / 60);
}

test('all three levels advance, preserving lives and score, then restart cleanly', () => {
  const { demo, get } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  demo.state().bubble.lives = 4;
  clearLevel(demo);
  assert.equal(demo.state().bubble.hits, 15);
  const score = demo.state().score;
  assert.equal(demo.state().overlayMode, 'levelClear');
  demo.activateOverlay();
  assert.equal(demo.state().bubbleLevel, 1); assert.equal(demo.state().score, score);
  assert.equal(demo.state().bubble.lives, 4); assert.equal(demo.state().bubble.obstacles.length, 1);
  clearLevel(demo); demo.activateOverlay();
  assert.equal(demo.state().bubbleLevel, 2);
  const wood = demo.state().bubble.bubbles.find(b => b.wood);
  const index = demo.state().bubble.bubbles.indexOf(wood);
  demo.splitBubble(index); assert.equal(wood.hp, 1);
  assert.ok(demo.state().bubble.bubbles.includes(wood));
  demo.splitBubble(index); assert.ok(!demo.state().bubble.bubbles.includes(wood));
  assert.ok(demo.state().bubble.bubbles.filter(b => b.wood).every(b => b.hp === 2));
  clearLevel(demo); assert.match(get('overlayTitle').textContent, /Üç bölüm/);
  demo.activateOverlay(); assert.equal(demo.state().bubbleLevel, 0);
  assert.equal(demo.state().score, 0); assert.equal(demo.state().bubble.lives, 5);
});

test('the level-two platform blocks a harpoon', () => {
  const { demo } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  clearLevel(demo); demo.activateOverlay();
  const s = demo.state().bubble;
  demo.fireHarpoon();
  for (let i = 0; i < 12; i++) demo.updateBubblePaws(1 / 60);
  assert.equal(s.harpoons.length, 0);
  assert.equal(s.bubbles.length, 2);
});
