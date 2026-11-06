/* Firu Build Crew: original, dependency-free animation of the real page.
   No snapshots, extension APIs, copied third-party engine, or network calls. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const replay = document.getElementById('buildReplay');
  if (!replay || !window.requestAnimationFrame) return;
  const palette = ['#83edd1', '#ffd369', '#b6a4ff', '#ff8baf', '#72caff', '#f2a56b'];
  const names = ['Firu', 'Paw', 'Pixel', 'Pop', 'Jump', 'Studio', 'Cloud', 'Bone', 'Nova', 'Milo', 'Luna', 'Atlas', 'Echo', 'Comet', 'Orbit', 'Spark', 'Byte', 'Blink', 'Patch', 'Bean', 'Moss', 'Pip', 'Rune', 'Dot', 'Leaf', 'Kite', 'Flux', 'Iris', 'Opal', 'Fern', 'Star', 'Wave', 'Sunny', 'Coco', 'Dash', 'Lumi'];
  const seenKey = 'firu-build-crew-v2';
  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => 1 - Math.pow(1 - clamp(n), 3);
  const copy = () => document.documentElement.lang === 'en'
    ? { title: 'FIRU BUILD CREW', skip: 'Skip ↗', building: 'A little teamwork. A whole world.', scroll: 'Scroll to watch the rest take shape.', label: 'Site construction animation' }
    : { title: 'FIRU BUILD CREW', skip: 'Atla ↗', building: 'Biraz ekip işi. Kocaman bir dünya.', scroll: 'Kaydır, devamını birlikte kuralım.', label: 'Sitenin inşa edilme animasyonu' };
  let current = null;
  function seen() { try { return sessionStorage.getItem(seenKey) === '1'; } catch (_) { return false; } }
  function markSeen() { try { sessionStorage.setItem(seenKey, '1'); } catch (_) { /* Storage is optional. */ } }

  class Crew {
    constructor() {
      this.dead = false;
      this.tasks = [];
      this.shutters = [];
      this.done = 0;
      this.raf = 0;
      this.unbinds = [];
      this.small = innerWidth < 760;
      this.lastHud = 0;
      this.safety = 0;
      this.prepared = false;
      this.lastFrame = 0;
    }
    on(target, event, fn, options) {
      target.addEventListener(event, fn, options);
      this.unbinds.push(() => target.removeEventListener(event, fn, options));
    }
    add(element, kind, dependency = null) {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4 || getComputedStyle(element).display === 'none') return null;
      const duration = kind === 'tile' ? random(1500, 3300) : kind === 'text' ? random(950, 1900) : random(1250, 2500);
      const task = {
        element, kind, dependency, state: 'wait', at: 0, duration, agent: null,
        order: Math.random(), corner: Math.floor(random(0, 4)), reverse: Math.random() < .5,
        travelEnd: random(.15, .3), drawEnd: random(.55, .78), bend: random(-130, 130),
        edge: ['left', 'right', 'top', 'bottom'][Math.floor(random(0, 4))]
      };
      element.dataset.crewState = 'waiting';
      element.dataset.crewKind = kind;
      if (kind === 'tile') element.dataset.crewEdge = task.edge;
      this.tasks.push(task);
      return task;
    }
    collect() {
      const hero = document.querySelector('.hero-world');
      if (hero) {
        const rect = hero.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          const cols = this.small ? 3 : 8;
          const rows = 5;
          for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
            const shutter = document.createElement('div');
            shutter.className = 'crew-shutter';
            shutter.setAttribute('aria-hidden', 'true');
            shutter.style.cssText = `left:${x / cols * 100}%;top:${y / rows * 100}%;width:calc(${100 / cols}% + 1px);height:calc(${100 / rows}% + 1px)`;
            hero.appendChild(shutter);
            this.shutters.push(shutter);
            this.add(shutter, 'tile');
          }
        }
      }
      this.add(document.querySelector('.brand'), 'image');
      document.querySelectorAll('.nav-links a, .language-switch').forEach(e => this.add(e, 'text'));
      const panel = this.add(document.querySelector('.hero-copy'), 'panel');
      document.querySelectorAll('.hero-copy .official-store-link, .hero-free, .hero .demo-text-link').forEach(e => this.add(e, 'image', panel));
      const selectors = '.section-head > h2, .section-head > p, .game-card, .press-note, .story-shot, .process-story-copy, .step, .shipaton-banner, .notebook, .sticky-note, .proto, .quip, .finale > .shell > p, .finale h2, .finale .store-actions';
      const accepted = [];
      document.querySelectorAll(selectors).forEach(e => {
        if (accepted.some(parent => parent.contains(e))) return;
        accepted.push(e);
        this.add(e, /^(H2|P)$/.test(e.tagName) ? 'text' : 'panel');
      });
    }
    setupView() {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'crew-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.width = Math.round((document.documentElement.clientWidth || innerWidth) * Math.min(devicePixelRatio || 1, 2));
      this.canvas.height = Math.round(innerHeight * Math.min(devicePixelRatio || 1, 2));
      this.g = this.canvas.getContext('2d');
      if (!this.g) throw new Error('Canvas is unavailable');
      this.g.scale(Math.min(devicePixelRatio || 1, 2), Math.min(devicePixelRatio || 1, 2));
      this.hud = document.createElement('div');
      this.hud.className = 'crew-hud';
      const title = document.createElement('strong');
      title.textContent = copy().title;
      this.status = document.createElement('span');
      this.status.className = 'crew-status';
      this.status.setAttribute('role', 'status');
      this.skip = document.createElement('button');
      this.skip.type = 'button';
      this.skip.className = 'crew-skip';
      this.skip.addEventListener('click', () => this.finish());
      this.progress = document.createElement('div');
      this.progress.className = 'crew-progress';
      this.progress.setAttribute('role', 'progressbar');
      this.progress.setAttribute('aria-valuemin', '0');
      this.progress.setAttribute('aria-valuemax', '100');
      this.fill = document.createElement('i');
      this.progress.appendChild(this.fill);
      this.hud.append(title, this.status, this.skip, this.progress);
      document.body.append(this.canvas, this.hud);
      this.agents = Array.from({ length: this.small ? 16 : 36 }, (_, i) => ({
        id: i, x: random(15, innerWidth - 20), y: random(40, innerHeight * .8),
        color: palette[i % palette.length], name: names[i % names.length], task: null,
        availableAt: 0, stagger: random(0, 850), phase: random(0, Math.PI * 2),
        drift: random(.55, 1.4), radius: random(25, this.small ? 65 : 140)
      }));
      this.updateHud(false);
    }
    start() {
      this.collect();
      this.setupView();
      document.documentElement.classList.add('crew-active');
      this.on(window, 'scroll', () => this.wake(), { passive: true });
      this.on(window, 'resize', () => this.finish());
      this.on(window, 'pagehide', () => this.finish());
      this.on(window, 'keydown', e => { if (e.key === 'Escape' || e.key === 'Tab') this.finish(); }, true);
      this.on(window, 'firu:languagechange', () => this.finish());
      this.on(document, 'visibilitychange', () => { if (document.hidden) this.finish(); });
      this.on(document, 'click', e => {
        if (e.target.closest('a, [data-play], #demoRail, #openDemo')) this.finish();
      }, true);
      // A failed frame or interrupted asset load must never leave content hidden.
      this.safety = setTimeout(() => this.finish(), 10000);
      Promise.race([document.fonts?.ready || Promise.resolve(), new Promise(r => setTimeout(r, 600))]).then(() => {
        if (this.dead) return;
        this.prepared = true;
        this.wake();
      });
    }
    wake() {
      if (this.dead || !this.prepared || document.hidden || this.raf) return;
      this.canvas.style.opacity = '1';
      this.hud.hidden = false;
      document.documentElement.classList.add('crew-active');
      this.raf = requestAnimationFrame(t => this.frame(t));
    }
    reveal(task) {
      task.element.removeAttribute('data-crew-state');
      task.element.removeAttribute('data-crew-kind');
      task.element.removeAttribute('data-crew-edge');
      task.element.style.removeProperty('--crew-progress');
      if (task.kind === 'tile') task.element.remove();
    }
    complete(task, now = 0) {
      if (task.state === 'done') return;
      task.state = 'done';
      this.done++;
      this.reveal(task);
      if (task.agent) {
        task.agent.task = null;
        task.agent.availableAt = now + random(100, 550);
      }
    }
    schedule(now) {
      const ready = [];
      for (const task of this.tasks) {
        if (task.state !== 'wait') continue;
        const r = task.element.getBoundingClientRect();
        if (r.bottom < -20) { this.complete(task); continue; }
        if (r.top > innerHeight - 15 || r.right <= 0 || r.left >= innerWidth) continue;
        if (task.dependency && task.dependency.state !== 'done') continue;
        ready.push(task);
      }
      ready.sort((a, b) => a.order - b.order);
      for (const agent of this.agents) {
        if (agent.task || now < agent.availableAt || !ready.length) continue;
        const task = ready.shift();
        agent.task = task;
        task.agent = agent;
        task.state = 'active';
        task.at = now + agent.stagger;
        agent.stagger = random(20, 280);
        task.from = { x: agent.x, y: agent.y };
      }
      return ready.length > 0;
    }
    outline(r, p, color, task) {
      const g = this.g;
      const length = 2 * (r.width + r.height);
      g.save();
      g.strokeStyle = color;
      g.lineWidth = 1.3;
      g.setLineDash([length * clamp(p), length + 1]);
      const corners = [[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]];
      const direction = task.reverse ? -1 : 1;
      g.beginPath();
      g.moveTo(...corners[task.corner]);
      for (let i = 1; i <= 4; i++) g.lineTo(...corners[(task.corner + direction * i + 4) % 4]);
      g.stroke();
      g.setLineDash([]);
      for (const [x, y] of [[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]]) {
        g.fillStyle = '#0b1429'; g.fillRect(x - 3, y - 3, 6, 6); g.strokeRect(x - 3, y - 3, 6, 6);
      }
      g.restore();
    }
    perimeter(r, p, task) {
      const length = 2 * (r.width + r.height);
      const offset = [0, r.width, r.width + r.height, 2 * r.width + r.height][task.corner];
      let d = ((offset + (task.reverse ? -1 : 1) * clamp(p) * length) % length + length) % length;
      if (d <= r.width) return { x: r.left + d, y: r.top };
      d -= r.width;
      if (d <= r.height) return { x: r.right, y: r.top + d };
      d -= r.height;
      if (d <= r.width) return { x: r.right - d, y: r.bottom };
      return { x: r.left, y: r.bottom - (d - r.width) };
    }
    drawAgent(agent, alpha = 1, label = true) {
      const g = this.g;
      g.save();
      g.globalAlpha = alpha;
      g.translate(agent.x, agent.y);
      g.scale(this.small ? .7 : .75, this.small ? .7 : .75);
      g.shadowColor = '#02071680'; g.shadowBlur = 5; g.shadowOffsetY = 2;
      g.beginPath();
      g.moveTo(0, 0); g.lineTo(3, 23); g.lineTo(9, 16); g.lineTo(15, 28); g.lineTo(20, 25); g.lineTo(14, 14); g.lineTo(24, 12); g.closePath();
      g.fillStyle = agent.color; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.lineJoin = 'round'; g.fill(); g.stroke();
      g.shadowBlur = 0; g.shadowOffsetY = 0;
      if (label) {
        g.font = '800 11px Nunito, sans-serif';
        const width = g.measureText(agent.name).width + 14;
        g.fillStyle = agent.color;
        g.beginPath(); g.roundRect(18, 27, width, 21, 5); g.fill();
        g.fillStyle = '#101426'; g.fillText(agent.name, 25, 41);
      }
      g.restore();
    }
    driftAgent(agent, now, anchor, blend) {
      const t = now * .001 * agent.drift + agent.phase;
      const x = Math.max(10, Math.min(innerWidth - 25, anchor.x + Math.cos(t * 1.7) * agent.radius));
      const y = Math.max(15, Math.min(innerHeight - 50, anchor.y + Math.sin(t * 1.3) * agent.radius * .65));
      agent.x += (x - agent.x) * blend;
      agent.y += (y - agent.y) * blend;
    }
    frame(now) {
      this.raf = 0;
      if (this.dead) return;
      try {
        this.g.clearRect(0, 0, innerWidth, innerHeight);
        const waiting = this.schedule(now);
        const dt = Math.min(.05, Math.max(0, (now - this.lastFrame) / 1000));
        this.lastFrame = now;
        const blend = 1 - Math.exp(-dt * 7);
        const anchors = [];
        let busy = 0;
        for (const agent of this.agents) {
          const task = agent.task;
          if (!task) continue;
          busy++;
          if (now < task.at) {
            this.driftAgent(agent, now, task.from, blend);
            this.drawAgent(agent, .8, agent.id % 2 === 0);
            continue;
          }
          const p = clamp((now - task.at) / task.duration);
          const r = task.element.getBoundingClientRect();
          anchors.push({ x: Math.max(25, Math.min(innerWidth - 25, r.left + r.width / 2)), y: Math.max(40, Math.min(innerHeight - 70, r.top + r.height / 2)) });
          let point;
          if (p < task.travelEnd) {
            const move = ease(p / task.travelEnd);
            const start = this.perimeter(r, 0, task);
            const curve = Math.sin(move * Math.PI) * task.bend;
            point = { x: task.from.x + (start.x - task.from.x) * move + curve, y: task.from.y + (start.y - task.from.y) * move + curve * .6 };
          } else if (p < task.drawEnd) {
            const draw = (p - task.travelEnd) / (task.drawEnd - task.travelEnd);
            point = this.perimeter(r, draw, task);
            this.outline(r, draw, agent.color, task);
          } else {
            const reveal = clamp((p - task.drawEnd) / (1 - task.drawEnd));
            const progress = task.kind === 'text' ? Math.ceil(reveal * 22) / 22 : reveal;
            task.element.dataset.crewState = 'drawing';
            task.element.style.setProperty('--crew-progress', `${progress * 100}%`);
            this.outline(r, 1, agent.color, task);
            point = { x: r.left + r.width * reveal, y: task.kind === 'panel' ? r.top + r.height * reveal : r.top + Math.min(r.height, 34) };
            const wiggle = Math.sin(reveal * 18 + agent.phase) * Math.sin(reveal * Math.PI) * 5;
            if (task.kind === 'tile') {
              if (task.edge === 'left' || task.edge === 'right') {
                point.x = task.edge === 'left' ? r.left + r.width * reveal : r.right - r.width * reveal;
                point.y = r.top + r.height / 2 + wiggle;
              } else {
                point.x = r.left + r.width / 2 + wiggle;
                point.y = task.edge === 'top' ? r.top + r.height * reveal : r.bottom - r.height * reveal;
              }
            }
            if (!this.small && r.width > 90) {
              this.g.fillStyle = agent.color; this.g.font = '700 10px monospace';
              this.g.fillText(`${Math.round(r.width)} × ${Math.round(r.height)}`, r.left + 6, Math.max(12, r.top - 8));
            }
          }
          agent.x = Math.max(-30, Math.min(innerWidth + 30, point.x));
          agent.y = Math.max(-35, Math.min(innerHeight + 35, point.y));
          this.drawAgent(agent);
          if (p === 1) this.complete(task, now);
        }
        if (busy || waiting) for (const agent of this.agents) {
          if (agent.task) continue;
          const anchor = anchors[agent.id % Math.max(1, anchors.length)] || { x: innerWidth / 2, y: innerHeight / 2 };
          this.driftAgent(agent, now, anchor, blend);
          this.drawAgent(agent, .6, agent.id % 3 === 0);
        }
        if (now - this.lastHud > 200) { this.updateHud(busy > 0 || waiting); this.lastHud = now; }
        if (this.done === this.tasks.length) { this.finish(); return; }
        if (busy || waiting) {
          this.raf = requestAnimationFrame(t => this.frame(t));
        } else {
          // Offscreen sections wait for a scroll; no animation loop runs at rest.
          this.canvas.style.opacity = '0';
          document.documentElement.classList.remove('crew-active');
          clearTimeout(this.safety);
          this.safety = 0;
          this.updateHud(false);
        }
      } catch (error) {
        console.warn('Firu build animation ended safely.', error);
        this.finish();
      }
    }
    updateHud(busy) {
      const text = copy();
      this.hud.hidden = !busy && this.done > 0;
      this.status.textContent = busy ? text.building : text.scroll;
      this.skip.textContent = text.skip;
      const progress = Math.round(this.done / Math.max(1, this.tasks.length) * 100);
      this.progress.setAttribute('aria-label', text.label);
      this.progress.setAttribute('aria-valuenow', String(progress));
      this.fill.style.width = `${progress}%`;
    }
    finish() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      clearTimeout(this.safety);
      this.unbinds.forEach(unbind => unbind());
      this.tasks.forEach(task => this.reveal(task));
      this.shutters.forEach(shutter => shutter.remove());
      const hadFocus = this.hud?.contains(document.activeElement);
      this.canvas?.remove();
      this.hud?.remove();
      document.documentElement.classList.remove('crew-active');
      if (current === this) current = null;
      if (hadFocus) document.querySelector('.hero .official-store-link')?.focus({ preventScroll: true });
    }
  }
  function stop() {
    if (current) current.finish();
  }
  function start(fromTop = false) {
    stop();
    if (motion.matches || document.hidden || document.body.classList.contains('demo-open')) return;
    if (fromTop) window.scrollTo({ top: 0, behavior: 'instant' });
    markSeen();
    const crew = new Crew();
    current = crew;
    try {
      crew.start();
      if (fromTop) crew.skip.focus({ preventScroll: true });
    } catch (error) { crew.finish(); console.warn('Firu build animation skipped.', error); }
  }
  replay.addEventListener('click', () => start(true));
  motion.addEventListener('change', () => { replay.hidden = motion.matches; if (motion.matches) stop(); });
  replay.hidden = motion.matches;
  window.firuConstruction = { replay: () => start(true), stop, get active() { return !!current; } };
  if (!motion.matches && (!seen() || new URLSearchParams(location.search).get('build') === '1')) start();
})();
