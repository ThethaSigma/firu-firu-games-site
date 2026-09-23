const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness(seed = 12345) {
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
  const seededMath = Object.create(Math);
  seededMath.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const sandbox = { document, window, Image, Audio, performance: { now: () => 0 },
    Math: seededMath,
    localStorage: { getItem: () => null, setItem() {} },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    ResizeObserver: class { observe() {} }, console };
  let source = fs.readFileSync(path.join(__dirname, '..', 'game-demo.js'), 'utf8');
  source = source.replace(/\}\)\(\);\s*$/, `globalThis.demo = {
    startGame, pauseGame, activateOverlay, setDemoDrawer, selectGame, resizeCanvas,
    updateJump, updateBubblePaws, splitBubble, fireHarpoon, loseJumpLife, jumpAction,
    makePlatform, generateJumpPlatform, breakJumpPlatform, platformArt, loseBubbleLife, makeBubble,
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

test('fake platforms use dedicated cracked art and break once without bouncing or scoring', () => {
  const { demo } = harness(); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().jump;
  const fake = demo.makePlatform(120, 470, 90, 'fake');
  const safe = demo.makePlatform(120, 570, 90);
  s.platforms = [safe, fake]; s.items = []; s.doubleJumps = 1;
  Object.assign(s.player, { x: 135, y: 470 - s.player.h - 2, vy: 200, vx: 0 });
  assert.match(demo.platformArt(fake).src, /platform_cracked/);
  demo.updateJump(1 / 60);
  assert.equal(fake.broken, true); assert.equal(s.debris.length, 4);
  assert.ok(s.player.vy > 0); assert.equal(s.landings, 0); assert.equal(s.bonusScore, 0);
  assert.match(s.toast, /ÇİFT ZIPLA/);
  demo.breakJumpPlatform(fake); assert.equal(s.debris.length, 4);
  for (let i = 0; i < 29; i++) demo.updateJump(1 / 60);
  assert.equal(s.debris.length, 0);
  assert.ok(s.landings > 0, 'a solid platform below can still catch the player');
});

test('rising through a fake platform does not break it', () => {
  const { demo } = harness(); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().jump, fake = demo.makePlatform(120, 450, 90, 'fake');
  s.platforms.push(fake); s.items = [];
  Object.assign(s.player, { x: 135, y: 455, vy: -300, vx: 0 });
  demo.updateJump(1 / 60); assert.equal(fake.broken, false);
});

test('a solid top surface stops the fall before a lower fake, regardless of array order', () => {
  const { demo } = harness(); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().jump;
  const fake = demo.makePlatform(120, 458, 90, 'fake');
  const safe = demo.makePlatform(120, 450, 90);
  s.platforms = [fake, safe]; s.items = [];
  Object.assign(s.player, { x: 135, y: 448 - s.player.h, vy: 800, vx: 0 });
  demo.updateJump(1 / 60);
  assert.equal(fake.broken, false); assert.equal(s.landings, 1); assert.ok(s.player.vy < 0);
});

test('fake-platform generation keeps a separate solid route and never attaches pickups to decoys', () => {
  let fakeCount = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const { demo } = harness(seed); const s = demo.state().jump;
    s.altitude = 200 * 12;
    for (let i = 0; i < 40; i++) demo.generateJumpPlatform();
    for (const fake of s.platforms.filter(p => p.type === 'fake')) {
      fakeCount++;
      const safe = s.platforms.find(p => p.type !== 'fake' && p.y === fake.y);
      assert.ok(safe && safe.type !== 'moving');
      assert.ok(fake.x + fake.w + 20 <= safe.x || safe.x + safe.w + 20 <= fake.x);
      assert.ok(!s.items.some(item => item.platform === fake));
    }
  }
  assert.ok(fakeCount > 50);
});

test('empty world generation and revival always create a safe platform', () => {
  const { demo } = harness(); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().jump;
  s.platforms = []; demo.generateJumpPlatform(); assert.equal(s.platforms[0].type, 'normal');
  s.platforms = [demo.makePlatform(30, 300, 80, 'fake')];
  demo.loseJumpLife(); assert.equal(s.lives, 2);
  assert.ok(s.platforms.some(p => p.type === 'normal' && Math.abs(p.y - s.player.y - s.player.h - 3) < .01));
});

test('harpoons hit the nearest bubble rather than the first bubble in the array', () => {
  const { demo } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().bubble;
  const far = demo.makeBubble(340, 120, 3), near = demo.makeBubble(340, 250, 3);
  s.bubbles = [far, near]; s.harpoons = [{ x: 340, topY: 100, baseY: 310 }];
  demo.updateBubblePaws(1 / 60);
  assert.ok(s.bubbles.includes(far)); assert.ok(!s.bubbles.includes(near));
});

test('a platform clips the ray but does not swallow valid hits underneath it', () => {
  const { demo } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().bubble;
  const above = demo.makeBubble(340, 170, 3), below = demo.makeBubble(340, 250, 3);
  s.obstacles = [{ x: 250, y: 200, w: 180, h: 14 }];
  s.bubbles = [above, below]; s.harpoons = [{ x: 340, topY: 198, baseY: 310 }];
  demo.updateBubblePaws(1 / 60);
  assert.ok(s.bubbles.includes(above)); assert.ok(!s.bubbles.includes(below));
});

test('bubble collision handles both sides of an obstacle', () => {
  const { demo } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().bubble, o = { x: 250, y: 200, w: 180, h: 14 };
  const left = demo.makeBubble(240, 207, 3), right = demo.makeBubble(440, 207, 3);
  Object.assign(left, { vx: 200, vy: 0 }); Object.assign(right, { vx: -200, vy: 0 });
  s.bubbles = [left, right]; s.obstacles = [o];
  demo.updateBubblePaws(1 / 60);
  assert.ok(left.vx < 0 && right.vx > 0);
  assert.ok(left.x + left.r <= o.x && right.x - right.r >= o.x + o.w);
});

test('fire buffering expires and never creates phantom repeats after release', () => {
  const { demo } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().bubble; s.shootCooldown = .5;
  demo.fireHarpoon(); assert.ok(s.fireBuffer > 0);
  for (let i = 0; i < 35; i++) demo.updateBubblePaws(1 / 60);
  assert.equal(s.fireBuffer, 0); assert.equal(s.harpoons.length, 0);
});

test('keyboard and touch holds do not cancel each other', () => {
  const { demo, get, window } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  window.emit('keydown', { key: 'ArrowRight' }); get('rightBtn').emit('pointerdown'); get('rightBtn').emit('pointerup');
  assert.equal(demo.state().keys.right, true);
  window.emit('keydown', { code: 'Space', key: ' ' });
  get('actionBtn').emit('pointerdown'); get('actionBtn').emit('pointerup');
  assert.equal(demo.state().heldFire, true);
  window.emit('keyup', { code: 'Space', key: ' ' }); assert.equal(demo.state().heldFire, false);
});

test('respawn protection prevents multiple life losses in the same contact', () => {
  const { demo } = harness(); demo.selectGame('pop'); demo.setDemoDrawer(true); demo.startGame();
  const s = demo.state().bubble; s.grace = 0;
  demo.loseBubbleLife(); demo.loseBubbleLife();
  assert.equal(s.lives, 4); assert.ok(s.player.invincible > 0);
});

test('every declared game asset exists locally', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'game-demo.js'), 'utf8');
  for (const [, asset] of source.matchAll(/'(assets\/[^']+)'/g)) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', asset)), asset);
  }
});
