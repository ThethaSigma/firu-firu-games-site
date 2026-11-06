/* Firu Build Crew: original, dependency-free animation of the real page.
   No snapshots, extension APIs, copied third-party engine, or network calls. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const replay = document.getElementById('buildReplay');
  if (!replay || !window.requestAnimationFrame) return;
  const palette = ['#9f1239', '#111111', '#b91c1c', '#27272a', '#7f1d1d', '#450a0a'];
  const names = ['Firu', 'Paw', 'Pixel', 'Pop', 'Jump', 'Studio', 'Cloud', 'Bone', 'Nova', 'Milo', 'Luna', 'Atlas', 'Echo', 'Comet', 'Orbit', 'Spark', 'Byte', 'Blink', 'Patch', 'Bean', 'Moss', 'Pip', 'Rune', 'Dot', 'Leaf', 'Kite', 'Flux', 'Iris', 'Opal', 'Fern', 'Star', 'Wave', 'Sunny', 'Coco', 'Dash', 'Lumi'];
  const seenKey = 'firu-build-crew-v5';
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
      this.corrections = 0;
      this.paragraphs = 0;
      this.boxes = 0;
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
        edge: ['left', 'right', 'top', 'bottom'][Math.floor(random(0, 4))],
        initialScale: { x: random(.4, .6), y: random(.35, .55) },
        shift: { x: random(-20, 20), y: random(12, 28) }
      };
      task.adjustment = kind === 'box' && ++this.boxes % 4 === 1 ? .08 : .025;
      if (kind === 'text') {
        const entries = [];
        const walker = document.createTreeWalker(element, 4);
        let node;
        while ((node = walker.nextNode())) {
          if (!node.data.trim() || node.parentElement?.closest('[aria-hidden="true"]')) continue;
          if (getComputedStyle(node.parentElement || element).display === 'none') continue;
          entries.push({ node, original: node.data, parts: Array.from(node.data), written: null });
        }
        task.text = entries;
        task.characters = entries.reduce((sum, entry) => sum + entry.parts.length, 0);
        task.heading = /^(H2|H3)$/.test(element.tagName);
        if (!task.heading && element.tagName === 'P' && task.characters > 30 && ++this.paragraphs % 7 === 1 && this.corrections < 3) {
          const parts = entries.flatMap(entry => entry.parts);
          let index = Math.floor(parts.length * .58);
          while (index < parts.length - 3 && !/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(parts[index])) index++;
          task.correction = { index, letter: parts[index] === 'x' ? 'z' : 'x' };
          this.corrections++;
        }
        task.travelEnd = random(.07, .13);
        task.drawEnd = random(.3, .42);
        task.duration = (Math.min(4200, Math.max(850, task.characters * random(27, 38))) + 180) / (1 - task.drawEnd);
      }
      element.dataset.crewState = 'waiting';
      element.dataset.crewKind = kind;
      if (kind === 'tile') element.dataset.crewEdge = task.edge;
      this.tasks.push(task);
      return task;
    }
    addContents(element, dependency) {
      const accepted = [];
      element.querySelectorAll('h2, h3, p, small, figcaption, a.btn, button.btn, .press-link').forEach(child => {
        if (child.closest('[aria-hidden="true"]') || accepted.some(parent => parent.contains(child))) return;
        accepted.push(child);
        this.add(child, 'text', dependency);
      });
      element.querySelectorAll('img').forEach(image => this.add(image, 'image', dependency));
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
      document.querySelectorAll('.nav-links a').forEach(e => this.add(e, 'text'));
      this.add(document.querySelector('.language-switch'), 'image');
      const panel = this.add(document.querySelector('.hero-copy'), 'box');
      document.querySelectorAll('.hero-copy .official-store-link').forEach(e => this.add(e, 'image', panel));
      document.querySelectorAll('.hero-free, .hero .demo-text-link').forEach(e => this.add(e, 'text', panel));
      const selectors = '.section-head > h2, .section-head > p, .gossip-head > h2, .gossip-head > p, .game-card, .press-note, .story-shot, .process-story-copy, .step, .shipaton-banner, .notebook, .sticky-note, .proto, .quip, .finale > .shell > p, .finale h2, .finale .store-actions';
      const accepted = [];
      document.querySelectorAll(selectors).forEach(e => {
        if (accepted.some(parent => parent.contains(e))) return;
        accepted.push(e);
        const kind = /^(H2|P)$/.test(e.tagName) ? 'text' : e.classList.contains('story-shot') || e.classList.contains('shipaton-banner') || e.classList.contains('store-actions') ? 'panel' : 'box';
        const task = this.add(e, kind);
        if (task && kind === 'box') this.addContents(e, task);
      });
    }
    setupView() {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'crew-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.g = this.canvas.getContext('2d');
      if (!this.g) throw new Error('Canvas is unavailable');
      this.sizeCanvas();
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
      this.skip.addEventListener('click', () => this.finish('skip'));
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
    sizeCanvas() {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      this.viewportWidth = innerWidth;
      this.canvas.width = Math.round((document.documentElement.clientWidth || innerWidth) * ratio);
      this.canvas.height = Math.round(innerHeight * ratio);
      this.g.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize() {
      const width = innerWidth;
      if (Math.abs(width - this.viewportWidth) > 2) { this.finish('resize'); return; }
      // Mobile browser chrome changes the height while scrolling. Keep all jobs.
      this.sizeCanvas();
      for (const task of this.tasks) {
        if (!task.bounds || task.state === 'done') continue;
        const state = task.element.dataset.crewState;
        if (state === 'sizing') task.element.dataset.crewState = 'placed';
        const headingScale = task.element.style.getPropertyValue('--crew-heading-scale');
        if (headingScale) task.element.style.setProperty('--crew-heading-scale', '1');
        const r = task.element.getBoundingClientRect();
        task.bounds = { left: r.left + (window.scrollX || 0), top: r.top + (window.scrollY || 0), width: r.width, height: r.height };
        if (state === 'sizing') task.element.dataset.crewState = state;
        if (headingScale) task.element.style.setProperty('--crew-heading-scale', headingScale);
      }
      this.wake();
    }
    start() {
      this.collect();
      this.setupView();
      document.documentElement.classList.add('crew-active');
      this.on(window, 'scroll', () => this.wake(), { passive: true });
      this.on(window, 'resize', () => this.resize());
      this.on(window, 'pagehide', () => this.finish('pagehide'));
      this.on(window, 'keydown', e => { if (e.key === 'Escape' || e.key === 'Tab') this.finish(e.key); }, true);
      this.on(window, 'firu:languagechange', () => this.finish('language'));
      this.on(document, 'visibilitychange', () => { if (document.hidden) this.finish('hidden'); });
      this.on(document, 'click', e => {
        if (e.target.closest('[data-play], #demoRail, #openDemo')) { this.finish('demo'); return; }
        const link = e.target.closest('a');
        if (link && !['#oyunlar', '#surec', '#yorumlar', '#top'].includes(link.getAttribute('href'))) this.finish('download');
      }, true);
      // A failed frame or interrupted asset load must never leave content hidden.
      this.safety = setTimeout(() => this.finish('timeout'), 15000);
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
      this.restoreText(task);
      task.element.removeAttribute('data-crew-state');
      task.element.removeAttribute('data-crew-kind');
      task.element.removeAttribute('data-crew-edge');
      task.element.removeAttribute('data-crew-correction');
      task.element.removeAttribute('data-crew-heading');
      task.element.style.removeProperty('--crew-progress');
      for (const property of ['--crew-scale-x', '--crew-scale-y', '--crew-shift-x', '--crew-shift-y', '--crew-heading-scale']) task.element.style.removeProperty(property);
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
        if (task.state !== 'wait' && task.state !== 'paused') continue;
        if (task.dependency && task.dependency.state !== 'done') continue;
        const r = task.state === 'paused' ? this.rect(task) : task.element.getBoundingClientRect();
        if (task.state === 'wait' && r.bottom < -20) { this.complete(task); continue; }
        if (!this.inView(task, r, true)) continue;
        ready.push(task);
      }
      ready.sort((a, b) => (a.state === 'paused' ? 0 : 1) - (b.state === 'paused' ? 0 : 1) || a.order - b.order);
      for (const agent of this.agents) {
        if (agent.task || now < agent.availableAt || !ready.length) continue;
        const task = ready.shift();
        agent.task = task;
        task.agent = agent;
        const resume = task.state === 'paused';
        task.state = 'active';
        task.at = resume ? now - task.resumeOffset : now + agent.stagger;
        agent.stagger = random(20, 280);
        task.from = { x: agent.x, y: agent.y };
        if (!resume && (task.kind === 'text' || task.kind === 'box')) {
          const r = task.element.getBoundingClientRect();
          task.bounds = { left: r.left + (window.scrollX || 0), top: r.top + (window.scrollY || 0), width: r.width, height: r.height };
        }
      }
      return ready.length > 0;
    }
    inView(task, r, starting = false) {
      if (r.width <= 0 || r.height <= 0 || r.right <= 0 || r.left >= innerWidth) return false;
      const visible = Math.min(r.bottom, innerHeight - 24) - Math.max(r.top, 0);
      if (!starting) return visible >= 2;
      const threshold = task.kind === 'text' ? Math.min(r.height * .65, 72)
        : task.kind === 'box' || task.kind === 'panel' ? Math.min(r.height * .28, 140)
        : Math.min(r.height * .25, 60);
      return visible >= Math.max(2, threshold);
    }
    pause(task, agent, now) {
      task.resumeOffset = task.elapsed ?? now - task.at;
      task.state = 'paused';
      task.agent = null;
      agent.task = null;
      agent.availableAt = now;
    }
    rect(task) {
      if (!task.bounds) return task.element.getBoundingClientRect();
      const { width, height } = task.bounds;
      const left = task.bounds.left - (window.scrollX || 0);
      const top = task.bounds.top - (window.scrollY || 0);
      return { left, top, width, height, right: left + width, bottom: top + height };
    }
    beginText(task, r) {
      if (task.textStarted || !task.text) return;
      task.textStarted = true;
      task.savedSize = ['width', 'height'].map(property => ({ property, value: task.element.style.getPropertyValue(property), priority: task.element.style.getPropertyPriority(property) }));
      task.element.style.setProperty('width', `${r.width}px`);
      task.element.style.setProperty('height', `${r.height}px`);
      task.accessibleLabel = task.text.map(entry => entry.original).join('').trim();
      task.savedLabel = task.element.getAttribute('aria-label');
      if (task.accessibleLabel) task.element.setAttribute('aria-label', task.accessibleLabel);
      if (task.heading) {
        task.element.dataset.crewHeading = 'true';
        task.element.style.setProperty('--crew-heading-scale', '.62');
      }
      this.typeText(task, 0);
    }
    typeText(task, count, mistake = false) {
      if (task.typed === count && task.mistake === mistake) return;
      task.typed = count;
      task.mistake = mistake;
      let remaining = count;
      let offset = 0;
      for (const entry of task.text || []) {
        const length = Math.max(0, Math.min(entry.parts.length, remaining));
        remaining -= length;
        const parts = entry.parts.slice(0, length);
        const correctionIndex = task.correction?.index - offset;
        if (mistake && correctionIndex >= 0 && correctionIndex < length) parts[correctionIndex] = task.correction.letter;
        const next = parts.join('');
        offset += entry.parts.length;
        if (entry.written !== next) { entry.node.data = next; entry.written = next; }
      }
    }
    writeProgress(task, progress) {
      if (task.heading) {
        this.typeText(task, Math.min(task.characters, Math.floor(progress / .62 * task.characters)));
        const grow = clamp((progress - .62) / .34);
        const scale = grow < .72 ? .62 + .42 * ease(grow / .72) : 1.04 - .04 * ease((grow - .72) / .28);
        task.element.style.setProperty('--crew-heading-scale', String(scale));
        return grow;
      }
      if (!task.correction) {
        this.typeText(task, Math.min(task.characters, Math.floor(progress / .94 * task.characters)));
        return 0;
      }
      const index = task.correction.index;
      if (progress < .47) {
        this.typeText(task, Math.floor(progress / .47 * index));
      } else if (progress < .57) {
        task.element.dataset.crewCorrection = 'mistake';
        this.typeText(task, index + 1, true);
      } else if (progress < .65) {
        task.element.dataset.crewCorrection = 'delete';
        this.typeText(task, index);
      } else {
        task.element.dataset.crewCorrection = 'corrected';
        this.typeText(task, Math.min(task.characters, index + Math.floor((progress - .65) / .31 * (task.characters - index))));
      }
      return 0;
    }
    restoreText(task) {
      if (!task.textStarted) return;
      for (const entry of task.text || []) {
        // A language switch may replace text nodes. Never overwrite the new copy.
        if (task.element.contains(entry.node) && entry.node.data === entry.written) entry.node.data = entry.original;
      }
      for (const { property, value, priority } of task.savedSize || []) {
        if (value) task.element.style.setProperty(property, value, priority);
        else task.element.style.removeProperty(property);
      }
      if (task.element.getAttribute('aria-label') === task.accessibleLabel) {
        if (task.savedLabel !== null) task.element.setAttribute('aria-label', task.savedLabel);
        else task.element.removeAttribute('aria-label');
      }
      task.textStarted = false;
    }
    resizeRect(task, r, p) {
      const initial = task.initialScale;
      let sx, sy, shift;
      if (p < .42) {
        const n = ease(p / .42);
        sx = initial.x + (1 + task.adjustment - initial.x) * n; sy = initial.y; shift = 1;
      } else if (p < .78) {
        const n = ease((p - .42) / .36);
        sx = 1 + task.adjustment * (1 - n); sy = initial.y + (1 + task.adjustment - initial.y) * n; shift = 1 - n * .25;
      } else {
        const n = ease((p - .78) / .22);
        sx = 1; sy = 1 + task.adjustment * (1 - n); shift = .75 * (1 - n);
      }
      const width = r.width * sx;
      const viewport = document.documentElement.clientWidth || innerWidth;
      const left = Math.max(4, Math.min(viewport - width - 4, r.left + task.shift.x * shift));
      const top = r.top + task.shift.y * shift;
      if (task.kind === 'box') {
        task.element.dataset.crewState = 'sizing';
        task.element.style.setProperty('--crew-scale-x', String(sx));
        task.element.style.setProperty('--crew-scale-y', String(sy));
        task.element.style.setProperty('--crew-shift-x', `${left - r.left}px`);
        task.element.style.setProperty('--crew-shift-y', `${task.shift.y * shift}px`);
      }
      return { left, top, width: r.width * sx, height: r.height * sy, right: left + r.width * sx, bottom: top + r.height * sy };
    }
    guides(task, target, moving, progress) {
      if (this.guideCount >= (this.small ? 2 : 4) || progress < .48) return;
      this.guideCount++;
      const g = this.g;
      const tint = '#e11d48';
      const width = document.documentElement.clientWidth || innerWidth;
      g.save();
      g.globalAlpha = Math.min(1, (progress - .48) * 5);
      g.strokeStyle = tint; g.lineWidth = 1;
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(target.left, Math.max(75, target.top - 70));
      g.lineTo(target.left, Math.min(innerHeight - 30, target.bottom + 70));
      g.moveTo(Math.max(0, target.left - 90), target.top);
      g.lineTo(Math.min(width, target.right + 90), target.top);
      g.stroke(); g.setLineDash([]);
      const delta = Math.abs(moving.left - target.left);
      if (delta > 1.5 && delta < 40) {
        const y = Math.max(95, target.top - 18);
        this.measureGap(target.left, y, moving.left, y, `${Math.round(delta)} px`, tint);
      }
      if (progress > .9) {
        g.fillStyle = tint;
        g.fillRect(target.left - 3, target.top - 3, 6, 6);
      }
      // Show a real gap to an adjacent card, using its final layout bounds.
      if (task.kind === 'box') {
        const sibling = task.element.previousElementSibling;
        if (sibling && sibling.parentElement === task.element.parentElement) {
          const other = sibling.getBoundingClientRect();
          const gap = target.left - other.right;
          if (gap >= 8 && gap <= 90 && Math.abs(other.top - target.top) < 12) {
            const y = Math.max(95, target.top + Math.min(55, target.height / 2));
            this.measureGap(other.right, y, target.left, y, `${Math.round(gap)} px`, tint);
          }
        }
      }
      g.restore();
    }
    measureGap(x1, y1, x2, y2, label, color) {
      const g = this.g;
      g.strokeStyle = color; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x1, y1 - 4); g.lineTo(x1, y1 + 4);
      g.moveTo(x1, y1); g.lineTo(x2, y2); g.moveTo(x2, y2 - 4); g.lineTo(x2, y2 + 4); g.stroke();
      g.font = '700 10px monospace';
      const w = g.measureText(label).width + 10;
      const x = Math.max(5, Math.min(innerWidth - w - 5, (x1 + x2 - w) / 2));
      g.fillStyle = color; g.fillRect(x, y1 - 22, w, 16);
      g.fillStyle = '#fff'; g.fillText(label, x + 5, y1 - 10);
    }
    textCaret(task, r) {
      const entry = [...(task.text || [])].reverse().find(item => item.written?.length);
      if (entry && document.createRange) {
        try {
          const range = document.createRange();
          const last = Array.from(entry.written).pop();
          range.setStart(entry.node, entry.written.length - last.length);
          range.setEnd(entry.node, entry.written.length);
          const rectangles = Array.from(range.getClientRects()).filter(rect => rect.height > 0 && rect.width > 0);
          const rect = rectangles[rectangles.length - 1];
          if (rect) return { x: rect.right + 2, y: rect.top + rect.height / 2, height: rect.height };
        } catch (_) { /* Empty or replaced text can use the box's origin. */ }
      }
      return { x: r.left + 2, y: r.top + 12, height: 22 };
    }
    dimensions(r, color) {
      if (this.small || r.width < 90) return;
      const g = this.g;
      const label = `${Math.round(r.width)} × ${Math.round(r.height)}`;
      g.font = '700 10px monospace';
      const width = g.measureText(label).width + 12;
      const y = Math.max(18, r.top - 7);
      g.fillStyle = color; g.fillRect(r.left, y - 15, width, 19);
      g.fillStyle = '#fff'; g.fillText(label, r.left + 6, y - 2);
    }
    outline(r, p, color, task) {
      const g = this.g;
      const length = 2 * (r.width + r.height);
      g.save();
      g.strokeStyle = '#ffffffdf';
      g.lineWidth = 3.3;
      g.setLineDash([length * clamp(p), length + 1]);
      const corners = [[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]];
      const direction = task.reverse ? -1 : 1;
      g.beginPath();
      g.moveTo(...corners[task.corner]);
      for (let i = 1; i <= 4; i++) g.lineTo(...corners[(task.corner + direction * i + 4) % 4]);
      g.stroke();
      g.strokeStyle = color; g.lineWidth = 1.5; g.stroke();
      g.setLineDash([]);
      for (const [x, y] of [[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]]) {
        g.fillStyle = '#fff'; g.fillRect(x - 3, y - 3, 6, 6); g.strokeRect(x - 3, y - 3, 6, 6);
      }
      for (const [x, y] of [[r.left + r.width / 2, r.top], [r.right, r.top + r.height / 2], [r.left + r.width / 2, r.bottom], [r.left, r.top + r.height / 2]]) {
        g.fillStyle = '#fff'; g.fillRect(x - 2, y - 2, 4, 4); g.strokeRect(x - 2, y - 2, 4, 4);
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
    drawAgent(agent, label = true) {
      const g = this.g;
      g.save();
      g.globalAlpha = 1;
      g.translate(agent.x, agent.y);
      g.scale(.82, .82);
      g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.beginPath();
      g.lineJoin = 'miter';
      if (agent.tool === 'text') {
        g.moveTo(-5, -12); g.lineTo(5, -12); g.moveTo(0, -12); g.lineTo(0, 12); g.moveTo(-5, 12); g.lineTo(5, 12);
        g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke();
        g.strokeStyle = agent.color; g.lineWidth = 2.5; g.stroke();
      } else if (agent.tool === 'resize') {
        g.moveTo(0, 0); g.lineTo(14, 14); g.moveTo(0, 7); g.lineTo(0, 0); g.lineTo(7, 0);
        g.moveTo(7, 14); g.lineTo(14, 14); g.lineTo(14, 7);
        g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke();
        g.strokeStyle = agent.color; g.lineWidth = 2.5; g.stroke();
      } else {
        g.moveTo(0, 0); g.lineTo(0, 26); g.lineTo(7, 19); g.lineTo(13, 31); g.lineTo(18, 28); g.lineTo(12, 17); g.lineTo(25, 17); g.closePath();
        g.fillStyle = agent.color; g.strokeStyle = '#fff'; g.lineWidth = 2.3; g.fill(); g.stroke();
      }
      if (label) {
        g.font = '800 11px Nunito, sans-serif';
        const width = g.measureText(agent.name).width + 14;
        g.fillStyle = agent.color;
        g.beginPath(); g.roundRect(18, 27, width, 21, 2); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = .9; g.stroke();
        g.fillStyle = '#fff'; g.fillText(agent.name, 25, 41);
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
        this.guideCount = 0;
        const waiting = this.schedule(now);
        const dt = Math.min(.05, Math.max(0, (now - this.lastFrame) / 1000));
        this.lastFrame = now;
        const blend = 1 - Math.exp(-dt * 7);
        const anchors = [];
        let busy = 0;
        for (const agent of this.agents) {
          const task = agent.task;
          if (!task) continue;
          const r = this.rect(task);
          if (!this.inView(task, r)) { this.pause(task, agent, now); continue; }
          agent.tool = 'arrow';
          busy++;
          if (now < task.at) {
            task.elapsed = now - task.at;
            this.driftAgent(agent, now, task.from, blend);
            this.drawAgent(agent, agent.id % 2 === 0);
            continue;
          }
          const p = clamp((now - task.at) / task.duration);
          task.elapsed = now - task.at;
          if (task.kind === 'text') this.beginText(task, r);
          anchors.push({ x: Math.max(25, Math.min(innerWidth - 25, r.left + r.width / 2)), y: Math.max(40, Math.min(innerHeight - 70, r.top + r.height / 2)) });
          let point;
          if (p < task.travelEnd) {
            const move = ease(p / task.travelEnd);
            const start = task.kind === 'text' || task.kind === 'box'
              ? { x: r.left + task.shift.x, y: r.top + task.shift.y }
              : this.perimeter(r, 0, task);
            const curve = Math.sin(move * Math.PI) * task.bend;
            point = { x: task.from.x + (start.x - task.from.x) * move + curve, y: task.from.y + (start.y - task.from.y) * move + curve * .6 };
          } else if (p < task.drawEnd) {
            const draw = (p - task.travelEnd) / (task.drawEnd - task.travelEnd);
            if (task.kind === 'box' || task.kind === 'text') {
              const box = this.resizeRect(task, r, draw);
              this.outline(box, Math.min(1, draw * 5), agent.color, task);
              this.dimensions(box, agent.color);
              this.guides(task, r, box, draw);
              point = { x: box.right, y: box.bottom };
              agent.tool = 'resize';
            } else {
              point = this.perimeter(r, draw, task);
              this.outline(r, draw, agent.color, task);
            }
          } else {
            const reveal = clamp((p - task.drawEnd) / (1 - task.drawEnd));
            this.outline(r, 1, agent.color, task);
            this.dimensions(r, agent.color);
            if (task.kind === 'text') {
              task.element.dataset.crewState = 'typing';
              const growing = this.writeProgress(task, reveal);
              const caret = this.textCaret(task, r);
              point = caret;
              agent.tool = 'text';
              if (task.heading && growing > 0) {
                const scale = Number(task.element.style.getPropertyValue('--crew-heading-scale'));
                const box = { ...r, width: r.width * scale, height: r.height * scale, right: r.left + r.width * scale, bottom: r.top + r.height * scale };
                point = { x: box.right, y: box.bottom };
                agent.tool = 'resize';
                this.guides(task, r, box, growing);
                this.outline(box, 1, agent.color, task);
              } else if (Math.floor(now / 350) % 2 === 0) {
                this.g.strokeStyle = agent.color; this.g.lineWidth = 2;
                this.g.beginPath(); this.g.moveTo(caret.x, caret.y - caret.height / 2); this.g.lineTo(caret.x, caret.y + caret.height / 2); this.g.stroke();
              }
            } else if (task.kind === 'box') {
              task.element.dataset.crewState = 'placed';
              point = { x: r.right, y: r.bottom };
              agent.tool = 'resize';
            } else {
              task.element.dataset.crewState = 'drawing';
              task.element.style.setProperty('--crew-progress', `${reveal * 100}%`);
              point = { x: r.left + r.width * reveal, y: task.kind === 'panel' ? r.top + r.height * reveal : r.top + Math.min(r.height, 34) };
            }
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
          }
          agent.x = Math.max(-30, Math.min(innerWidth + 30, point.x));
          agent.y = Math.max(-35, Math.min(innerHeight + 35, point.y));
          this.drawAgent(agent);
          if (p === 1) this.complete(task, now);
        }
        if (busy || waiting) for (const agent of this.agents) {
          if (agent.task) continue;
          agent.tool = 'arrow';
          const anchor = anchors[agent.id % Math.max(1, anchors.length)] || { x: innerWidth / 2, y: innerHeight / 2 };
          this.driftAgent(agent, now, anchor, blend);
          this.drawAgent(agent, agent.id % 3 === 0);
        }
        if (now - this.lastHud > 200) { this.updateHud(busy > 0 || waiting); this.lastHud = now; }
        if (this.done === this.tasks.length) { this.finish('complete'); return; }
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
        this.finish('error');
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
    finish(reason = 'manual') {
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
      document.documentElement.dataset.crewResult = reason;
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
    delete document.documentElement.dataset.crewResult;
    current = crew;
    try {
      crew.start();
      if (fromTop) crew.skip.focus({ preventScroll: true });
    } catch (error) { crew.finish('error'); console.warn('Firu build animation skipped.', error); }
  }
  replay.addEventListener('click', () => start(true));
  motion.addEventListener('change', () => { replay.hidden = motion.matches; if (motion.matches) stop(); });
  replay.hidden = motion.matches;
  window.firuConstruction = { replay: () => start(true), stop, get active() { return !!current; } };
  if (!motion.matches && (!seen() || new URLSearchParams(location.search).get('build') === '1')) start();
})();
