(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const screen = document.getElementById('game-screen');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const startButton = document.getElementById('startGame');
  const scoreline = document.getElementById('scoreline');
  const tabs = [...document.querySelectorAll('.game-tab')];
  const leftBtn = document.getElementById('leftBtn');
  const actionBtn = document.getElementById('actionBtn');
  const rightBtn = document.getElementById('rightBtn');
  const restartBtn = document.getElementById('restartBtn');
  const demoRail = document.getElementById('demoRail');
  const demoDrawer = document.getElementById('demoDrawer');
  const demoClose = document.getElementById('demoClose');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const openDemo = document.getElementById('openDemo');
  const stage = document.getElementById('gameStage');
  const pauseBtn = document.getElementById('pauseBtn');
  const soundBtn = document.getElementById('soundBtn');
  const overlayKicker = document.getElementById('overlayKicker');
  const guideTitle = document.getElementById('guideTitle');
  const guideArt = document.getElementById('guideArt');
  const guideDescription = document.getElementById('guideDescription');
  const guideTip = document.getElementById('guideTip');
  const guideAction = document.getElementById('guideAction');
  const progress = document.getElementById('demoProgress');

  const image = (src) => Object.assign(new Image(), { src });
  const art = {
    jumpBg: image('assets/paw_jump_bg.webp'),
    jumpUp: image('assets/paw_jump_hero.webp'),
    jumpDown: image('assets/paw_jump_down.webp'),
    platform: image('assets/platform_normal.webp'),
    platformGrass: image('assets/platform_grass.webp'),
    platformStone: image('assets/platform_stone.webp'),
    platformCracked: image('assets/platform_cracked.webp'),
    platformMoving: image('assets/platform_moving.webp'),
    spring: image('assets/platform_spring.webp'),
    bone: image('assets/collectible_bone.webp'),
    airJump: image('assets/powerup_air_jump.webp'),
    magnet: image('assets/powerup_magnet.webp'),
    rocket: image('assets/powerup_rocket.webp'),
    rocketActive: image('assets/rocket_active.webp'),
    wide: image('assets/wide_harpoon.webp'),
    slow: image('assets/slow_bubbles.webp'),
    bubbleBg: image('assets/bubble_paws_bg.webp'),
    bubbleIdle: image('assets/bubble_paws_firu.webp'),
    bubbleShoot: image('assets/bubble_paws_shoot.png'),
    harpoon: image('assets/harpoon.webp'),
    bubbleWalk: image('assets/bubble_walk.png'),
    woodBubble: image('assets/bubble_wood.webp')
  };

  const audioSources = {
    jump: 'assets/sfx_jump.mp3',
    spring: 'assets/sfx_spring.mp3',
    platformBreak: 'assets/sfx_platform_break.mp3',
    bone: 'assets/sfx_bone.mp3',
    doubleJump: 'assets/sfx_double_jump.mp3',
    shoot: 'assets/sfx_shoot.mp3',
    pop: 'assets/sfx_pop.mp3',
    popLarge: 'assets/sfx_pop_large.mp3',
    hit: 'assets/sfx_hit.mp3',
    clear: 'assets/sfx_clear.mp3',
    jumpPower: 'assets/powerup_collect.mp3',
    bubblePower: 'assets/power_up_collect.mp3'
  };
  const audioBank = Object.fromEntries(Object.entries(audioSources).map(([name, src]) => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    return [name, audio];
  }));

  const uiCopy = {
    tr: {
      score: 'SKOR', best: 'REKOR', start: 'Oyunu başlat', retry: 'Tekrar dene', oneMore: 'Bir tur daha',
      left: '← SOL', right: 'SAĞ →', doubleJump: 'ÇİFT ZIPLA', fire: 'ATEŞ', seconds: 'sn', combo: 'KOMBO',
      bubbles: 'BALON', level: 'BÖLÜM', timeUpTitle: 'Süre doldu',
      magnet: 'MIKNATIS', rocket: 'ROKET', wide: 'GENİŞ ZIPKIN', slow: 'YAVAŞLATMA',
      pause: 'Duraklat', resume: 'Devam et', paused: 'Küçük bir mola.',
      pauseText: 'Hazır olduğunda kaldığın yerden devam et.',
      mute: 'Sesi kapat', unmute: 'Sesi aç', next: 'Sonraki bölüm',
      complete: 'Üç bölüm, kocaman bir alkış!',
      completeText: points => `Demo tamamlandı. ${points} puan! 50 bölümün tamamı mobil uygulamada seni bekliyor.`,
      jumpKicker: 'SONSUZ TIRMANIŞ', popKicker: '3 BÖLÜMLÜK MACERA',
      jumpTip: 'Mıknatıs 5 sn kemikleri çeker; roket 2,2 sn yükseltir. Uçarken yön verebilirsin. Çatlak taşlar tutmaz; mor simge çift zıplama verir.',
      popTip: 'Düşen simgeleri topla: yavaşlatma 6 sn sürer, geniş zıpkın 8 sn boyunca ahşabı tek atışta kırar. ATEŞ tuşunu basılı tutabilirsin.',
      jumpGuide: 'Her iniş yeni bir başlangıç. Kemikleri topla, hareketli platformları takip et ve rekorunu yükselt.',
      popGuide: 'Üç farklı bölüm: balonları parçala, engellerin etrafından dolaş, ahşap balonları kır.',
      goodJump: 'TEMİZ İNİŞ!', rescue: 'BİR ŞANS DAHA',
      cracked: 'ÇATLAK PLATFORM!', saveJump: 'ÇİFT ZIPLA, KURTUL!', woodCrack: 'BİR İSABET DAHA!',
      jumpIntro: 'Sağa/sola basılı tut; Firu otomatik zıplar. Mor simge çift zıplama verir. Mıknatıs kemikleri çeker, roket yükseltir. Çatlak taşlara dikkat.',
      bubbleIntro: 'Sağa/sola basılı tut, ATEŞ ile balonları böl. Düşen güç simgelerini yakala: geniş zıpkın ahşabı kırar, yavaşlatma balonları ağırlaştırır.',
      jumpEndTitle: 'Paw Jump turu bitti',
      jumpEnd: (metres, bones) => `${metres} metreye çıktın ve ${bones} kemik topladın.`,
      clearTitle: 'Bölüm temiz!',
      clear: (hits, points) => `${hits} isabetle tüm balonları temizledin. Skor: ${points}.`,
      bubbleEndTitle: 'Bubble Paws turu bitti',
      bubbleEnd: (hits, points) => `${hits} isabet yaptın ve ${points} puan topladın.`,
      timeUp: (hits, points) => `${hits} isabetle ${points} puan topladın.`
    },
    en: {
      score: 'SCORE', best: 'BEST', start: 'Start game', retry: 'Try again', oneMore: 'One more run',
      left: '← LEFT', right: 'RIGHT →', doubleJump: 'DOUBLE JUMP', fire: 'FIRE', seconds: 's', combo: 'COMBO',
      bubbles: 'BUBBLES', level: 'LEVEL', timeUpTitle: 'Time up',
      magnet: 'MAGNET', rocket: 'ROCKET', wide: 'WIDE HARPOON', slow: 'SLOW BUBBLES',
      pause: 'Pause', resume: 'Resume', paused: 'Take a breath.',
      pauseText: 'Your adventure will be right here when you are ready.',
      mute: 'Mute sound', unmute: 'Enable sound', next: 'Next level',
      complete: 'Three levels. Well played!',
      completeText: points => `Demo complete. ${points} points! All 50 levels are waiting in the mobile app.`,
      jumpKicker: 'ENDLESS CLIMB', popKicker: 'A THREE-LEVEL ADVENTURE',
      jumpTip: 'The magnet pulls bones for 5 s; the rocket lifts you for 2.2 s. Keep steering in flight. Cracked stones break; purple pickups grant double jumps.',
      popTip: 'Catch falling pickups: slow bubbles for 6 s, or a wide harpoon for 8 s that breaks wood in one hit. Hold FIRE to keep shooting.',
      jumpGuide: 'Every landing is a new beginning. Collect bones, follow moving platforms, and beat your best.',
      popGuide: 'Three different levels: split bubbles, move around obstacles, and break wooden bubbles.',
      goodJump: 'PERFECT LANDING!', rescue: 'ONE MORE CHANCE',
      cracked: 'CRACKED PLATFORM!', saveJump: 'DOUBLE JUMP TO RECOVER!', woodCrack: 'ONE MORE HIT!',
      jumpIntro: 'Hold left/right; Firu jumps automatically. Purple pickups grant double jumps. Magnets pull bones; rockets boost you upward. Watch for cracked stones.',
      bubbleIntro: 'Hold left/right and FIRE to split bubbles. Catch falling powers: wide harpoons break wood; slow pickups reduce bubble speed.',
      jumpEndTitle: 'Paw Jump run over',
      jumpEnd: (metres, bones) => `You climbed ${metres} metres and collected ${bones} bones.`,
      clearTitle: 'Level clear!',
      clear: (hits, points) => `You cleared every bubble in ${hits} hits. Score: ${points}.`,
      bubbleEndTitle: 'Bubble Paws run over',
      bubbleEnd: (hits, points) => `You made ${hits} hits and scored ${points} points.`,
      timeUp: (hits, points) => `You made ${hits} hits and scored ${points} points.`
    }
  };

  const copy = () => uiCopy[document.documentElement.lang === 'en' ? 'en' : 'tr'];
  // Keep simulation coordinates independent of viewport and device-pixel ratio.
  const width = () => game === 'jump' ? 400 : 680;
  const height = () => game === 'jump' ? 700 : 400;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const FIXED_STEP = 1 / 60;
  const POWER_UPS = {
    magnet: { duration: 5, color: '#f6a8da' },
    rocket: { duration: 2.2, color: '#ffcc71' },
    wide: { duration: 8, color: '#c6a6ff' },
    slow: { duration: 6, color: '#90edee' }
  };
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;

  let game = 'jump';
  let running = false;
  let animationFrame = 0;
  let lastFrame = 0;
  let accumulator = 0;
  let score = 0;
  let paused = false;
  let overlayMode = 'intro';
  let bubbleLevel = 0;
  let returnFocus = null;
  let muted = false;
  try { muted = localStorage.getItem('firu-demo-muted') === 'true'; } catch (_) {}
  let heldFire = false;
  let keyboardFire = false, pointerFire = false;
  const bestScores = {};
  const trimCache = new WeakMap();
  let keys = { left: false, right: false, buttonLeft: false, buttonRight: false, screenLeft: false, screenRight: false };

  function steer() {
    return Number(keys.right || keys.buttonRight || keys.screenRight) - Number(keys.left || keys.buttonLeft || keys.screenLeft);
  }

  function syncJumpAction() {
    const charges = jumpState ? jumpState.doubleJumps : 0;
    actionBtn.textContent = `${copy().doubleJump} ×${charges}`;
    actionBtn.style.opacity = game === 'jump' && (charges <= 0 || jumpState?.effects.rocket > 0) ? '.42' : '1';
  }
  let jumpState = null;
  let bubbleState = null;

  // Interpolate only the presentation. Collision/score simulation stays at 60 Hz.
  function rememberMotion(entity) {
    entity.previous = { x: entity.x, y: entity.y, topY: entity.topY, rotation: entity.rotation, squash: entity.squash };
  }

  function renderMotion(entity, alpha = 1) {
    if (!entity.previous || alpha >= 1) return entity;
    const view = { ...entity };
    for (const key of ['x', 'y', 'topY', 'rotation', 'squash']) {
      const before = entity.previous[key], now = entity[key];
      if (Number.isFinite(before) && Number.isFinite(now)) view[key] = before + (now - before) * alpha;
    }
    return view;
  }

  function tickEffects(state, dt) {
    for (const name of Object.keys(state.effects)) state.effects[name] = Math.max(0, state.effects[name] - dt);
  }

  function activatePower(state, name, x, y) {
    const power = POWER_UPS[name];
    if (!power) return;
    state.effects[name] = power.duration; // Refresh, never stack to an unlimited duration.
    spawnParticles(state.particles, x, y, [power.color, '#ffffff'], 16, 100);
    state.rings.push({ x, y, radius: 16, life: .45, maxLife: .45, color: power.color });
    if (game === 'jump') {
      state.toast = copy()[name]; state.toastTime = 1.3;
      if (name === 'rocket') { state.player.vy = -1100; state.player.squash = -.15; }
      syncJumpAction();
    } else addFloatingScore(state, x, y - 15, copy()[name], power.color);
    playSfx(game === 'jump' ? 'jumpPower' : 'bubblePower', .22);
  }

  function drawPowerTimers(state, y) {
    let x = 10;
    for (const [name, remaining] of Object.entries(state.effects)) {
      if (remaining <= 0) continue;
      const power = POWER_UPS[name], w = game === 'jump' ? 184 : 174;
      ctx.save();
      ctx.fillStyle = '#101d35ed'; ctx.beginPath(); ctx.roundRect(x, y, w, 32, 10); ctx.fill();
      drawSprite(art[name], x + 5, y + 3, 25, 25);
      ctx.font = '800 11px Nunito, sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText(`${copy()[name]} ${Math.ceil(remaining)}${copy().seconds}`, x + 35, y + 17);
      ctx.fillStyle = '#ffffff26'; ctx.fillRect(x + 35, y + 23, w - 45, 3);
      ctx.fillStyle = power.color; ctx.fillRect(x + 35, y + 23, (w - 45) * remaining / power.duration, 3);
      ctx.restore(); x += w + 7;
    }
  }

  function playSfx(name, volume = .18, playbackRate = 1) {
    const source = audioBank[name];
    if (!source || muted) return;
    const sound = source.cloneNode();
    sound.volume = volume;
    sound.playbackRate = playbackRate;
    sound.play().catch(() => {});
  }

  function bestKey() {
    return game === 'jump' ? 'firu-web-best-jump-v2' : 'firu-web-best-bubble-v2';
  }

  function resizeCanvas() {
    const availableW = stage.clientWidth || 400;
    const availableH = stage.clientHeight || 600;
    const scale = Math.max(.1, Math.min(availableW / width(), availableH / height()));
    const cssW = Math.floor(width() * scale), cssH = Math.floor(height() * scale);
    screen.style.width = cssW + 'px';
    screen.style.height = cssH + 'px';
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(cssW * ratio));
    canvas.height = Math.max(1, Math.round(cssH * ratio));
    ctx.setTransform(canvas.width / width(), 0, 0, canvas.height / height(), 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    draw();
  }

  function drawCharacter(img, x, y, w, h, flip = false, alpha = 1, frame = null) {
    if (!img.complete || !img.naturalWidth) return;
    const frames = img === art.bubbleWalk ? 6 : 1;
    let rects = trimCache.get(img);
    if (!rects) {
      const scan = document.createElement('canvas'), frameW = img.naturalWidth / frames;
      scan.width = img.naturalWidth; scan.height = img.naturalHeight;
      const sc = scan.getContext('2d', { willReadFrequently: true });
      sc.drawImage(img, 0, 0);
      const data = sc.getImageData(0, 0, scan.width, scan.height).data;
      rects = [];
      for (let f = 0; f < frames; f++) {
        let minX = frameW, minY = scan.height, maxX = 0, maxY = 0;
        for (let py = 0; py < scan.height; py++) for (let px = 0; px < frameW; px++) {
          if (data[(py * scan.width + px + f * frameW) * 4 + 3] < 30) continue;
          minX = Math.min(minX, px); minY = Math.min(minY, py);
          maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
        }
        rects.push({ x: f * frameW + minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
      }
      trimCache.set(img, rects);
    }
    const crop = rects[frame === null ? 0 : frame % frames];
    if (crop.w <= 0 || crop.h <= 0) return;
    const scale = Math.min(w / crop.w, h / crop.h), dw = crop.w * scale, dh = crop.h * scale;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.translate(x + w / 2, y + h);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, -dw / 2, -dh, dw, dh);
    ctx.restore();
  }

  function drawCover(img, x, y, w, h) {
    if (!img.complete || !img.naturalWidth) return false;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
    return true;
  }

  function drawSprite(img, x, y, w, h, flip = false, alpha = 1) {
    if (!img.complete || !img.naturalWidth) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
    ctx.restore();
    return true;
  }

  function setOverlay(title, text, button = copy().start) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startButton.textContent = button;
    overlay.hidden = false;
    pauseBtn.disabled = !running && !paused;
    overlayKicker.textContent = game === 'jump' ? copy().jumpKicker : `${copy().level} ${bubbleLevel + 1} / 3`;
  }

  function updateScoreline(extra = '') {
    const key = bestKey();
    if (!(key in bestScores)) {
      try { bestScores[key] = Number(localStorage.getItem(key)) || 0; } catch (_) { bestScores[key] = 0; }
    }
    if (score > bestScores[key]) {
      bestScores[key] = score;
      try { localStorage.setItem(key, String(score)); } catch (_) {}
    }
    const text = `${copy().score} ${String(score).padStart(3, '0')} · ${copy().best} ${String(bestScores[key]).padStart(3, '0')}${extra}`;
    if (scoreline.textContent !== text) scoreline.textContent = text;
  }

  function drawHudPill(text, x, y, color = '#11162e') {
    ctx.font = '800 13px ui-monospace, monospace';
    const w = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(5,9,22,.20)';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 3, w, 29, 11);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 29, 11);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x + 10, y + 19);
    return w;
  }

  function spawnParticles(list, x, y, colors, count = 8, speed = 95) {
    const palette = Array.isArray(colors) ? colors : [colors];
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (.45 + Math.random() * .8);
      list.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - speed * .22,
        size: 2.5 + Math.random() * 4,
        color: palette[i % palette.length],
        life: .36 + Math.random() * .42,
        maxLife: .78,
        gravity: 220
      });
    }
  }

  function updateParticles(list, dt) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const particle = list[i];
      particle.life -= dt;
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.life <= 0) list.splice(i, 1);
    }
  }

  function drawParticles(list, alpha = 1) {
    for (const current of list) {
      const particle = renderMotion(current, alpha);
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function updateRings(list, dt) {
    for (const ring of list) { ring.life -= dt; ring.radius += dt * 75; }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
  }

  function drawRings(list, alpha = 1) {
    ctx.save(); ctx.lineWidth = 2;
    for (const current of list) {
      const ring = renderMotion(current, alpha);
      ctx.globalAlpha = clamp(ring.life / ring.maxLife, 0, 1);
      ctx.strokeStyle = ring.color; ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, ring.radius, ring.radius * .38, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  // Paw Jump: mobile-game physics, portrait camera, real tuning.
  const JUMP_TUNING = { gravity: 980, normalSpeed: 580, minGap: 84, maxGap: 120, safeGapRatio: .72 };

  function jumpScale() {
    return width() / 400;
  }

  function makePlatform(x, y, w, type = 'normal', variant = 'grass') {
    const scale = jumpScale();
    return {
      x, y, originX: x, w, h: 30 * scale, type, variant,
      phase: 0,
      range: 70 * scale,
      landedPulse: 0, broken: false
    };
  }

  function addJumpItem(platform, forcedType = null) {
    if (platform.type === 'fake' || platform.broken) return;
    const roll = Math.random();
    const type = forcedType || (roll < .04 ? 'magnet' : roll < .08 ? 'rocket' : roll < .18 ? 'air' : roll < .52 ? 'bone' : null);
    if (!type) return;
    const size = type === 'bone' ? 24 : 36;
    jumpState.items.push({ type, platform, x: platform.x + platform.w / 2 - size / 2, y: platform.y - size - 9, w: size, h: size, phase: Math.random() * 6 });
  }

  function generateJumpPlatform() {
    const s = jumpState;
    const scale = jumpScale();
    const safe = s.platforms.filter(p => p.type !== 'fake' && !p.broken);
    if (!safe.length) {
      s.platforms.push(makePlatform(width() / 2 - 48, height() - 100, 96));
      return;
    }
    const top = safe.reduce((a, b) => a.y < b.y ? a : b);
    const metres = s.altitude / (12 * scale);
    const jumpHeight = JUMP_TUNING.normalSpeed ** 2 / (2 * JUMP_TUNING.gravity);
    const safeGap = jumpHeight * JUMP_TUNING.safeGapRatio;
    const gap = Math.min(clamp(JUMP_TUNING.minGap + metres / 95, JUMP_TUNING.minGap, JUMP_TUNING.maxGap)
      * (.96 + Math.random() * .08), safeGap) * scale;
    const platformWidth = (56 + Math.random() * 34) * scale;
    const reach = (metres < 40 ? 125 : 150) * scale;
    const x = clamp(top.originX + (Math.random() * 2 - 1) * reach, 8, width() - platformWidth - 8);
    const roll = Math.random();
    const springChance = metres > 20 ? .12 : .06;
    const movingChance = metres > 75 ? .15 : 0;
    let type = 'normal';
    if (roll < springChance) type = 'spring';
    else if (roll < springChance + movingChance) type = 'moving';
    // Fragile platforms are optional decoys; the mandatory route stays solid.
    const variant = type === 'fake' || metres > 160 ? 'stone' : Math.random() < .68 ? 'grass' : 'default';
    const platform = makePlatform(x, top.y - gap, platformWidth, type, variant);
    if (type === 'moving') platform.range = 40 * scale;
    s.platforms.push(platform);
    addJumpItem(platform);
    if (roll > .75 && metres > 110 && type !== 'moving' && top.type !== 'moving') {
      const separation = platformWidth + 30 * scale;
      const candidates = [x - separation, x + separation].filter(candidate =>
        candidate >= 8 && candidate + platformWidth <= width() - 8 &&
        !s.platforms.some(other => Math.abs(other.y - platform.y) < 48 * scale &&
          candidate < other.x + other.w + 20 && candidate + platformWidth > other.x - 20));
      if (candidates.length) s.platforms.push(makePlatform(candidates[0], platform.y, platformWidth, 'fake', 'cracked'));
    }
  }

  function breakJumpPlatform(platform) {
    if (platform.broken) return;
    const s = jumpState;
    platform.broken = true;
    // Physics stops immediately; only the detached visual fragments remain.
    for (let i = 0; i < 4; i++) s.debris.push({
      x: platform.x + platform.w * (i + .5) / 4, y: platform.y + 8,
      w: platform.w / 4, h: platform.w / 3,
      vx: (i - 1.5) * 48, vy: -45 - Math.random() * 35,
      angle: 0, spin: (i - 1.5) * 2.5, life: .45, slice: i
    });
    s.items = s.items.filter(item => item.platform !== platform);
    s.combo = 0; s.shake = 3;
    s.toast = s.doubleJumps > 0 ? copy().saveJump : copy().cracked; s.toastTime = 1.25;
    spawnParticles(s.particles, platform.x + platform.w / 2, platform.y + 8, ['#9fbec8', '#e4f4f7'], 9, 75);
    playSfx('platformBreak', .22);
  }

  function initJump() {
    const w = width();
    const h = height();
    const scale = jumpScale();
    score = 0;
    const platforms = [
      makePlatform(w * .38, h - 38 * scale, 90 * scale),
      makePlatform(w * .23, h - 130 * scale, 88 * scale),
      makePlatform(w * .46, h - 224 * scale, 82 * scale),
      makePlatform(w * .23, h - 315 * scale, 78 * scale, 'spring'),
      makePlatform(w * .52, h - 410 * scale, 74 * scale)
    ];
    jumpState = {
      player: {
        x: w * .49 - 28.6 * scale, y: h - 105 * scale,
        w: 57.2 * scale, h: 57.2 * scale,
        vx: 0, vy: -JUMP_TUNING.normalSpeed * scale, facing: 1, invincible: 0,
        squash: 0, rotation: 0
      },
      platforms,
      items: [], particles: [], debris: [], rings: [], altitude: 0, bones: 0, landings: 0,
      bonusScore: 0, lives: 3, doubleJumps: 0, combo: 0, shake: 0, elapsed: 0, toast: '', toastTime: 0, trail: [],
      effects: { magnet: 0, rocket: 0 }
    };
    // A short demo should introduce its powers without depending on lucky rolls.
    addJumpItem(platforms[1], 'air');
    addJumpItem(platforms[2], 'magnet');
    addJumpItem(platforms[3], 'bone');
    addJumpItem(platforms[4], 'rocket');
    while (jumpState.platforms.reduce((min, p) => Math.min(min, p.y), h) > -110) generateJumpPlatform();
    syncJumpAction();
    updateScoreline(' · 0 m');
    drawJump();
  }

  function jumpAction() {
    if (!running || game !== 'jump' || !jumpState) return;
    const s = jumpState;
    const p = s.player;
    if (s.doubleJumps <= 0 || s.effects.rocket > 0) return;
    p.vy = -JUMP_TUNING.normalSpeed * jumpScale();
    p.squash = -.24;
    s.doubleJumps -= 1;
    syncJumpAction();
    spawnParticles(s.particles, p.x + p.w / 2, p.y + p.h * .78, ['#8cf4ff', '#ffffff', '#8a7dff'], 13, 120 * jumpScale());
    playSfx('doubleJump', .22);
  }

  function loseJumpLife() {
    const s = jumpState;
    s.effects.magnet = s.effects.rocket = 0;
    syncJumpAction();
    s.lives -= 1;
    s.shake = 10;
    playSfx('hit', .2);
    s.toast = copy().rescue; s.toastTime = 1.8;
    if (s.lives <= 0) {
      running = false;
      overlayMode = 'jumpEnd';
      setOverlay(copy().jumpEndTitle, copy().jumpEnd(Math.floor(s.altitude / (12 * jumpScale())), s.bones), copy().retry);
      return;
    }
    let landing = s.platforms
      .filter(platform => platform.type !== 'fake' && !platform.broken && platform.y > height() * .48 && platform.y < height() - 65)
      .sort((a, b) => b.y - a.y)[0];
    if (!landing) {
      landing = makePlatform(width() / 2 - 48, height() * .72, 96);
      s.platforms.push(landing);
    }
    s.player.x = landing.x + landing.w / 2 - s.player.w / 2;
    s.player.y = landing.y - s.player.h - 3;
    s.player.vx = 0;
    s.player.vy = -JUMP_TUNING.normalSpeed * jumpScale();
    s.player.invincible = 1.2;
    rememberMotion(s.player); // Respawns are teleports, not a cross-screen tween.
  }

  function updateJump(dt) {
    const s = jumpState;
    const p = s.player;
    const scale = jumpScale();
    rememberMotion(p);
    for (const entity of [...s.platforms, ...s.items, ...s.particles, ...s.debris, ...s.rings, ...s.trail]) rememberMotion(entity);
    const wasRocket = s.effects.rocket > 0;
    tickEffects(s, dt);
    if (wasRocket && s.effects.rocket <= 0) { p.vy = -350 * scale; syncJumpAction(); }
    const direction = steer();
    const target = direction * 260 * scale;
    const reversing = direction && p.vx !== 0 && Math.sign(target) !== Math.sign(p.vx);
    const acceleration = (reversing ? 2600 : 1800) * scale;
    if (direction) p.vx += clamp(target - p.vx, -acceleration * dt, acceleration * dt);
    else p.vx *= Math.exp(-8 * dt);
    if (Math.abs(p.vx) < .25 * scale) p.vx = 0;
    if (Math.abs(p.vx) > 8 * scale) p.facing = Math.sign(p.vx);

    const oldBottom = p.y + p.h;
    const oldX = p.x;
    p.x += p.vx * dt;
    p.vy = s.effects.rocket > 0 ? -1100 * scale : Math.min(900 * scale, p.vy + JUMP_TUNING.gravity * scale * dt);
    p.y += p.vy * dt;
    p.invincible = Math.max(0, p.invincible - dt);
    p.squash += (0 - p.squash) * Math.min(1, dt * 10);
    p.rotation += ((p.vx / (260 * scale)) * .105 - p.rotation) * Math.min(1, dt * 12);
    s.elapsed += dt;
    s.toastTime = Math.max(0, s.toastTime - dt);
    if (p.vy < -600) s.trail.push({ x: p.x + p.w / 2, y: p.y + p.h * .85, life: .25 });
    s.trail.forEach(point => { point.life -= dt; });
    s.trail = s.trail.filter(point => point.life > 0).slice(-18);
    s.shake = Math.max(0, s.shake - dt * 34);
    for (const piece of s.debris) {
      piece.life -= dt; piece.vy += 750 * dt;
      piece.x += piece.vx * dt; piece.y += piece.vy * dt; piece.angle += piece.spin * dt;
    }
    s.debris = s.debris.filter(piece => piece.life > 0);
    updateRings(s.rings, dt);

    if (p.x + p.w < 0) { p.x = width(); rememberMotion(p); }
    if (p.x > width()) { p.x = -p.w; rememberMotion(p); }

    for (const platform of s.platforms) {
      platform.landedPulse = Math.max(0, platform.landedPulse - dt * 4.5);
      if (platform.type === 'moving') {
        platform.phase += (70 * scale / platform.range) * dt;
        platform.x = clamp(platform.originX + Math.sin(platform.phase) * platform.range, 5, width() - platform.w - 5);
      }
    }
    // Resolve the first crossed top surface, not insertion order in the generator.
    const newBottom = p.y + p.h;
    const candidates = s.platforms.filter(platform => !platform.broken && p.vy > 0 &&
      oldBottom <= platform.y + 2 * scale && newBottom >= platform.y).sort((a, b) => a.y - b.y);
    for (const platform of candidates) {
      const t = clamp((platform.y - oldBottom) / Math.max(.001, newBottom - oldBottom), 0, 1);
      const crossingX = Math.abs(p.x - oldX) > width() / 2 ? p.x : oldX + (p.x - oldX) * t;
      if (crossingX + p.w * .63 > platform.x + platform.w * .08 && crossingX + p.w * .37 < platform.x + platform.w * .92) {
        if (platform.type === 'fake') {
          breakJumpPlatform(platform);
          continue;
        }
        p.y = platform.y - p.h;
        p.vy = (platform.type === 'spring' ? -980 : -JUMP_TUNING.normalSpeed) * scale;
        p.squash = .26;
        platform.landedPulse = 1;
        s.rings.push({ x: p.x + p.w / 2, y: platform.y, radius: 13, life: .32, maxLife: .32, color: platform.type === 'spring' ? '#ffd36a' : '#e4fff5' });
        s.landings += 1;
        const centered = Math.abs((p.x + p.w / 2) - (platform.x + platform.w / 2)) < platform.w * .22;
        s.combo = centered ? Math.min(15, s.combo + 1) : 0;
        if (s.combo >= 3) { s.toast = copy().goodJump; s.toastTime = .7; }
        const multiplier = 1 + Math.min(3, Math.floor(s.combo / 5)) * .5;
        s.bonusScore += Math.round(10 * multiplier);
        spawnParticles(s.particles, p.x + p.w / 2, platform.y, ['#f8df7b', '#ffffff', '#76e4a3'], platform.type === 'spring' ? 12 : 7, 70 * scale);
        playSfx(platform.type === 'spring' ? 'spring' : 'jump', platform.type === 'spring' ? .22 : .10, .96 + Math.random() * .08);
        break;
      }
    }
    s.platforms = s.platforms.filter(platform => !platform.broken);

    for (let i = s.items.length - 1; i >= 0; i -= 1) {
      const item = s.items[i];
      item.phase += dt * 2.4;
      if (item.platform) item.x = item.platform.x + item.platform.w / 2 - item.w / 2;
      if (item.type === 'bone' && s.effects.magnet > 0) {
        const dx = p.x + p.w / 2 - item.x - item.w / 2;
        const dy = p.y + p.h / 2 - item.y - item.h / 2;
        const distance = Math.hypot(dx, dy);
        if (distance < 140 * scale) {
          item.platform = null;
          const pull = Math.min(1, 320 * scale * dt / Math.max(1, distance));
          item.x += dx * pull; item.y += dy * pull;
        }
      }
      const pickup = { x: item.x + item.w * .15, y: item.y + item.h * .15, w: item.w * .7, h: item.h * .7 };
      const playerPickup = { x: p.x + p.w * .25, y: p.y + p.h * .2, w: p.w * .5, h: p.h * .68 };
      if (overlaps(playerPickup, pickup)) {
        if (item.type === 'bone') {
          s.bones += 1;
          s.bonusScore += 25;
          spawnParticles(s.particles, item.x + item.w / 2, item.y + item.h / 2, ['#ffd166', '#fff2a8'], 10, 90 * scale);
          playSfx('bone', .18);
        } else if (item.type === 'air') {
          s.doubleJumps = Math.min(3, s.doubleJumps + 1);
          s.toast = copy().doubleJump + ' +1'; s.toastTime = 1.4;
          syncJumpAction();
          spawnParticles(s.particles, item.x + item.w / 2, item.y + item.h / 2, ['#78f2ff', '#9c8cff', '#ffffff'], 15, 110 * scale);
          playSfx('doubleJump', .20);
        } else {
          activatePower(s, item.type, item.x + item.w / 2, item.y + item.h / 2);
        }
        s.items.splice(i, 1);
      }
    }

    const metres = s.altitude / (12 * scale);
    const pressureSpeed = (55 + clamp(metres / 4000, 0, 1) * 155) * scale * Math.min(1, s.elapsed / 2);
    let cameraShift = pressureSpeed * dt;
    const followLine = height() * .50;
    // Smooth pursuit, with a quicker catch-up during springs and rocket flight.
    const followTime = s.effects.rocket > 0 || p.y < height() * .42 ? .065 : .14;
    if (p.y < followLine) cameraShift += (followLine - p.y) * (1 - Math.exp(-dt / followTime));
    if (cameraShift > 0) {
      p.y += cameraShift;
      s.altitude += cameraShift;
      s.platforms.forEach(platform => { platform.y += cameraShift; });
      s.items.forEach(item => { item.y += cameraShift; });
      s.particles.forEach(particle => { particle.y += cameraShift; });
      s.trail.forEach(point => { point.y += cameraShift; });
      s.debris.forEach(piece => { piece.y += cameraShift; });
      s.rings.forEach(ring => { ring.y += cameraShift; });
    }

    s.platforms = s.platforms.filter(platform => platform.y < height() + 80 * scale);
    s.items = s.items.filter(item => item.y < height() + 70 * scale);
    while (s.platforms.reduce((min, platform) => Math.min(min, platform.y), height()) > -110 * scale) generateJumpPlatform();
    updateParticles(s.particles, dt);
    if (p.y > height() + 55 * scale) loseJumpLife();

    score = Math.floor(s.altitude / (12 * scale)) + s.bonusScore;
    updateScoreline(` · ${Math.floor(s.altitude / (12 * scale))} m`);
  }

  function platformArt(platform) {
    if (platform.type === 'fake') return art.platformCracked;
    if (platform.type === 'spring') return art.spring;
    if (platform.type === 'moving') return art.platformMoving;
    if (platform.variant === 'stone') return art.platformStone;
    if (platform.variant === 'grass') return art.platformGrass;
    return art.platform;
  }

  function drawJumpPlayer(player) {
    const rocket = jumpState.effects.rocket > 0;
    const sprite = rocket ? art.rocketActive : player.vy < 35 * jumpScale() ? art.jumpUp : art.jumpDown;
    const alpha = player.invincible > 0 && Math.floor(player.invincible * 12) % 2 ? .32 : 1;
    const stretch = clamp(-player.vy / (900 * jumpScale()), -.45, .45);
    const scaleX = 1 - stretch * .08 + player.squash * .22;
    const scaleY = 1 + stretch * .10 - player.squash * .18;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.rotate(player.rotation * player.facing);
    ctx.scale(player.facing < 0 ? -scaleX : scaleX, scaleY);
    if (sprite.complete && sprite.naturalWidth) drawCharacter(sprite, -player.w / 2, -player.h / 2, player.w, player.h);
    else {
      ctx.fillStyle = '#c88945';
      ctx.beginPath();
      ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 14);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawJump(alpha = 1) {
    const w = width();
    const h = height();
    const s = jumpState;
    ctx.clearRect(0, 0, w, h);
    if (!drawCover(art.jumpBg, 0, 0, w, h)) { ctx.fillStyle = '#55c5ed'; ctx.fillRect(0, 0, w, h); }
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, 'rgba(35,66,155,.10)');
    sky.addColorStop(1, 'rgba(28,103,146,.04)');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    if (!s) return;

    const shakeX = reducedMotion ? 0 : Math.sin((s.elapsed + alpha * FIXED_STEP) * 113) * s.shake * .5;
    const shakeY = reducedMotion ? 0 : Math.cos((s.elapsed + alpha * FIXED_STEP) * 151) * s.shake * .5;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    for (const current of s.platforms) {
      const platform = renderMotion(current, alpha);
      const pulse = platform.landedPulse * 3 * jumpScale();
      ctx.fillStyle = 'rgba(7,28,48,.20)';
      ctx.beginPath();
      ctx.ellipse(platform.x + platform.w / 2, platform.y + platform.h + 5, platform.w * .43, 5 * jumpScale(), 0, 0, Math.PI * 2);
      ctx.fill();
      const visualHeight = platform.type === 'fake' ? platform.w / 3 : platform.h + 13 - pulse;
      if (!drawSprite(platformArt(platform), platform.x, platform.y - 6 + pulse, platform.w, visualHeight)) {
        ctx.fillStyle = platform.type === 'spring' ? '#ffcf5a' : platform.type === 'fake' ? '#8d97a8' : '#54c56f';
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      }
      if (platform.type === 'fake') {
        ctx.save(); ctx.fillStyle = '#ffe0a1'; ctx.strokeStyle = '#594335'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(platform.x + platform.w / 2, platform.y - 19);
        ctx.lineTo(platform.x + platform.w / 2 + 6, platform.y - 9);
        ctx.lineTo(platform.x + platform.w / 2 - 6, platform.y - 9);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#594335'; ctx.font = '900 8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('!', platform.x + platform.w / 2, platform.y - 10); ctx.restore();
      }
    }
    for (const current of s.debris) {
      const piece = renderMotion(current, alpha);
      ctx.save(); ctx.translate(piece.x, piece.y); ctx.rotate(piece.angle);
      ctx.globalAlpha = Math.min(1, piece.life / .2);
      if (art.platformCracked.complete && art.platformCracked.naturalWidth) {
        const sw = art.platformCracked.naturalWidth / 4;
        ctx.drawImage(art.platformCracked, piece.slice * sw, 0, sw, art.platformCracked.naturalHeight, -piece.w / 2, -piece.h / 2, piece.w, piece.h);
      } else { ctx.fillStyle = '#9fbec8'; ctx.fillRect(-piece.w / 2, -5, piece.w, 10); }
      ctx.restore();
    }
    drawRings(s.rings, alpha);
    for (const current of s.items) {
      const item = renderMotion(current, alpha);
      const bob = Math.sin(item.phase * 3) * 3 * jumpScale();
      ctx.fillStyle = item.type === 'bone' ? 'rgba(255,218,104,.24)' : 'rgba(114,232,255,.25)';
      ctx.beginPath();
      ctx.arc(item.x + item.w / 2, item.y + item.h / 2 + bob, item.w * .68, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(item.type === 'bone' ? art.bone : item.type === 'air' ? art.airJump : art[item.type], item.x, item.y + bob, item.w, item.h);
    }
    for (const current of s.trail) {
      const point = renderMotion(current, alpha);
      ctx.fillStyle = `rgba(255,220,135,${point.life * 1.2})`;
      ctx.beginPath(); ctx.arc(point.x, point.y, 14 * point.life / .25, 0, Math.PI * 2); ctx.fill();
    }
    drawParticles(s.particles, alpha);
    const player = renderMotion(s.player, alpha);
    if (s.effects.magnet > 0) {
      ctx.save(); ctx.strokeStyle = '#ffa4dd'; ctx.globalAlpha = .35; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(player.x + player.w / 2, player.y + player.h / 2, 46 + Math.sin(s.elapsed * 5) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    drawJumpPlayer(player);
    ctx.restore();

    let hudX = 10;
    hudX += drawHudPill(`♥ ${s.lives}`, hudX, 10, '#d74755') + 6;
    hudX += drawHudPill(`${Math.floor(s.altitude / (12 * jumpScale()))} m`, hudX, 10, '#174c72') + 6;
    if (s.toastTime > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, s.toastTime * 2); ctx.font = '900 17px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#193660'; ctx.lineWidth = 4; ctx.strokeText(s.toast, w / 2, 122); ctx.fillText(s.toast, w / 2, 122); ctx.restore();
    }
    drawHudPill('◆ ' + s.bones, w - 68, 10, '#8a641f');
    drawPowerTimers(s, 46);
    if (s.combo >= 5) drawHudPill(`${copy().combo} ×${1 + Math.min(3, Math.floor(s.combo / 5)) * .5}`, 10, 82, '#7d4cc4');
  }

  // Bubble Paws: faithful level-one split chain and tuning.
  const BUBBLE_SPECS = [
    { name: 'large', radius: 36, bounce: 528, score: 120 },
    { name: 'medium', radius: 24, bounce: 452, score: 180 },
    { name: 'small', radius: 15, bounce: 374, score: 260 },
    { name: 'mini', radius: 9, bounce: 320, score: 340 }
  ];
  const BUBBLE_COLORS = ['#ff6b8a', '#53c7e8', '#ffd166', '#7ed957', '#a78bfa', '#ff9f43', '#54e6c0'];

  function bubbleScale() {
    return Math.min(width() / 680, height() / 400);
  }

  function makeBubble(x, y, stage, direction = 1, colorIndex = Math.floor(Math.random() * BUBBLE_COLORS.length)) {
    const scale = bubbleScale();
    const spec = BUBBLE_SPECS[stage];
    return {
      x, y, r: spec.radius * scale, stage,
      vx: direction * (34 + stage * 8) * scale,
      vy: -spec.bounce * .64 * scale,
      colorIndex, spin: Math.random() * 6, impact: 0, age: 0
    };
  }

  // Spawn positions, time limits and the platform match the mobile game's first three levels.
  const LEVELS = [
    { time: 58, spawns: [[.32, 0, 1, false]], obstacles: [] },
    { time: 58, spawns: [[.22, 1, 1, false], [.78, 1, -1, false]], obstacles: [{ x: .38 * 680, y: .5 * 400, w: .24 * 680, h: .035 * 400 }] },
    { time: 62, spawns: [[.24, 0, 1, false], [.72, 1, -1, true]], obstacles: [] }
  ];

  function initBubblePaws(keepProgress = false) {
    const w = width();
    const h = height();
    const scale = bubbleScale();
    const previousLives = bubbleState?.lives || 5;
    if (!keepProgress) score = 0;
    const level = LEVELS[bubbleLevel];
    bubbleState = {
      player: {
        x: w / 2 - 27 * scale, y: h - (32 + 62) * scale,
        w: 54 * scale, h: 62 * scale,
        vx: 0, facing: 1, invincible: 0, shootPose: 0, walkTime: 0, walkBlend: 0, shootBlend: 0
      },
      bubbles: level.spawns.map(([x, stage, dir, wood], i) => Object.assign(makeBubble(w * x, (82 + i * 25) * scale, stage, dir, i), { wood, hp: wood ? 2 : 1 })),
      obstacles: level.obstacles.map(o => ({ ...o })),
      harpoons: [], particles: [], floats: [], rings: [], lives: keepProgress ? previousLives : 5, remaining: level.time,
      shootCooldown: 0, hits: 0, combo: 0, comboTimer: 0,
      grace: 1.6, shake: 0, flash: 0, clearDelay: 0, elapsed: 0, fireBuffer: 0,
      effects: { wide: 0, slow: 0 }, pickups: [], pops: 0, powerDrops: 0, nextPowerAt: 1
    };
    actionBtn.textContent = copy().fire;
    actionBtn.style.opacity = '1';
    updateScoreline(` · ${level.time} ${copy().seconds}`);
    updateGuide();
    drawBubblePaws();
  }

  function fireHarpoon(bufferInput = true) {
    if (!running || game !== 'pop' || !bubbleState) return;
    const s = bubbleState;
    if (s.clearDelay > 0) return;
    if (s.shootCooldown > 0 || s.harpoons.length >= 1) { if (bufferInput) s.fireBuffer = .14; return; }
    s.fireBuffer = 0;
    const p = s.player;
    const baseY = p.y + 3 * bubbleScale();
    const wide = s.effects.wide > 0;
    s.harpoons.push({ x: p.x + p.w / 2, topY: baseY - 9 * bubbleScale(), baseY, radius: wide ? 12 : 6, damage: wide ? 2 : 1, wide });
    s.shootCooldown = .22;
    p.shootPose = .18;
    spawnParticles(s.particles, p.x + p.w / 2, baseY, ['#fff2b1', '#ffffff'], 4, 35);
    playSfx('shoot', .14);
  }

  function addFloatingScore(s, x, y, text, color) {
    s.floats.push({ x, y, text, color, life: .85 });
  }

  function splitBubble(index, damage = 1) {
    const s = bubbleState;
    const bubble = s.bubbles[index];
    s.hits += 1;
    if (bubble.wood && bubble.hp > damage) {
      bubble.hp -= damage; bubble.impact = 1; s.shake = 3;
      spawnParticles(s.particles, bubble.x, bubble.y, ['#ca9248', '#ffdf91'], 10, 110);
      playSfx('popLarge', .18, .75);
      addFloatingScore(s, bubble.x, bubble.y - bubble.r, copy().woodCrack, '#ffe1a0');
      return;
    }
    const spec = BUBBLE_SPECS[bubble.stage];
    s.bubbles.splice(index, 1);
    s.pops += 1;
    s.combo = s.comboTimer > 0 ? s.combo + 1 : 1;
    s.comboTimer = 1.55;
    const multiplier = 1 + Math.min(3, Math.floor((s.combo - 1) / 3)) * .5;
    const earned = Math.round((spec.score + (bubble.wood ? 80 : 0)) * multiplier);
    score += earned;
    addFloatingScore(s, bubble.x, bubble.y, `+${earned}`, BUBBLE_COLORS[bubble.colorIndex]);
    spawnParticles(s.particles, bubble.x, bubble.y, [BUBBLE_COLORS[bubble.colorIndex], '#ffffff', '#ffe9a8'], bubble.stage < 2 ? 16 : 10, (bubble.stage < 2 ? 150 : 105) * bubbleScale());
    playSfx(bubble.stage <= 1 ? 'popLarge' : 'pop', bubble.stage <= 1 ? .20 : .16, .94 + bubble.stage * .07);
    s.shake = bubble.stage <= 1 ? 7 : 3.5;
    s.flash = .11;
    s.rings.push({ x: bubble.x, y: bubble.y, radius: bubble.r * .65, life: .32, maxLife: .32, color: BUBBLE_COLORS[bubble.colorIndex] });

    if (bubble.stage < BUBBLE_SPECS.length - 1) {
      const childStage = bubble.stage + 1;
      const childSpec = BUBBLE_SPECS[childStage];
      const offset = childSpec.radius * bubbleScale() * .44;
      const left = makeBubble(bubble.x - offset, bubble.y, childStage, -1, (bubble.colorIndex + 1) % BUBBLE_COLORS.length);
      const right = makeBubble(bubble.x + offset, bubble.y, childStage, 1, (bubble.colorIndex + 2) % BUBBLE_COLORS.length);
      const childSpeed = Math.abs(bubble.vx) + 8 * bubbleScale();
      left.x = clamp(left.x, left.r, width() - left.r);
      right.x = clamp(right.x, right.r, width() - right.r);
      left.vx = -childSpeed;
      right.vx = childSpeed;
      left.vy = right.vy = -400 * bubbleScale();
      left.wood = right.wood = bubble.wood;
      left.hp = right.hp = bubble.wood ? 2 : 1;
      s.bubbles.push(left, right);
    }
    if (!s.bubbles.length) s.clearDelay = .62;
    else if (s.pops >= s.nextPowerAt) {
      // An early drop teaches the feature; subsequent drops stay sparse and alternate.
      const type = s.powerDrops % 2 === 0 ? 'wide' : 'slow';
      s.pickups.push({ type, x: clamp(bubble.x - 14, 6, width() - 34), y: clamp(bubble.y - 14, 48, height() - 64), w: 28, h: 28, life: 9, phase: 0 });
      s.powerDrops += 1; s.nextPowerAt = s.pops + 4 + Math.floor(Math.random() * 3);
    }
  }

  function capsuleBubbleHit(bubble, player) {
    const cx = player.x + player.w * .5;
    const top = player.y + player.h * .27;
    const bottom = player.y + player.h * .72;
    const nearestY = clamp(bubble.y, top, bottom);
    return Math.hypot(bubble.x - cx, bubble.y - nearestY) < bubble.r * .86 + 12.5 * bubbleScale();
  }

  function loseBubbleLife() {
    const s = bubbleState;
    if (!running || s.grace > 0 || s.player.invincible > 0) return;
    s.lives -= 1;
    s.shake = 12;
    s.flash = .24;
    playSfx('hit', .24);
    spawnParticles(s.particles, s.player.x + s.player.w / 2, s.player.y + s.player.h / 2, ['#ff5964', '#ffffff'], 18, 130 * bubbleScale());
    if (s.lives <= 0) {
      running = false;
      overlayMode = 'bubbleEnd';
      setOverlay(copy().bubbleEndTitle, copy().bubbleEnd(s.hits, score), copy().retry);
      return;
    }
    const safestX = [.18, .5, .82].map(ratio => width() * ratio).sort((a, b) => {
      const distance = x => Math.min(...s.bubbles.map(bubble => Math.hypot(x - bubble.x, s.player.y - bubble.y) - bubble.r));
      return distance(b) - distance(a);
    })[0];
    s.player.x = safestX - s.player.w / 2;
    s.player.vx = 0;
    s.player.invincible = 1.8;
    rememberMotion(s.player);
    s.combo = 0; s.comboTimer = 0;
  }

  function updateBubblePaws(dt) {
    const s = bubbleState;
    const p = s.player;
    const scale = bubbleScale();
    const direction = steer();
    rememberMotion(p);
    for (const entity of [...s.bubbles, ...s.harpoons, ...s.pickups, ...s.particles, ...s.rings, ...s.floats]) rememberMotion(entity);
    tickEffects(s, dt);
    s.elapsed += dt;
    const target = direction * 280 * scale;
    const reversing = direction && p.vx !== 0 && Math.sign(target) !== Math.sign(p.vx);
    const accel = reversing ? 6800 : 4200;
    if (direction) p.vx += clamp(target - p.vx, -accel * scale * dt, accel * scale * dt);
    else p.vx += clamp(-p.vx, -5200 * scale * dt, 5200 * scale * dt);
    p.x = clamp(p.x + p.vx * dt, 3, width() - p.w - 3);
    if (Math.abs(p.vx) > 3) p.facing = Math.sign(p.vx);
    p.invincible = Math.max(0, p.invincible - dt);
    p.shootPose = Math.max(0, p.shootPose - dt);
    const poseBlend = 1 - Math.exp(-9 * dt);
    p.walkBlend += (Math.min(1, Math.abs(p.vx) / (280 * scale)) - p.walkBlend) * poseBlend;
    p.shootBlend += ((p.shootPose > 0 ? 1 : 0) - p.shootBlend) * poseBlend;
    p.walkTime += dt * Math.min(1, Math.abs(p.vx) / (280 * scale));
    s.shootCooldown = Math.max(0, s.shootCooldown - dt);
    s.fireBuffer = Math.max(0, s.fireBuffer - dt);
    if (heldFire || s.fireBuffer > 0) fireHarpoon(false);
    s.comboTimer = Math.max(0, s.comboTimer - dt);
    if (s.comboTimer <= 0) s.combo = 0;
    s.grace = Math.max(0, s.grace - dt);
    s.remaining = Math.max(0, s.remaining - dt);
    s.shake = Math.max(0, s.shake - dt * 38);
    s.flash = Math.max(0, s.flash - dt);

    const floor = height() - 32 * scale;
    const ceiling = 36 * scale;
    for (let i = s.pickups.length - 1; i >= 0; i--) {
      const pickup = s.pickups[i];
      pickup.life -= dt; pickup.phase += dt * 3;
      pickup.y = Math.min(floor - pickup.h, pickup.y + 115 * scale * dt);
      if (overlaps(p, pickup)) {
        activatePower(s, pickup.type, pickup.x + 14, pickup.y + 14);
        s.pickups.splice(i, 1);
      } else if (pickup.life <= 0) s.pickups.splice(i, 1);
    }
    // Only the bubbles are slowed: movement, shooting and the level clock stay responsive.
    const bubbleDt = dt * (s.effects.slow > 0 ? .45 : 1);
    for (const bubble of s.bubbles) {
      const spec = BUBBLE_SPECS[bubble.stage];
      bubble.age += dt;
      bubble.impact = Math.max(0, bubble.impact - dt * 4.6);
      const previousX = bubble.x, previousY = bubble.y;
      bubble.vy += 640 * scale * bubbleDt;
      bubble.x += bubble.vx * bubbleDt;
      bubble.y += bubble.vy * bubbleDt;
      bubble.spin += bubble.vx * bubbleDt * .008;
      if (bubble.x - bubble.r < 0) { bubble.x = bubble.r; bubble.vx = Math.abs(bubble.vx); bubble.impact = .28; }
      if (bubble.x + bubble.r > width()) { bubble.x = width() - bubble.r; bubble.vx = -Math.abs(bubble.vx); bubble.impact = .28; }
      if (bubble.y - bubble.r < ceiling) { bubble.y = ceiling + bubble.r; bubble.vy = Math.abs(bubble.vy); bubble.impact = .42; }
      if (bubble.y + bubble.r >= floor) {
        bubble.y = floor - bubble.r;
        bubble.vy = -spec.bounce * scale * (bubble.wood ? (bubble.stage === 3 ? 1.12 : .82) : 1);
        bubble.impact = 1;
      }
      for (const obstacle of s.obstacles) {
        if (bubble.x + bubble.r < obstacle.x || bubble.x - bubble.r > obstacle.x + obstacle.w) continue;
        if (bubble.vy > 0 && previousY + bubble.r <= obstacle.y + 3 && bubble.y + bubble.r >= obstacle.y) {
          bubble.y = obstacle.y - bubble.r; bubble.vy = -spec.bounce * (bubble.wood ? (bubble.stage === 3 ? 1.12 : .82) : 1); bubble.impact = .7;
        } else if (bubble.vy < 0 && previousY - bubble.r >= obstacle.y + obstacle.h - 3 && bubble.y - bubble.r <= obstacle.y + obstacle.h) {
          bubble.y = obstacle.y + obstacle.h + bubble.r; bubble.vy = Math.abs(bubble.vy);
        } else if (bubble.y + bubble.r > obstacle.y && bubble.y - bubble.r < obstacle.y + obstacle.h) {
          if (previousX + bubble.r <= obstacle.x && bubble.vx > 0) {
            bubble.x = obstacle.x - bubble.r; bubble.vx = -Math.abs(bubble.vx); bubble.impact = .5;
          } else if (previousX - bubble.r >= obstacle.x + obstacle.w && bubble.vx < 0) {
            bubble.x = obstacle.x + obstacle.w + bubble.r; bubble.vx = Math.abs(bubble.vx); bubble.impact = .5;
          }
        }
      }
    }

    for (let h = s.harpoons.length - 1; h >= 0; h -= 1) {
      const harpoon = s.harpoons[h];
      harpoon.topY -= 680 * scale * dt;
      const halfWidth = harpoon.radius || 6;
      const barriers = s.obstacles.filter(o => harpoon.x + halfWidth >= o.x && harpoon.x - halfWidth <= o.x + o.w && harpoon.baseY > o.y + o.h);
      const stopY = Math.max(ceiling, ...barriers.map(o => o.y + o.h));
      const tipY = Math.max(harpoon.topY, stopY);
      let hit = -1, nearestY = -Infinity;
      for (let b = 0; b < s.bubbles.length; b += 1) {
        const bubble = s.bubbles[b];
        const hitRadius = bubble.r * .94;
        const dx = Math.max(0, Math.abs(harpoon.x - bubble.x) - halfWidth);
        if (dx > hitRadius) continue;
        const halfChord = Math.sqrt(hitRadius * hitRadius - dx * dx);
        const contactY = Math.min(harpoon.baseY, bubble.y + halfChord);
        if (contactY >= tipY && harpoon.baseY >= bubble.y - halfChord && contactY > nearestY) { hit = b; nearestY = contactY; }
      }
      if (hit >= 0) {
        s.harpoons.splice(h, 1);
        splitBubble(hit, harpoon.damage || 1);
      } else if (harpoon.topY <= stopY) {
        spawnParticles(s.particles, harpoon.x, stopY, ['#d5eaf0', '#ffde96'], 5, 55);
        s.harpoons.splice(h, 1);
      }
    }

    if (s.grace <= 0 && p.invincible <= 0 && s.bubbles.some(bubble => capsuleBubbleHit(bubble, p))) loseBubbleLife();
    if (s.remaining <= 0 && running && s.clearDelay <= 0) {
      running = false;
      overlayMode = 'timeUp';
      setOverlay(copy().timeUpTitle, copy().timeUp(s.hits, score), copy().retry);
    }
    if (s.clearDelay > 0) {
      s.clearDelay -= dt;
      if (s.clearDelay <= 0 && running) {
        running = false;
        playSfx('clear', .22);
        overlayMode = 'levelClear';
        heldFire = false;
        if (bubbleLevel < LEVELS.length - 1) setOverlay(copy().clearTitle, copy().clear(s.hits, score), copy().next);
        else setOverlay(copy().complete, copy().completeText(score), copy().oneMore);
      }
    }

    updateParticles(s.particles, dt);
    updateRings(s.rings, dt);
    for (let i = s.floats.length - 1; i >= 0; i -= 1) {
      const item = s.floats[i];
      item.life -= dt;
      item.y -= 44 * scale * dt;
      if (item.life <= 0) s.floats.splice(i, 1);
    }
    updateScoreline(` · ${Math.ceil(s.remaining)} ${copy().seconds}`);
  }

  function drawGlossyBubble(bubble) {
    if (bubble.wood && art.woodBubble.complete && art.woodBubble.naturalWidth) {
      drawSprite(art.woodBubble, bubble.x - bubble.r, bubble.y - bubble.r, bubble.r * 2, bubble.r * 2);
      if (bubble.hp > 1) {
        ctx.fillStyle = '#ffe398'; ctx.beginPath(); ctx.arc(bubble.x + bubble.r * .3, bubble.y - bubble.r * .3, Math.max(3, bubble.r * .13), 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = '#382616'; ctx.lineWidth = Math.max(1.5, bubble.r * .08); ctx.beginPath();
        ctx.moveTo(bubble.x, bubble.y - bubble.r * .75); ctx.lineTo(bubble.x - bubble.r * .22, bubble.y - bubble.r * .16);
        ctx.lineTo(bubble.x + bubble.r * .2, bubble.y + bubble.r * .12); ctx.lineTo(bubble.x - bubble.r * .14, bubble.y + bubble.r * .72); ctx.stroke();
      }
      return;
    }
    const color = BUBBLE_COLORS[bubble.colorIndex];
    const squashX = 1 + bubble.impact * .11;
    const squashY = 1 - bubble.impact * .09;
    const wobble = Math.sin(bubble.age * 5.2 + bubble.spin) * .018;
    ctx.save();
    ctx.translate(bubble.x, bubble.y);
    ctx.rotate(wobble);
    ctx.scale(squashX, squashY);
    const gradient = ctx.createRadialGradient(-bubble.r * .32, -bubble.r * .38, bubble.r * .08, 0, 0, bubble.r);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(.16, color);
    gradient.addColorStop(.76, color);
    gradient.addColorStop(1, '#44275f');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, bubble.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.72)';
    ctx.lineWidth = Math.max(1.5, 2.4 * bubbleScale());
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.66)';
    ctx.beginPath();
    ctx.ellipse(-bubble.r * .32, -bubble.r * .40, bubble.r * .18, bubble.r * .10, -.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBubblePaws(alpha = 1) {
    const w = width();
    const h = height();
    const s = bubbleState;
    ctx.clearRect(0, 0, w, h);
    if (!drawCover(art.bubbleBg, 0, 0, w, h)) { ctx.fillStyle = '#163b32'; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = 'rgba(4,12,14,.20)';
    ctx.fillRect(0, 0, w, h);
    if (!s) return;

    const shakeX = reducedMotion ? 0 : Math.sin((s.elapsed + alpha * FIXED_STEP) * 113) * s.shake * .5;
    const shakeY = reducedMotion ? 0 : Math.cos((s.elapsed + alpha * FIXED_STEP) * 151) * s.shake * .5;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    const floor = h - 32 * bubbleScale();
    const floorGradient = ctx.createLinearGradient(0, floor, 0, h);
    floorGradient.addColorStop(0, 'rgba(12,16,37,.58)');
    floorGradient.addColorStop(1, 'rgba(4,7,18,.92)');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, floor, w, h - floor);
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floor);
    ctx.lineTo(w, floor);
    ctx.stroke();

    for (const obstacle of s.obstacles) {
      ctx.fillStyle = '#88603b'; ctx.strokeStyle = '#e1b47b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#442c22'; ctx.lineWidth = 1;
      for (let x = obstacle.x + 12; x < obstacle.x + obstacle.w; x += 28) {
        ctx.beginPath(); ctx.moveTo(x, obstacle.y + 3); ctx.lineTo(x + 16, obstacle.y + obstacle.h - 3); ctx.stroke();
      }
    }
    for (const current of s.bubbles) {
      const bubble = renderMotion(current, alpha);
      drawGlossyBubble(bubble);
      if (s.effects.slow > 0) {
        ctx.save(); ctx.strokeStyle = '#b2fcff'; ctx.lineWidth = 1.5; ctx.globalAlpha = .75;
        ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.r + 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
    for (const current of s.pickups) {
      const pickup = renderMotion(current, alpha);
      const bob = Math.sin(pickup.phase) * 2;
      ctx.save(); ctx.globalAlpha = pickup.life < 1.5 ? .55 + Math.sin(pickup.phase * 4) * .3 : 1;
      ctx.fillStyle = '#102034bb'; ctx.beginPath(); ctx.arc(pickup.x + 14, pickup.y + 14 + bob, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = POWER_UPS[pickup.type].color; ctx.lineWidth = 2; ctx.stroke();
      drawSprite(art[pickup.type], pickup.x, pickup.y + bob, 28, 28); ctx.restore();
    }
    drawRings(s.rings, alpha);
    for (const current of s.harpoons) {
      const harpoon = renderMotion(current, alpha);
      const harpoonHeight = harpoon.baseY - harpoon.topY;
      // Extend the shaft, not the spearhead: its proportions stay stable in flight.
      ctx.strokeStyle = harpoon.wide ? '#b797fa' : '#755029'; ctx.lineWidth = harpoon.wide ? 8 : 4; ctx.beginPath();
      ctx.moveTo(harpoon.x, harpoon.baseY); ctx.lineTo(harpoon.x, harpoon.topY + 9); ctx.stroke();
      ctx.strokeStyle = '#f5d49b'; ctx.lineWidth = 1.5; ctx.stroke();
      if (art.harpoon.complete && art.harpoon.naturalWidth) {
        const tipWidth = harpoon.wide ? 28 : 14;
        ctx.drawImage(art.harpoon, 30, 32, 70, 143, harpoon.x - tipWidth / 2, harpoon.topY, tipWidth, Math.min(27, harpoonHeight));
      } else {
        ctx.fillStyle = '#eaf7ff'; ctx.beginPath(); ctx.moveTo(harpoon.x, harpoon.topY);
        ctx.lineTo(harpoon.x - 6, harpoon.topY + 14); ctx.lineTo(harpoon.x + 6, harpoon.topY + 14); ctx.fill();
      }
    }
    drawParticles(s.particles, alpha);
    for (const current of s.floats) {
      const item = renderMotion(current, alpha);
      ctx.globalAlpha = clamp(item.life / .85, 0, 1);
      ctx.fillStyle = item.color;
      ctx.strokeStyle = '#0c1025';
      ctx.lineWidth = 3;
      ctx.font = `900 ${Math.max(15, 20 * bubbleScale())}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.strokeText(item.text, item.x, item.y);
      ctx.fillText(item.text, item.x, item.y);
    }
    ctx.textAlign = 'start';
    ctx.globalAlpha = 1;

    const p = renderMotion(s.player, alpha);
    const walkingReady = art.bubbleWalk.complete && art.bubbleWalk.naturalWidth;
    const playerAlpha = p.invincible > 0 && Math.floor(p.invincible * 12) % 2 ? .28 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, floor + 2, p.w * .36, 4 * bubbleScale(), 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.invincible > 0 || s.grace > 0) {
      ctx.save(); ctx.strokeStyle = '#a5f4ec'; ctx.lineWidth = 2;
      ctx.globalAlpha = .42 + Math.sin(s.elapsed * 7) * .15;
      ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + p.h * .56, p.w * .52, p.h * .6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    const shootBlend = art.bubbleShoot.complete ? p.shootBlend : 0;
    const walkBlend = walkingReady ? p.walkBlend : 0;
    if ((1 - walkBlend) * (1 - shootBlend) > .01) drawCharacter(art.bubbleIdle, p.x, p.y, p.w, p.h, p.facing < 0, playerAlpha * (1 - walkBlend) * (1 - shootBlend));
    if (walkBlend * (1 - shootBlend) > .01) drawCharacter(art.bubbleWalk, p.x, p.y, p.w, p.h, p.facing < 0, playerAlpha * walkBlend * (1 - shootBlend), Math.floor(p.walkTime / .11) % 6);
    if (shootBlend > .01) drawCharacter(art.bubbleShoot, p.x, p.y, p.w, p.h, p.facing < 0, playerAlpha * shootBlend);
    ctx.restore();

    let hudX = 10;
    hudX += drawHudPill(`♥ ${s.lives}`, hudX, 9, '#d74755') + 5;
    hudX += drawHudPill(`${Math.ceil(s.remaining)} ${copy().seconds}`, hudX, 9, '#174c72') + 5;
    hudX += drawHudPill(`${s.bubbles.length} ${copy().bubbles}`, hudX, 9, '#7d4cc4') + 5;
    if (s.combo >= 2 && hudX < w - 95) drawHudPill(`${copy().combo} ×${s.combo}`, hudX, 9, '#ca7a16');
    ctx.font = '900 11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(255,255,255,.88)';
    ctx.textAlign = 'right';
    ctx.fillText(`${copy().level} ${bubbleLevel + 1} / 3`, w - 10, h - 10);
    ctx.textAlign = 'start';
    ctx.fillStyle = '#ffffff20'; ctx.fillRect(10, 44, w - 20, 3);
    ctx.fillStyle = s.remaining <= 10 ? '#ff817a' : '#82e8d2';
    ctx.fillRect(10, 44, (w - 20) * s.remaining / LEVELS[bubbleLevel].time, 3);
    drawPowerTimers(s, 53);
    if (s.combo >= 2) {
      ctx.fillStyle = '#ffffff20'; ctx.fillRect(12, h - 18, 104, 4);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(12, h - 18, 104 * s.comboTimer / 1.55, 4);
      ctx.font = '800 10px Nunito, sans-serif'; ctx.fillText(`${copy().combo} ×${s.combo}`, 123, h - 11);
    }
    if (s.flash > 0 && !reducedMotion) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(.12, s.flash)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function update(dt) {
    if (game === 'jump') updateJump(dt);
    else updateBubblePaws(dt);
  }

  function draw(alpha = 1) {
    if (game === 'jump') drawJump(alpha);
    else drawBubblePaws(alpha);
  }

  function loop(now) {
    if (!running) return;
    const frameDt = Math.min(1 / 15, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    accumulator += frameDt;
    let steps = 0;
    while (accumulator + 1e-9 >= FIXED_STEP && steps < 4 && running) {
      update(FIXED_STEP);
      accumulator = Math.max(0, accumulator - FIXED_STEP);
      steps += 1;
    }
    if (steps >= 4) accumulator = 0;
    draw(running ? clamp(accumulator / FIXED_STEP, 0, 1) : 1);
    if (running) animationFrame = requestAnimationFrame(loop);
  }

  function clearInput() {
    Object.keys(keys).forEach(key => { keys[key] = false; });
    heldFire = keyboardFire = pointerFire = false;
    if (bubbleState) bubbleState.fireBuffer = 0;
    screenPointer = null;
    [leftBtn, rightBtn, actionBtn].forEach(btn => btn.classList.remove('held'));
  }

  function updateGuide() {
    const jump = game === 'jump';
    guideTitle.textContent = jump ? 'Paw Jump' : 'Bubble Paws';
    const src = jump ? 'assets/paw_jump_keyart.jpg' : 'assets/bubble_paws_keyart.jpg';
    if (guideArt.getAttribute('src') !== src) guideArt.src = src;
    guideArt.alt = guideTitle.textContent;
    guideDescription.textContent = jump ? copy().jumpGuide : copy().popGuide;
    guideTip.textContent = jump ? copy().jumpTip : copy().popTip;
    guideAction.textContent = jump ? copy().doubleJump : copy().fire;
    progress.hidden = jump;
    [...progress.children].forEach((el, i) => el.classList.toggle('active', i <= bubbleLevel));
    soundBtn.textContent = muted ? '♪ ×' : '♪';
    soundBtn.setAttribute('aria-pressed', String(muted));
    soundBtn.setAttribute('aria-label', muted ? copy().unmute : copy().mute);
    soundBtn.title = muted ? copy().unmute : copy().mute;
    pauseBtn.setAttribute('aria-label', paused ? copy().resume : copy().pause);
    pauseBtn.title = (paused ? copy().resume : copy().pause) + ' · P';
    pauseBtn.textContent = paused ? '▷' : 'Ⅱ';
    pauseBtn.disabled = !running && !paused;
  }

  function beginLoop() {
    cancelAnimationFrame(animationFrame);
    overlay.hidden = true; running = true; paused = false; overlayMode = 'playing';
    accumulator = 0; lastFrame = performance.now(); clearInput(); updateGuide();
    animationFrame = requestAnimationFrame(loop);
  }

  function startGame() {
    if (!demoDrawer.classList.contains('is-open')) return;
    bubbleLevel = 0;
    if (game === 'jump') initJump(); else initBubblePaws();
    resizeCanvas(); beginLoop();
  }

  function activateOverlay() {
    if (paused) { beginLoop(); return; }
    if (game === 'pop' && overlayMode === 'levelClear' && bubbleLevel < LEVELS.length - 1) {
      bubbleLevel++; initBubblePaws(true); beginLoop(); return;
    }
    startGame();
  }

  function pauseGame() {
    if (!running) return;
    running = false; paused = true; overlayMode = 'paused';
    cancelAnimationFrame(animationFrame); clearInput();
    setOverlay(copy().paused, copy().pauseText, copy().resume); updateGuide();
  }

  function performAction() {
    if (!running || !demoDrawer.classList.contains('is-open')) return;
    if (game === 'jump') jumpAction(); else fireHarpoon();
  }

  function setDemoDrawer(open) {
    if (open) returnFocus = document.activeElement;
    demoDrawer.classList.toggle('is-open', open);
    demoDrawer.inert = !open;
    demoDrawer.setAttribute('aria-hidden', String(!open));
    demoRail.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('demo-open', open);
    document.querySelector('main').inert = open;
    document.querySelector('header').inert = open;
    document.querySelector('footer').inert = open;
    if (open) {
      resizeCanvas(); updateGuide(); demoClose.focus();
    } else {
      pauseGame(); clearInput();
      if (returnFocus?.isConnected) returnFocus.focus(); else demoRail.focus();
    }
  }

  function selectGame(next) {
    game = next === 'pop' ? 'pop' : 'jump'; bubbleLevel = 0;
    running = false; paused = false; overlayMode = 'intro';
    cancelAnimationFrame(animationFrame); accumulator = 0; clearInput();
    screen.classList.toggle('jump-mode', game === 'jump');
    screen.classList.toggle('pop-mode', game === 'pop');
    stage.classList.toggle('landscape-game', game === 'pop');
    tabs.forEach(tab => {
      const selected = tab.dataset.game === game;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    screen.setAttribute('aria-labelledby', game === 'jump' ? 'jump-tab' : 'pop-tab');
    if (game === 'jump') { initJump(); setOverlay('Paw Jump', copy().jumpIntro); }
    else { initBubblePaws(); setOverlay('Bubble Paws', copy().bubbleIntro); }
    resizeCanvas(); refreshLanguageUi(); updateGuide();
  }

  function refreshLanguageUi() {
    leftBtn.textContent = copy().left; rightBtn.textContent = copy().right;
    if (game === 'jump') {
      syncJumpAction();
      updateScoreline(` · ${Math.floor((jumpState?.altitude || 0) / 12)} m`);
    } else {
      actionBtn.textContent = copy().fire;
      updateScoreline(` · ${Math.ceil(bubbleState?.remaining || 0)} ${copy().seconds}`);
    }
    if (overlayMode === 'intro') setOverlay(game === 'jump' ? 'Paw Jump' : 'Bubble Paws', game === 'jump' ? copy().jumpIntro : copy().bubbleIntro);
    if (paused) setOverlay(copy().paused, copy().pauseText, copy().resume);
    if (overlayMode === 'jumpEnd') setOverlay(copy().jumpEndTitle, copy().jumpEnd(Math.floor(jumpState.altitude / 12), jumpState.bones), copy().retry);
    if (overlayMode === 'bubbleEnd') setOverlay(copy().bubbleEndTitle, copy().bubbleEnd(bubbleState.hits, score), copy().retry);
    if (overlayMode === 'timeUp') setOverlay(copy().timeUpTitle, copy().timeUp(bubbleState.hits, score), copy().retry);
    if (overlayMode === 'levelClear') {
      if (bubbleLevel < LEVELS.length - 1) setOverlay(copy().clearTitle, copy().clear(bubbleState.hits, score), copy().next);
      else setOverlay(copy().complete, copy().completeText(score), copy().oneMore);
    }
    updateGuide(); if (!running) draw();
  }

  function bindHold(button, key) {
    button.addEventListener('pointerdown', event => {
      if (!running) return;
      event.preventDefault(); keys[key] = true;
      button.classList.add('held'); button.setPointerCapture?.(event.pointerId);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, () => {
      keys[key] = false; button.classList.remove('held');
    }));
  }

  let screenPointer = null;
  bindHold(leftBtn, 'buttonLeft'); bindHold(rightBtn, 'buttonRight');
  actionBtn.addEventListener('pointerdown', event => {
    event.preventDefault();
    if (!running) return;
    actionBtn.setPointerCapture?.(event.pointerId);
    pointerFire = game === 'pop'; heldFire = pointerFire || keyboardFire;
    actionBtn.classList.add('held'); performAction();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => actionBtn.addEventListener(name, () => {
    pointerFire = false; heldFire = keyboardFire; actionBtn.classList.remove('held');
  }));
  actionBtn.addEventListener('click', event => { if (event.detail === 0) performAction(); });
  restartBtn.addEventListener('click', startGame);
  startButton.addEventListener('click', activateOverlay);
  pauseBtn.addEventListener('click', () => { if (paused) beginLoop(); else pauseGame(); });
  soundBtn.addEventListener('click', () => {
    muted = !muted; try { localStorage.setItem('firu-demo-muted', String(muted)); } catch (_) {}
    updateGuide();
  });
  demoRail.addEventListener('click', () => setDemoDrawer(true));
  openDemo.addEventListener('click', () => setDemoDrawer(true));
  demoClose.addEventListener('click', () => setDemoDrawer(false));
  drawerBackdrop.addEventListener('click', () => setDemoDrawer(false));
  document.getElementById('demoDownload').addEventListener('click', () => setDemoDrawer(false));
  tabs.forEach(tab => {
    tab.addEventListener('click', () => selectGame(tab.dataset.game));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      selectGame(game === 'jump' ? 'pop' : 'jump');
      tabs.find(t => t.dataset.game === game).focus();
    });
  });
  document.querySelectorAll('[data-play]').forEach(button => button.addEventListener('click', () => {
    selectGame(button.dataset.play); setDemoDrawer(true);
  }));
  function steerFromScreen(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    keys.screenLeft = x < .42; keys.screenRight = x > .58;
  }
  canvas.addEventListener('pointerdown', event => {
    if (!running) return;
    event.preventDefault(); screenPointer = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId); steerFromScreen(event.clientX);
  });
  canvas.addEventListener('pointermove', event => { if (screenPointer === event.pointerId) steerFromScreen(event.clientX); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => canvas.addEventListener(name, event => {
    if (screenPointer !== event.pointerId) return;
    screenPointer = null; keys.screenLeft = keys.screenRight = false;
  }));
  window.addEventListener('keydown', event => {
    if (!demoDrawer.classList.contains('is-open')) return;
    if (event.key === 'Tab') {
      const focusable = [...demoDrawer.querySelectorAll('button:not(:disabled), a[href]')].filter(el => el.tabIndex >= 0 && el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.key === 'Escape') { event.preventDefault(); if (running) pauseGame(); else setDemoDrawer(false); return; }
    if (event.code === 'KeyP') { if (!event.repeat) { if (paused) beginLoop(); else pauseGame(); } return; }
    if (!running) return;
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) { keys.left = true; event.preventDefault(); }
    if (['ArrowRight', 'd', 'D'].includes(event.key)) { keys.right = true; event.preventDefault(); }
    if (event.code === 'Space' && event.target !== pauseBtn && event.target !== soundBtn) {
      event.preventDefault(); keyboardFire = game === 'pop'; heldFire = keyboardFire || pointerFire;
      if (!event.repeat) performAction();
    }
  });
  window.addEventListener('keyup', event => {
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) keys.left = false;
    if (['ArrowRight', 'd', 'D'].includes(event.key)) keys.right = false;
    if (event.code === 'Space') { keyboardFire = false; heldFire = pointerFire; }
  });
  window.addEventListener('blur', () => { pauseGame(); clearInput(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGame(); clearInput(); } });
  window.addEventListener('firu:languagechange', refreshLanguageUi);
  const resizeObserver = new ResizeObserver(() => resizeCanvas());
  resizeObserver.observe(stage);
  Object.values(art).forEach(img => img.addEventListener('load', () => { if (!running) draw(); }));
  selectGame('jump');
})();
