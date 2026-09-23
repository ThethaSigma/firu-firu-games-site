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

  const image = (src) => Object.assign(new Image(), { src });
  const art = {
    jumpBg: image('assets/paw_jump_bg.webp'),
    jumpUp: image('assets/paw_jump_hero.webp'),
    jumpDown: image('assets/paw_jump_down.webp'),
    platform: image('assets/platform_normal.webp'),
    platformGrass: image('assets/platform_grass.webp'),
    platformStone: image('assets/platform_stone.webp'),
    platformMoving: image('assets/platform_moving.webp'),
    spring: image('assets/platform_spring.webp'),
    bone: image('assets/collectible_bone.webp'),
    airJump: image('assets/powerup_air_jump.webp'),
    bubbleBg: image('assets/bubble_paws_bg.webp'),
    bubbleIdle: image('assets/bubble_paws_firu.webp'),
    bubbleShoot: image('assets/bubble_paws_shoot.png'),
    harpoon: image('assets/harpoon.webp')
  };

  const audioSources = {
    jump: 'assets/sfx_jump.mp3',
    spring: 'assets/sfx_spring.mp3',
    bone: 'assets/sfx_bone.mp3',
    doubleJump: 'assets/sfx_double_jump.mp3',
    shoot: 'assets/sfx_shoot.mp3',
    pop: 'assets/sfx_pop.mp3',
    popLarge: 'assets/sfx_pop_large.mp3',
    hit: 'assets/sfx_hit.mp3',
    clear: 'assets/sfx_clear.mp3'
  };
  const audioBank = Object.fromEntries(Object.entries(audioSources).map(([name, src]) => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    return [name, audio];
  }));

  const uiCopy = {
    tr: {
      score: 'SKOR', best: 'EN İYİ', start: 'Oyunu başlat', retry: 'Tekrar dene', oneMore: 'Bir tur daha',
      left: '← SOL', right: 'SAĞ →', doubleJump: 'ÇİFT ZIPLA', fire: 'ATEŞ', seconds: 'sn', combo: 'KOMBO',
      bubbles: 'BALON', level: 'BÖLÜM 1', timeUpTitle: 'Süre doldu',
      jumpIntro: 'Gerçek ayarlara yakın demo: Firu otomatik sıçrar. Sağa-sola yönlendir, kemikleri topla; güç simgesini alınca havada çift zıpla.',
      bubbleIntro: '1. bölüm demosu: Tek büyük balonu zıpkınla dört aşamada parçala. Firu’yu sağa-sola taşı; ATEŞ ya da boşlukla zıpkın fırlat.',
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
      bubbles: 'BUBBLES', level: 'LEVEL 1', timeUpTitle: 'Time up',
      jumpIntro: 'A closer-to-game demo: Firu jumps automatically. Steer left and right, collect bones, and grab the power-up to double-jump in mid-air.',
      bubbleIntro: 'Level 1 demo: Split one large bubble through four stages. Move Firu left and right; press FIRE or space to launch the harpoon.',
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
  const width = () => canvas.clientWidth;
  const height = () => canvas.clientHeight;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const FIXED_STEP = 1 / 60;

  let game = 'jump';
  let running = false;
  let animationFrame = 0;
  let lastFrame = 0;
  let accumulator = 0;
  let score = 0;
  let keys = { left: false, right: false };
  let jumpState = null;
  let bubbleState = null;

  function playSfx(name, volume = .18, playbackRate = 1) {
    const source = audioBank[name];
    if (!source) return;
    const sound = source.cloneNode();
    sound.volume = volume;
    sound.playbackRate = playbackRate;
    sound.play().catch(() => {});
  }

  function bestKey() {
    return game === 'jump' ? 'firu-web-best-jump-v2' : 'firu-web-best-bubble-v2';
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
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
  }

  function updateScoreline(extra = '') {
    const storedBest = Number(localStorage.getItem(bestKey()) || 0);
    const best = Math.max(storedBest, score);
    if (best !== storedBest) localStorage.setItem(bestKey(), String(best));
    scoreline.textContent = `${copy().score} ${String(score).padStart(3, '0')} · ${copy().best} ${String(best).padStart(3, '0')}${extra}`;
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

  function drawParticles(list) {
    for (const particle of list) {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Paw Jump: mobile-game physics, portrait camera, real tuning.
  function jumpScale() {
    return width() / 400;
  }

  function makePlatform(x, y, w, type = 'normal', variant = 'grass') {
    const scale = jumpScale();
    return {
      x, y, originX: x, w, h: 30 * scale, type, variant,
      phase: Math.random() * Math.PI * 2,
      range: 34 * scale + Math.random() * 35 * scale,
      landedPulse: 0
    };
  }

  function addJumpItem(platform) {
    const roll = Math.random();
    if (roll < .10) {
      jumpState.items.push({ type: 'air', x: platform.x + platform.w / 2 - 18 * jumpScale(), y: platform.y - 45 * jumpScale(), w: 36 * jumpScale(), h: 36 * jumpScale(), phase: Math.random() * 6 });
    } else if (roll < .43) {
      jumpState.items.push({ type: 'bone', x: platform.x + platform.w / 2 - 12 * jumpScale(), y: platform.y - 31 * jumpScale(), w: 24 * jumpScale(), h: 24 * jumpScale(), phase: Math.random() * 6 });
    }
  }

  function generateJumpPlatform() {
    const s = jumpState;
    const scale = jumpScale();
    const top = s.platforms.reduce((a, b) => a.y < b.y ? a : b);
    const metres = s.altitude / (12 * scale);
    const gap = clamp(70 + metres / 80, 70, 112) * scale * (.96 + Math.random() * .08);
    const platformWidth = (56 + Math.random() * 34) * scale;
    const reach = Math.min(185 * scale, width() * .43);
    const x = clamp(top.x + (Math.random() * 2 - 1) * reach, 8, width() - platformWidth - 8);
    const roll = Math.random();
    const springChance = metres > 20 ? .12 : .06;
    const movingChance = metres > 75 ? .15 : 0;
    const type = roll < springChance ? 'spring' : roll < springChance + movingChance ? 'moving' : 'normal';
    const variant = metres > 160 ? 'stone' : Math.random() < .68 ? 'grass' : 'default';
    const platform = makePlatform(x, top.y - gap, platformWidth, type, variant);
    s.platforms.push(platform);
    addJumpItem(platform);
  }

  function initJump() {
    const w = width();
    const h = height();
    const scale = jumpScale();
    score = 0;
    const platforms = [
      makePlatform(w * .38, h - 38 * scale, 90 * scale),
      makePlatform(w * .07, h - 145 * scale, 78 * scale),
      makePlatform(w * .62, h - 240 * scale, 74 * scale, 'spring'),
      makePlatform(w * .30, h - 332 * scale, 70 * scale),
      makePlatform(w * .68, h - 420 * scale, 66 * scale)
    ];
    jumpState = {
      player: {
        x: w * .49 - 28.6 * scale, y: h - 105 * scale,
        w: 57.2 * scale, h: 57.2 * scale,
        vx: 0, vy: -560 * scale, facing: 1, invincible: 0,
        squash: 0, rotation: 0
      },
      platforms,
      items: [], particles: [], altitude: 0, bones: 0, landings: 0,
      bonusScore: 0, lives: 3, doubleJumps: 0, combo: 0, shake: 0, elapsed: 0
    };
    platforms.slice(1).forEach(addJumpItem);
    actionBtn.textContent = `${copy().doubleJump} ×0`;
    updateScoreline(' · 0 m');
    drawJump();
  }

  function jumpAction() {
    if (!running || game !== 'jump' || !jumpState) return;
    const s = jumpState;
    const p = s.player;
    if (s.doubleJumps <= 0 || p.vy >= 620 * jumpScale()) return;
    p.vy = -560 * jumpScale();
    p.squash = -.24;
    s.doubleJumps -= 1;
    actionBtn.textContent = `${copy().doubleJump} ×${s.doubleJumps}`;
    spawnParticles(s.particles, p.x + p.w / 2, p.y + p.h * .78, ['#8cf4ff', '#ffffff', '#8a7dff'], 13, 120 * jumpScale());
    playSfx('doubleJump', .22);
  }

  function loseJumpLife() {
    const s = jumpState;
    s.lives -= 1;
    s.shake = 10;
    if (s.lives <= 0) {
      running = false;
      setOverlay(copy().jumpEndTitle, copy().jumpEnd(Math.floor(s.altitude / (12 * jumpScale())), s.bones), copy().retry);
      return;
    }
    const landing = s.platforms
      .filter(platform => platform.y > height() * .48 && platform.y < height() - 8)
      .sort((a, b) => b.y - a.y)[0] || s.platforms[0];
    s.player.x = landing.x + landing.w / 2 - s.player.w / 2;
    s.player.y = landing.y - s.player.h - 3;
    s.player.vx = 0;
    s.player.vy = -560 * jumpScale();
    s.player.invincible = 1.2;
  }

  function updateJump(dt) {
    const s = jumpState;
    const p = s.player;
    const scale = jumpScale();
    const direction = Number(keys.right) - Number(keys.left);
    const target = direction * 260 * scale;
    const acceleration = direction && Math.sign(target) !== Math.sign(p.vx) ? 2600 : 1800;
    if (direction) p.vx += clamp(target - p.vx, -acceleration * scale * dt, acceleration * scale * dt);
    else p.vx *= Math.max(0, 1 - 8 * dt);
    if (Math.abs(p.vx) > 3) p.facing = Math.sign(p.vx);

    const oldBottom = p.y + p.h;
    p.x += p.vx * dt;
    p.vy = Math.min(900 * scale, p.vy + 980 * scale * dt);
    p.y += p.vy * dt;
    p.invincible = Math.max(0, p.invincible - dt);
    p.squash += (0 - p.squash) * Math.min(1, dt * 10);
    p.rotation += ((p.vx / (260 * scale)) * .105 - p.rotation) * Math.min(1, dt * 12);
    s.elapsed += dt;
    s.shake = Math.max(0, s.shake - dt * 34);

    if (p.x + p.w < 0) p.x = width();
    if (p.x > width()) p.x = -p.w;

    for (const platform of s.platforms) {
      platform.landedPulse = Math.max(0, platform.landedPulse - dt * 4.5);
      if (platform.type === 'moving') {
        platform.phase += dt * 1.75;
        platform.x = clamp(platform.originX + Math.sin(platform.phase) * platform.range, 5, width() - platform.w - 5);
      }
      const hitLeft = p.x + p.w * .63;
      const hitRight = p.x + p.w * .37;
      if (p.vy > 40 * scale && oldBottom <= platform.y + 6 * scale && p.y + p.h >= platform.y && hitLeft > platform.x && hitRight < platform.x + platform.w) {
        p.y = platform.y - p.h;
        p.vy = (platform.type === 'spring' ? -980 : -560) * scale;
        p.squash = .26;
        platform.landedPulse = 1;
        s.landings += 1;
        const centered = Math.abs((p.x + p.w / 2) - (platform.x + platform.w / 2)) < platform.w * .22;
        s.combo = centered ? Math.min(15, s.combo + 1) : 0;
        const multiplier = 1 + Math.min(3, Math.floor(s.combo / 5)) * .5;
        s.bonusScore += Math.round(10 * multiplier);
        spawnParticles(s.particles, p.x + p.w / 2, platform.y, ['#f8df7b', '#ffffff', '#76e4a3'], platform.type === 'spring' ? 12 : 7, 70 * scale);
        playSfx(platform.type === 'spring' ? 'spring' : 'jump', platform.type === 'spring' ? .22 : .10, .96 + Math.random() * .08);
      }
    }

    for (let i = s.items.length - 1; i >= 0; i -= 1) {
      const item = s.items[i];
      item.phase += dt * 2.4;
      const pickup = { x: item.x + item.w * .15, y: item.y + item.h * .15, w: item.w * .7, h: item.h * .7 };
      const playerPickup = { x: p.x + p.w * .25, y: p.y + p.h * .2, w: p.w * .5, h: p.h * .68 };
      if (overlaps(playerPickup, pickup)) {
        if (item.type === 'bone') {
          s.bones += 1;
          s.bonusScore += 25;
          spawnParticles(s.particles, item.x + item.w / 2, item.y + item.h / 2, ['#ffd166', '#fff2a8'], 10, 90 * scale);
          playSfx('bone', .18);
        } else {
          s.doubleJumps = Math.min(3, s.doubleJumps + 1);
          actionBtn.textContent = `${copy().doubleJump} ×${s.doubleJumps}`;
          spawnParticles(s.particles, item.x + item.w / 2, item.y + item.h / 2, ['#78f2ff', '#9c8cff', '#ffffff'], 15, 110 * scale);
          playSfx('doubleJump', .20);
        }
        s.items.splice(i, 1);
      }
    }

    const metres = s.altitude / (12 * scale);
    const pressureSpeed = (55 + clamp(metres / 4000, 0, 1) * 155) * scale;
    let cameraShift = pressureSpeed * dt;
    const followLine = height() * .50;
    if (p.y < followLine) cameraShift += followLine - p.y;
    if (cameraShift > 0) {
      p.y += cameraShift;
      s.altitude += cameraShift;
      s.platforms.forEach(platform => { platform.y += cameraShift; });
      s.items.forEach(item => { item.y += cameraShift; });
      s.particles.forEach(particle => { particle.y += cameraShift; });
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
    if (platform.type === 'spring') return art.spring;
    if (platform.type === 'moving') return art.platformMoving;
    if (platform.variant === 'stone') return art.platformStone;
    if (platform.variant === 'grass') return art.platformGrass;
    return art.platform;
  }

  function drawJumpPlayer(player) {
    const sprite = player.vy < 35 * jumpScale() ? art.jumpUp : art.jumpDown;
    const alpha = player.invincible > 0 && Math.floor(player.invincible * 12) % 2 ? .32 : 1;
    const stretch = clamp(-player.vy / (900 * jumpScale()), -.45, .45);
    const scaleX = 1 - stretch * .08 + player.squash * .22;
    const scaleY = 1 + stretch * .10 - player.squash * .18;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.rotate(player.rotation * player.facing);
    ctx.scale(player.facing < 0 ? -scaleX : scaleX, scaleY);
    if (sprite.complete && sprite.naturalWidth) ctx.drawImage(sprite, -player.w / 2, -player.h / 2, player.w, player.h);
    else {
      ctx.fillStyle = '#c88945';
      ctx.beginPath();
      ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 14);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawJump() {
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

    const shakeX = (Math.random() - .5) * s.shake;
    const shakeY = (Math.random() - .5) * s.shake;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    for (const platform of s.platforms) {
      const pulse = platform.landedPulse * 3 * jumpScale();
      ctx.fillStyle = 'rgba(7,28,48,.20)';
      ctx.beginPath();
      ctx.ellipse(platform.x + platform.w / 2, platform.y + platform.h + 5, platform.w * .43, 5 * jumpScale(), 0, 0, Math.PI * 2);
      ctx.fill();
      if (!drawSprite(platformArt(platform), platform.x, platform.y - 6 + pulse, platform.w, platform.h + 13 - pulse)) {
        ctx.fillStyle = platform.type === 'spring' ? '#ffcf5a' : '#54c56f';
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      }
    }
    for (const item of s.items) {
      const bob = Math.sin(item.phase * 3) * 3 * jumpScale();
      ctx.fillStyle = item.type === 'bone' ? 'rgba(255,218,104,.24)' : 'rgba(114,232,255,.25)';
      ctx.beginPath();
      ctx.arc(item.x + item.w / 2, item.y + item.h / 2 + bob, item.w * .68, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(item.type === 'bone' ? art.bone : art.airJump, item.x, item.y + bob, item.w, item.h);
    }
    drawParticles(s.particles);
    drawJumpPlayer(s.player);
    ctx.restore();

    let hudX = 10;
    hudX += drawHudPill(`♥ ${s.lives}`, hudX, 10, '#d74755') + 6;
    hudX += drawHudPill(`${Math.floor(s.altitude / (12 * jumpScale()))} m`, hudX, 10, '#174c72') + 6;
    if (s.combo >= 5) drawHudPill(`${copy().combo} ×${1 + Math.floor(s.combo / 5)}`, hudX, 10, '#7d4cc4');
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

  function initBubblePaws() {
    const w = width();
    const h = height();
    const scale = bubbleScale();
    score = 0;
    bubbleState = {
      player: {
        x: w / 2 - 27 * scale, y: h - (32 + 62) * scale,
        w: 54 * scale, h: 62 * scale,
        vx: 0, facing: 1, invincible: 0, shootPose: 0
      },
      bubbles: [makeBubble(w * .32, 82 * scale, 0, 1, 0)],
      harpoons: [], particles: [], floats: [], lives: 5, remaining: 58,
      shootCooldown: 0, hits: 0, combo: 0, comboTimer: 0,
      grace: 1.6, shake: 0, flash: 0, clearDelay: 0
    };
    actionBtn.textContent = copy().fire;
    updateScoreline(` · 58 ${copy().seconds}`);
    drawBubblePaws();
  }

  function fireHarpoon() {
    if (!running || game !== 'pop' || !bubbleState) return;
    const s = bubbleState;
    if (s.shootCooldown > 0 || s.harpoons.length >= 1 || s.clearDelay > 0) return;
    const p = s.player;
    const baseY = p.y + 14 * bubbleScale();
    s.harpoons.push({ x: p.x + p.w / 2, topY: baseY - 9 * bubbleScale(), baseY });
    s.shootCooldown = .22;
    p.shootPose = .18;
    playSfx('shoot', .14);
  }

  function addFloatingScore(s, x, y, text, color) {
    s.floats.push({ x, y, text, color, life: .85 });
  }

  function splitBubble(index) {
    const s = bubbleState;
    const bubble = s.bubbles[index];
    const spec = BUBBLE_SPECS[bubble.stage];
    s.bubbles.splice(index, 1);
    s.hits += 1;
    s.combo = s.comboTimer > 0 ? s.combo + 1 : 1;
    s.comboTimer = 1.55;
    const multiplier = 1 + Math.min(3, Math.floor((s.combo - 1) / 3)) * .5;
    const earned = Math.round(spec.score * multiplier);
    score += earned;
    addFloatingScore(s, bubble.x, bubble.y, `+${earned}`, BUBBLE_COLORS[bubble.colorIndex]);
    spawnParticles(s.particles, bubble.x, bubble.y, [BUBBLE_COLORS[bubble.colorIndex], '#ffffff', '#ffe9a8'], bubble.stage < 2 ? 16 : 10, (bubble.stage < 2 ? 150 : 105) * bubbleScale());
    playSfx(bubble.stage <= 1 ? 'popLarge' : 'pop', bubble.stage <= 1 ? .20 : .16, .94 + bubble.stage * .07);
    s.shake = bubble.stage <= 1 ? 7 : 3.5;
    s.flash = .11;

    if (bubble.stage < BUBBLE_SPECS.length - 1) {
      const childStage = bubble.stage + 1;
      const childSpec = BUBBLE_SPECS[childStage];
      const offset = childSpec.radius * bubbleScale() * .44;
      const left = makeBubble(bubble.x - offset, bubble.y, childStage, -1, (bubble.colorIndex + 1) % BUBBLE_COLORS.length);
      const right = makeBubble(bubble.x + offset, bubble.y, childStage, 1, (bubble.colorIndex + 2) % BUBBLE_COLORS.length);
      left.vy = right.vy = -childSpec.bounce * .82 * bubbleScale();
      s.bubbles.push(left, right);
    }
    if (!s.bubbles.length) s.clearDelay = .62;
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
    s.lives -= 1;
    s.shake = 12;
    s.flash = .24;
    playSfx('hit', .24);
    spawnParticles(s.particles, s.player.x + s.player.w / 2, s.player.y + s.player.h / 2, ['#ff5964', '#ffffff'], 18, 130 * bubbleScale());
    if (s.lives <= 0) {
      running = false;
      setOverlay(copy().bubbleEndTitle, copy().bubbleEnd(s.hits, score), copy().retry);
      return;
    }
    s.player.x = width() / 2 - s.player.w / 2;
    s.player.vx = 0;
    s.player.invincible = 1.8;
  }

  function updateBubblePaws(dt) {
    const s = bubbleState;
    const p = s.player;
    const scale = bubbleScale();
    const direction = Number(keys.right) - Number(keys.left);
    const target = direction * 280 * scale;
    const accel = direction && Math.sign(target) !== Math.sign(p.vx) ? 6800 : 4200;
    if (direction) p.vx += clamp(target - p.vx, -accel * scale * dt, accel * scale * dt);
    else p.vx += clamp(-p.vx, -5200 * scale * dt, 5200 * scale * dt);
    p.x = clamp(p.x + p.vx * dt, 3, width() - p.w - 3);
    if (Math.abs(p.vx) > 3) p.facing = Math.sign(p.vx);
    p.invincible = Math.max(0, p.invincible - dt);
    p.shootPose = Math.max(0, p.shootPose - dt);
    s.shootCooldown = Math.max(0, s.shootCooldown - dt);
    s.comboTimer = Math.max(0, s.comboTimer - dt);
    if (s.comboTimer <= 0) s.combo = 0;
    s.grace = Math.max(0, s.grace - dt);
    s.remaining = Math.max(0, s.remaining - dt);
    s.shake = Math.max(0, s.shake - dt * 38);
    s.flash = Math.max(0, s.flash - dt);

    const floor = height() - 32 * scale;
    const ceiling = 36 * scale;
    for (const bubble of s.bubbles) {
      const spec = BUBBLE_SPECS[bubble.stage];
      bubble.age += dt;
      bubble.impact = Math.max(0, bubble.impact - dt * 4.6);
      bubble.vy += 640 * scale * dt;
      bubble.x += bubble.vx * dt;
      bubble.y += bubble.vy * dt;
      bubble.spin += bubble.vx * dt * .008;
      if (bubble.x - bubble.r < 0) { bubble.x = bubble.r; bubble.vx = Math.abs(bubble.vx); bubble.impact = .28; }
      if (bubble.x + bubble.r > width()) { bubble.x = width() - bubble.r; bubble.vx = -Math.abs(bubble.vx); bubble.impact = .28; }
      if (bubble.y - bubble.r < ceiling) { bubble.y = ceiling + bubble.r; bubble.vy = Math.abs(bubble.vy); bubble.impact = .42; }
      if (bubble.y + bubble.r >= floor) {
        bubble.y = floor - bubble.r;
        bubble.vy = -spec.bounce * scale;
        bubble.impact = 1;
      }
    }

    for (let h = s.harpoons.length - 1; h >= 0; h -= 1) {
      const harpoon = s.harpoons[h];
      harpoon.topY -= 680 * scale * dt;
      let hit = -1;
      for (let b = 0; b < s.bubbles.length; b += 1) {
        const bubble = s.bubbles[b];
        const hitRadius = bubble.r * .94;
        if (Math.abs(harpoon.x - bubble.x) <= hitRadius && harpoon.topY <= bubble.y + hitRadius && harpoon.baseY >= bubble.y - hitRadius) { hit = b; break; }
      }
      if (hit >= 0) {
        s.harpoons.splice(h, 1);
        splitBubble(hit);
      } else if (harpoon.topY <= ceiling) {
        s.harpoons.splice(h, 1);
      }
    }

    if (s.grace <= 0 && p.invincible <= 0 && s.bubbles.some(bubble => capsuleBubbleHit(bubble, p))) loseBubbleLife();
    if (s.remaining <= 0 && running && s.clearDelay <= 0) {
      running = false;
      setOverlay(copy().timeUpTitle, copy().timeUp(s.hits, score), copy().retry);
    }
    if (s.clearDelay > 0) {
      s.clearDelay -= dt;
      if (s.clearDelay <= 0 && running) {
        running = false;
        playSfx('clear', .22);
        setOverlay(copy().clearTitle, copy().clear(s.hits, score), copy().oneMore);
      }
    }

    updateParticles(s.particles, dt);
    for (let i = s.floats.length - 1; i >= 0; i -= 1) {
      const item = s.floats[i];
      item.life -= dt;
      item.y -= 44 * scale * dt;
      if (item.life <= 0) s.floats.splice(i, 1);
    }
    updateScoreline(` · ${Math.ceil(s.remaining)} ${copy().seconds}`);
  }

  function drawGlossyBubble(bubble) {
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

  function drawBubblePaws() {
    const w = width();
    const h = height();
    const s = bubbleState;
    ctx.clearRect(0, 0, w, h);
    if (!drawCover(art.bubbleBg, 0, 0, w, h)) { ctx.fillStyle = '#163b32'; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = 'rgba(4,12,14,.20)';
    ctx.fillRect(0, 0, w, h);
    if (!s) return;

    const shakeX = (Math.random() - .5) * s.shake;
    const shakeY = (Math.random() - .5) * s.shake;
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

    for (const bubble of s.bubbles) drawGlossyBubble(bubble);
    for (const harpoon of s.harpoons) {
      const harpoonHeight = harpoon.baseY - harpoon.topY;
      if (!drawSprite(art.harpoon, harpoon.x - 7 * bubbleScale(), harpoon.topY, 14 * bubbleScale(), harpoonHeight)) {
        ctx.strokeStyle = '#e7c18b';
        ctx.lineWidth = 4 * bubbleScale();
        ctx.beginPath();
        ctx.moveTo(harpoon.x, harpoon.baseY);
        ctx.lineTo(harpoon.x, harpoon.topY);
        ctx.stroke();
      }
    }
    drawParticles(s.particles);
    for (const item of s.floats) {
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

    const p = s.player;
    const playerArt = p.shootPose > 0 ? art.bubbleShoot : art.bubbleIdle;
    const playerAlpha = p.invincible > 0 && Math.floor(p.invincible * 12) % 2 ? .28 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, floor + 2, p.w * .36, 4 * bubbleScale(), 0, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(playerArt, p.x, p.y, p.w, p.h, p.facing < 0, playerAlpha);
    ctx.restore();

    let hudX = 10;
    hudX += drawHudPill(`♥ ${s.lives}`, hudX, 9, '#d74755') + 5;
    hudX += drawHudPill(`${Math.ceil(s.remaining)} ${copy().seconds}`, hudX, 9, '#174c72') + 5;
    hudX += drawHudPill(`${s.bubbles.length} ${copy().bubbles}`, hudX, 9, '#7d4cc4') + 5;
    if (s.combo >= 2 && hudX < w - 95) drawHudPill(`${copy().combo} ×${s.combo}`, hudX, 9, '#ca7a16');
    ctx.font = '900 11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(255,255,255,.88)';
    ctx.textAlign = 'right';
    ctx.fillText(copy().level, w - 10, h - 10);
    ctx.textAlign = 'start';
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(.30, s.flash)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function update(dt) {
    if (game === 'jump') updateJump(dt);
    else updateBubblePaws(dt);
  }

  function draw() {
    if (game === 'jump') drawJump();
    else drawBubblePaws();
  }

  function loop(now) {
    if (!running) return;
    const frameDt = Math.min(1 / 15, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    accumulator += frameDt;
    let steps = 0;
    while (accumulator >= FIXED_STEP && steps < 4 && running) {
      update(FIXED_STEP);
      accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (steps >= 4) accumulator = 0;
    draw();
    if (running) animationFrame = requestAnimationFrame(loop);
  }

  function startGame() {
    cancelAnimationFrame(animationFrame);
    resizeCanvas();
    if (game === 'jump') initJump(); else initBubblePaws();
    overlay.hidden = true;
    running = true;
    accumulator = 0;
    lastFrame = performance.now();
    animationFrame = requestAnimationFrame(loop);
  }

  function performAction() {
    if (!running) { startGame(); return; }
    if (game === 'jump') jumpAction(); else fireHarpoon();
  }

  function setDemoDrawer(open) {
    demoDrawer.classList.toggle('is-open', open);
    demoDrawer.setAttribute('aria-hidden', String(!open));
    demoRail.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('demo-open', open);
    if (open) {
      requestAnimationFrame(() => {
        resizeCanvas();
        if (!running) selectGame(game);
        demoClose.focus();
      });
    } else {
      running = false;
      cancelAnimationFrame(animationFrame);
      selectGame(game);
      demoRail.focus();
    }
  }

  function selectGame(next) {
    game = next;
    running = false;
    cancelAnimationFrame(animationFrame);
    accumulator = 0;
    keys.left = keys.right = false;
    screen.classList.toggle('jump-mode', game === 'jump');
    screen.classList.toggle('pop-mode', game === 'pop');
    tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.game === game)));
    screen.setAttribute('aria-labelledby', game === 'jump' ? 'jump-tab' : 'pop-tab');
    resizeCanvas();
    if (game === 'jump') {
      initJump();
      setOverlay('Paw Jump', copy().jumpIntro);
    } else {
      initBubblePaws();
      setOverlay('Bubble Paws', copy().bubbleIntro);
    }
  }

  function refreshLanguageUi() {
    leftBtn.textContent = copy().left;
    rightBtn.textContent = copy().right;
    if (!running) {
      selectGame(game);
      return;
    }
    if (game === 'jump' && jumpState) {
      actionBtn.textContent = `${copy().doubleJump} ×${jumpState.doubleJumps}`;
      updateScoreline(` · ${Math.floor(jumpState.altitude / (12 * jumpScale()))} m`);
    } else if (bubbleState) {
      actionBtn.textContent = copy().fire;
      updateScoreline(` · ${Math.ceil(bubbleState.remaining)} ${copy().seconds}`);
    }
  }

  function bindHold(button, key) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      keys[key] = true;
      button.setPointerCapture?.(event.pointerId);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(name => button.addEventListener(name, () => { keys[key] = false; }));
  }

  bindHold(leftBtn, 'left');
  bindHold(rightBtn, 'right');
  actionBtn.addEventListener('pointerdown', event => { event.preventDefault(); performAction(); });
  restartBtn.addEventListener('click', startGame);
  startButton.addEventListener('click', startGame);
  demoRail.addEventListener('click', () => setDemoDrawer(true));
  openDemo.addEventListener('click', () => setDemoDrawer(true));
  demoClose.addEventListener('click', () => setDemoDrawer(false));
  drawerBackdrop.addEventListener('click', () => setDemoDrawer(false));
  tabs.forEach(tab => tab.addEventListener('click', () => selectGame(tab.dataset.game)));
  document.querySelectorAll('[data-play]').forEach(button => button.addEventListener('click', () => {
    selectGame(button.dataset.play);
    setDemoDrawer(true);
  }));
  canvas.addEventListener('pointerdown', event => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (game === 'pop' && bubbleState) {
      bubbleState.player.x = clamp(x - bubbleState.player.w / 2, 3, width() - bubbleState.player.w - 3);
      fireHarpoon();
    }
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && demoDrawer.classList.contains('is-open')) { setDemoDrawer(false); return; }
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) { keys.left = true; event.preventDefault(); }
    if (['ArrowRight', 'd', 'D'].includes(event.key)) { keys.right = true; event.preventDefault(); }
    if (event.key === ' ') { if (!event.repeat) performAction(); event.preventDefault(); }
  });
  window.addEventListener('keyup', event => {
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) keys.left = false;
    if (['ArrowRight', 'd', 'D'].includes(event.key)) keys.right = false;
  });
  window.addEventListener('firu:languagechange', refreshLanguageUi);
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (!running) selectGame(game);
  });
  Object.values(art).forEach(img => img.addEventListener('load', () => { if (!running) draw(); }));

  screen.classList.add('jump-mode');
  resizeCanvas();
  leftBtn.textContent = copy().left;
  rightBtn.textContent = copy().right;
  selectGame('jump');
})();
