(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
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
    jumpHero: image('assets/paw_jump_hero.webp'),
    platform: image('assets/platform_normal.webp'),
    spring: image('assets/platform_spring.webp'),
    bone: image('assets/collectible_bone.webp'),
    airJump: image('assets/powerup_air_jump.webp'),
    bubbleBg: image('assets/bubble_paws_bg.webp'),
    bubbleIdle: image('assets/bubble_paws_firu.webp'),
    bubbleShoot: image('assets/bubble_paws_shoot.png'),
    bubble: image('assets/bubble_wood.webp'),
    harpoon: image('assets/harpoon.webp')
  };

  let game = 'jump';
  let running = false;
  let animationFrame = 0;
  let lastFrame = 0;
  let score = 0;
  let best = Number(localStorage.getItem('firu-web-best') || 0);
  let keys = { left: false, right: false };
  let jumpState = null;
  let bubbleState = null;
  const uiCopy = {
    tr: {
      score: 'SKOR', best: 'EN İYİ', start: 'Oyunu başlat', retry: 'Tekrar dene', oneMore: 'Bir tur daha',
      left: '← SOL', right: 'SAĞ →', doubleJump: 'ÇİFT ZIPLA', fire: 'ATEŞ', seconds: 'sn', combo: 'KOMBO',
      jumpIntro: 'Firu otomatik sıçrar. Sağa-sola yönlendir, platformlara in, kemikleri topla; havada boşlukla çift zıpla.',
      bubbleIntro: 'Firu’yu sağa-sola taşı. ATEŞ ya da boşlukla zıpkın fırlat; büyük balonları küçük parçalara ayır ve hepsini temizle.',
      jumpEndTitle: 'Paw Jump turu bitti',
      jumpEnd: (metres, bones) => `${metres} metreye çıktın ve ${bones} kemik topladın.`,
      clearTitle: 'Alan temiz!',
      clear: hits => `${hits} isabetle tüm balonları parçaladın.`,
      bubbleEndTitle: 'Bubble Paws turu bitti',
      bubbleEnd: (hits, points) => `${hits} balon vuruşu yaptın ve ${points} puan topladın.`
    },
    en: {
      score: 'SCORE', best: 'BEST', start: 'Start game', retry: 'Try again', oneMore: 'One more run',
      left: '← LEFT', right: 'RIGHT →', doubleJump: 'DOUBLE JUMP', fire: 'FIRE', seconds: 's', combo: 'COMBO',
      jumpIntro: 'Firu jumps automatically. Steer left and right, land on platforms, collect bones, and press space to double-jump in mid-air.',
      bubbleIntro: 'Move Firu left and right. Press FIRE or space to launch the harpoon, split large bubbles, and clear them all.',
      jumpEndTitle: 'Paw Jump run over',
      jumpEnd: (metres, bones) => `You climbed ${metres} metres and collected ${bones} bones.`,
      clearTitle: 'Arena clear!',
      clear: hits => `You cleared every bubble in ${hits} hits.`,
      bubbleEndTitle: 'Bubble Paws run over',
      bubbleEnd: (hits, points) => `You made ${hits} bubble hits and scored ${points} points.`
    }
  };

  const copy = () => uiCopy[document.documentElement.lang === 'en' ? 'en' : 'tr'];

  const width = () => canvas.clientWidth;
  const height = () => canvas.clientHeight;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
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
    best = Math.max(best, score);
    localStorage.setItem('firu-web-best', String(best));
    scoreline.textContent = `${copy().score} ${String(score).padStart(3, '0')} · ${copy().best} ${String(best).padStart(3, '0')}${extra}`;
  }

  function drawHudPill(text, x, y, color = '#11162e') {
    ctx.font = '800 14px ui-monospace, monospace';
    const w = ctx.measureText(text).width + 22;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 30, 11);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x + 11, y + 20);
    return w;
  }

  // ── Paw Jump ───────────────────────────────────────────────────────────
  function jumpScale() {
    return Math.max(.72, Math.min(1.05, height() / 520));
  }

  function makePlatform(x, y, w, type = 'normal') {
    return { x, y, w, h: 20 * jumpScale(), type, vx: type === 'moving' ? (Math.random() < .5 ? -58 : 58) : 0, landed: false };
  }

  function addJumpItem(platform) {
    const roll = Math.random();
    if (roll < .10) {
      jumpState.items.push({ type: 'air', x: platform.x + platform.w / 2 - 18, y: platform.y - 43, w: 36, h: 36, spin: 0 });
    } else if (roll < .48) {
      jumpState.items.push({ type: 'bone', x: platform.x + platform.w / 2 - 12, y: platform.y - 31, w: 24, h: 24, spin: 0 });
    }
  }

  function generateJumpPlatform() {
    const s = jumpState;
    const top = s.platforms.reduce((a, b) => a.y < b.y ? a : b);
    const gap = clamp(72 + s.altitude / 900, 72, 106) * jumpScale();
    const w = clamp(width() * (.17 + Math.random() * .06), 72, 112);
    const reach = clamp(width() * .28, 120, 190);
    const x = clamp(top.x + (Math.random() * 2 - 1) * reach, 10, width() - w - 10);
    const springChance = s.altitude > 220 ? .15 : .07;
    const movingChance = s.altitude > 420 ? .16 : 0;
    const roll = Math.random();
    const type = roll < springChance ? 'spring' : roll < springChance + movingChance ? 'moving' : 'normal';
    const platform = makePlatform(x, top.y - gap, w, type);
    s.platforms.push(platform);
    addJumpItem(platform);
  }

  function initJump() {
    const w = width();
    const h = height();
    const scale = jumpScale();
    score = 0;
    const platforms = [
      makePlatform(w * .34, h - 24, w * .30),
      makePlatform(w * .08, h * .73, w * .22),
      makePlatform(w * .57, h * .55, w * .22, 'spring'),
      makePlatform(w * .27, h * .36, w * .20),
      makePlatform(w * .65, h * .18, w * .19)
    ];
    jumpState = {
      player: { x: w * .48, y: h - 84, w: 58 * scale, h: 58 * scale, vx: 0, vy: -560 * scale, facing: 1, invincible: 0 },
      platforms,
      items: [],
      altitude: 0,
      bones: 0,
      landings: 0,
      bonusScore: 0,
      lives: 3,
      doubleJumps: 1,
      combo: 0
    };
    platforms.slice(1).forEach(addJumpItem);
    actionBtn.textContent = `${copy().doubleJump} ×1`;
    updateScoreline(' · 0 m');
    drawJump();
  }

  function jumpAction() {
    if (!running || game !== 'jump' || !jumpState) return;
    const p = jumpState.player;
    if (jumpState.doubleJumps <= 0 || p.vy >= 520 * jumpScale()) return;
    p.vy = -525 * jumpScale();
    jumpState.doubleJumps -= 1;
    actionBtn.textContent = `${copy().doubleJump} ×${jumpState.doubleJumps}`;
  }

  function loseJumpLife() {
    const s = jumpState;
    s.lives -= 1;
    if (s.lives <= 0) {
      running = false;
      setOverlay(copy().jumpEndTitle, copy().jumpEnd(Math.floor(s.altitude / 12), s.bones), copy().retry);
      return;
    }
    const landing = s.platforms.filter(p => p.y > height() * .48 && p.y < height() - 12).sort((a, b) => a.y - b.y)[0] || s.platforms[0];
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
    if (direction) p.vx += clamp(target - p.vx, -acceleration * dt, acceleration * dt);
    else p.vx *= Math.max(0, 1 - 8 * dt);
    if (Math.abs(p.vx) > 3) p.facing = Math.sign(p.vx);
    const oldBottom = p.y + p.h;
    p.x += p.vx * dt;
    p.vy = Math.min(900 * scale, p.vy + 980 * scale * dt);
    p.y += p.vy * dt;
    p.invincible = Math.max(0, p.invincible - dt);
    if (p.x + p.w < 0) p.x = width();
    if (p.x > width()) p.x = -p.w;

    for (const platform of s.platforms) {
      if (platform.vx) {
        platform.x += platform.vx * dt;
        if (platform.x < 6 || platform.x + platform.w > width() - 6) platform.vx *= -1;
      }
      if (p.vy > 40 && oldBottom <= platform.y + 6 && p.y + p.h >= platform.y && p.x + p.w * .75 > platform.x && p.x + p.w * .25 < platform.x + platform.w) {
        p.y = platform.y - p.h;
        p.vy = (platform.type === 'spring' ? -900 : -560) * scale;
        s.landings += 1;
        const centered = Math.abs((p.x + p.w / 2) - (platform.x + platform.w / 2)) < platform.w * .22;
        s.combo = centered ? Math.min(15, s.combo + 1) : 0;
        s.bonusScore += 10 + Math.floor(s.combo / 5) * 5;
        platform.landed = true;
      }
    }

    for (let i = s.items.length - 1; i >= 0; i -= 1) {
      const item = s.items[i];
      item.spin += dt * 2.4;
      if (overlaps(p, item)) {
        if (item.type === 'bone') { s.bones += 1; s.bonusScore += 25; }
        else { s.doubleJumps = Math.min(3, s.doubleJumps + 1); actionBtn.textContent = `${copy().doubleJump} ×${s.doubleJumps}`; }
        s.items.splice(i, 1);
      }
    }

    const threshold = height() * .42;
    if (p.y < threshold) {
      const shift = threshold - p.y;
      p.y = threshold;
      s.altitude += shift;
      s.platforms.forEach(platform => platform.y += shift);
      s.items.forEach(item => item.y += shift);
    }
    s.platforms = s.platforms.filter(platform => platform.y < height() + 70);
    s.items = s.items.filter(item => item.y < height() + 60);
    while (s.platforms.reduce((min, platform) => Math.min(min, platform.y), height()) > -70) generateJumpPlatform();
    if (p.y > height() + 45) loseJumpLife();
    score = Math.floor(s.altitude / 12) + s.bonusScore;
    updateScoreline(` · ${Math.floor(s.altitude / 12)} m`);
    drawJump();
  }

  function drawJump() {
    const w = width();
    const h = height();
    ctx.clearRect(0, 0, w, h);
    if (!drawCover(art.jumpBg, 0, 0, w, h)) { ctx.fillStyle = '#55c5ed'; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = 'rgba(22,63,92,.08)'; ctx.fillRect(0, 0, w, h);
    const s = jumpState;
    if (!s) return;
    for (const platform of s.platforms) {
      const img = platform.type === 'spring' ? art.spring : art.platform;
      if (!drawSprite(img, platform.x, platform.y - 4, platform.w, platform.h + 10)) {
        ctx.fillStyle = platform.type === 'spring' ? '#ffcf5a' : '#54c56f';
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      }
      if (platform.type === 'moving') {
        ctx.fillStyle = '#6677ff'; ctx.fillRect(platform.x + platform.w * .35, platform.y + platform.h - 1, platform.w * .3, 4);
      }
    }
    for (const item of s.items) {
      const bob = Math.sin(item.spin * 3) * 3;
      drawSprite(item.type === 'bone' ? art.bone : art.airJump, item.x, item.y + bob, item.w, item.h);
    }
    const p = s.player;
    drawSprite(art.jumpHero, p.x, p.y, p.w, p.h, p.facing < 0, p.invincible > 0 && Math.floor(p.invincible * 10) % 2 ? .35 : 1);
    drawHudPill(`♥ ${s.lives}`, 12, 12, '#d74755');
    drawHudPill(`${Math.floor(s.altitude / 12)} m`, 78, 12, '#174c72');
    if (s.combo >= 5) drawHudPill(`${copy().combo} ×${1 + Math.floor(s.combo / 5)}`, 150, 12, '#7d4cc4');
  }

  // ── Bubble Paws ────────────────────────────────────────────────────────
  function makeBubble(x, y, r, stage, direction = 1) {
    return { x, y, r, stage, vx: direction * (72 + stage * 18), vy: -240 - stage * 28, spin: Math.random() * 6 };
  }

  function initBubblePaws() {
    const w = width();
    const h = height();
    score = 0;
    bubbleState = {
      player: { x: w / 2 - 30, y: h - 91, w: 60, h: 72, vx: 0, facing: 1, invincible: 0, shootPose: 0 },
      bubbles: [makeBubble(w * .20, 90, 43, 0, 1), makeBubble(w * .52, 68, 37, 0, -1), makeBubble(w * .80, 112, 31, 1, -1)],
      harpoons: [],
      lives: 5,
      remaining: 45,
      shootCooldown: 0,
      pops: 0
    };
    actionBtn.textContent = copy().fire;
    updateScoreline(` · 45 ${copy().seconds}`);
    drawBubblePaws();
  }

  function fireHarpoon() {
    if (!running || game !== 'pop' || !bubbleState) return;
    const s = bubbleState;
    if (s.shootCooldown > 0 || s.harpoons.length >= 1) return;
    const p = s.player;
    const baseY = p.y + 15;
    s.harpoons.push({ x: p.x + p.w / 2, topY: baseY - 12, baseY });
    s.shootCooldown = .22;
    p.shootPose = .18;
  }

  function splitBubble(index) {
    const s = bubbleState;
    const bubble = s.bubbles[index];
    s.bubbles.splice(index, 1);
    s.pops += 1;
    score += 100 * (bubble.stage + 1);
    if (bubble.stage < 2) {
      const radius = Math.max(12, bubble.r * .68);
      s.bubbles.push(makeBubble(bubble.x - 5, bubble.y, radius, bubble.stage + 1, -1));
      s.bubbles.push(makeBubble(bubble.x + 5, bubble.y, radius, bubble.stage + 1, 1));
    }
    if (!s.bubbles.length) {
      running = false;
      setOverlay(copy().clearTitle, copy().clear(s.pops), copy().oneMore);
    }
  }

  function hitBubblePlayer(bubble, player) {
    const cx = clamp(bubble.x, player.x + player.w * .32, player.x + player.w * .68);
    const cy = clamp(bubble.y, player.y + player.h * .28, player.y + player.h * .78);
    return Math.hypot(bubble.x - cx, bubble.y - cy) < bubble.r * .86 + 8;
  }

  function loseBubbleLife() {
    const s = bubbleState;
    s.lives -= 1;
    if (s.lives <= 0) {
      running = false;
      setOverlay(copy().bubbleEndTitle, copy().bubbleEnd(s.pops, score), copy().retry);
      return;
    }
    s.player.x = width() / 2 - s.player.w / 2;
    s.player.vx = 0;
    s.player.invincible = 1.8;
    s.bubbles.forEach((bubble, index) => { bubble.y = 55 + index * 22; bubble.vy = -220; });
  }

  function updateBubblePaws(dt) {
    const s = bubbleState;
    const p = s.player;
    const direction = Number(keys.right) - Number(keys.left);
    const target = direction * 280;
    const accel = direction && Math.sign(target) !== Math.sign(p.vx) ? 6800 : 4200;
    if (direction) p.vx += clamp(target - p.vx, -accel * dt, accel * dt);
    else p.vx += clamp(-p.vx, -5200 * dt, 5200 * dt);
    p.x = clamp(p.x + p.vx * dt, 4, width() - p.w - 4);
    if (Math.abs(p.vx) > 3) p.facing = Math.sign(p.vx);
    p.invincible = Math.max(0, p.invincible - dt);
    p.shootPose = Math.max(0, p.shootPose - dt);
    s.shootCooldown = Math.max(0, s.shootCooldown - dt);
    s.remaining = Math.max(0, s.remaining - dt);

    const floor = height() - 24;
    for (const bubble of s.bubbles) {
      bubble.vy += 640 * dt;
      bubble.x += bubble.vx * dt;
      bubble.y += bubble.vy * dt;
      bubble.spin += bubble.vx * dt * .008;
      if (bubble.x - bubble.r < 3) { bubble.x = bubble.r + 3; bubble.vx = Math.abs(bubble.vx); }
      if (bubble.x + bubble.r > width() - 3) { bubble.x = width() - bubble.r - 3; bubble.vx = -Math.abs(bubble.vx); }
      if (bubble.y - bubble.r < 34) { bubble.y = bubble.r + 34; bubble.vy = Math.abs(bubble.vy); }
      if (bubble.y + bubble.r > floor) {
        bubble.y = floor - bubble.r;
        bubble.vy = -[535, 455, 365][bubble.stage];
      }
    }

    for (let h = s.harpoons.length - 1; h >= 0; h -= 1) {
      const harpoon = s.harpoons[h];
      harpoon.topY -= 680 * dt;
      let hit = -1;
      for (let b = 0; b < s.bubbles.length; b += 1) {
        const bubble = s.bubbles[b];
        if (Math.abs(harpoon.x - bubble.x) <= bubble.r * .94 && harpoon.topY <= bubble.y + bubble.r && harpoon.baseY >= bubble.y - bubble.r) { hit = b; break; }
      }
      if (hit >= 0) { s.harpoons.splice(h, 1); splitBubble(hit); }
      else if (harpoon.topY < 34) s.harpoons.splice(h, 1);
    }

    if (p.invincible <= 0 && s.bubbles.some(bubble => hitBubblePlayer(bubble, p))) loseBubbleLife();
    if (s.remaining <= 0 && running) {
      running = false;
      setOverlay('Süre doldu', `${s.pops} balon vuruşuyla ${score} puan topladın.`, 'Tekrar dene');
    }
    updateScoreline(` · ${Math.ceil(s.remaining)} ${copy().seconds}`);
    drawBubblePaws();
  }

  function drawBubblePaws() {
    const w = width();
    const h = height();
    ctx.clearRect(0, 0, w, h);
    if (!drawCover(art.bubbleBg, 0, 0, w, h)) { ctx.fillStyle = '#163b32'; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = 'rgba(4,12,14,.12)'; ctx.fillRect(0, 0, w, h);
    const s = bubbleState;
    if (!s) return;
    ctx.fillStyle = 'rgba(17,22,46,.48)'; ctx.fillRect(0, h - 24, w, 24);
    for (const bubble of s.bubbles) {
      ctx.save();
      ctx.translate(bubble.x, bubble.y);
      ctx.rotate(bubble.spin);
      if (art.bubble.complete && art.bubble.naturalWidth) ctx.drawImage(art.bubble, -bubble.r, -bubble.r, bubble.r * 2, bubble.r * 2);
      else { ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.arc(0, 0, bubble.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = ['#ffcf5a', '#6ee7c7', '#ff6b6b'][bubble.stage];
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, bubble.r - 1.5, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    for (const harpoon of s.harpoons) {
      const harpoonHeight = harpoon.baseY - harpoon.topY;
      if (!drawSprite(art.harpoon, harpoon.x - 7, harpoon.topY, 14, harpoonHeight)) {
        ctx.strokeStyle = '#d7b17b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(harpoon.x, harpoon.baseY); ctx.lineTo(harpoon.x, harpoon.topY); ctx.stroke();
      }
    }
    const p = s.player;
    const playerArt = p.shootPose > 0 ? art.bubbleShoot : art.bubbleIdle;
    drawSprite(playerArt, p.x, p.y, p.w, p.h, p.facing < 0, p.invincible > 0 && Math.floor(p.invincible * 10) % 2 ? .3 : 1);
    drawHudPill(`♥ ${s.lives}`, 12, 12, '#d74755');
    drawHudPill(`${Math.ceil(s.remaining)} sn`, 78, 12, '#174c72');
    drawHudPill(`${s.bubbles.length} BALON`, 160, 12, '#7d4cc4');
  }

  // ── Shared loop and controls ───────────────────────────────────────────
  function loop(now) {
    if (!running) return;
    const dt = Math.min(1 / 30, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (game === 'jump') updateJump(dt);
    else updateBubblePaws(dt);
    if (running) animationFrame = requestAnimationFrame(loop);
  }

  function startGame() {
    cancelAnimationFrame(animationFrame);
    resizeCanvas();
    if (game === 'jump') initJump(); else initBubblePaws();
    overlay.hidden = true;
    running = true;
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
    keys.left = keys.right = false;
    tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.game === game)));
    document.getElementById('game-screen').setAttribute('aria-labelledby', game === 'jump' ? 'jump-tab' : 'pop-tab');
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
      updateScoreline(` · ${Math.floor(jumpState.altitude / 12)} m`);
    } else if (bubbleState) {
      actionBtn.textContent = copy().fire;
      updateScoreline(` · ${Math.ceil(bubbleState.remaining)} ${copy().seconds}`);
    }
  }

  function bindHold(button, key) {
    button.addEventListener('pointerdown', event => { event.preventDefault(); keys[key] = true; button.setPointerCapture?.(event.pointerId); });
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
    if (game === 'pop' && bubbleState) bubbleState.player.x = clamp(x - bubbleState.player.w / 2, 4, width() - bubbleState.player.w - 4);
    performAction();
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
  window.addEventListener('resize', () => { resizeCanvas(); if (!running) selectGame(game); });
  Object.values(art).forEach(img => img.addEventListener('load', () => { if (!running) game === 'jump' ? drawJump() : drawBubblePaws(); }));

  resizeCanvas();
  leftBtn.textContent = copy().left;
  rightBtn.textContent = copy().right;
  selectGame('jump');
})();
