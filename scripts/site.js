/* ============================================================
 * Distinct Services — site behavior (GSAP)
 * Hero canvas · Hero reveal timeline · Live console
 * Nav shrink · ScrollTrigger reveals · Live clock
 * ============================================================ */

gsap.registerPlugin(ScrollTrigger);

// ─── Nav: shrink on scroll ────────────────────────────────────
const nav = document.querySelector('.nav');
const onScrollNav = () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
};
window.addEventListener('scroll', onScrollNav, { passive: true });
onScrollNav();

// ─── Hero canvas: cursor-reactive particle field ──────────────
// Performance budget:
//  • Skip entirely on touch devices (no hover = no value) and when
//    prefers-reduced-motion is set (matched in CSS too).
//  • Particle count scales with viewport area (300 max, 90 min).
//  • Loop pauses when hero is scrolled out of view.
//  • Loop pauses when document is hidden (tab in background).
(function heroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  // Bail on touch / no-hover devices — cursor parallax adds zero value
  // and the cost (battery + thermal) is real on low-end phones.
  const isTouch = window.matchMedia('(hover: none)').matches ||
                  window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || reduceMotion) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  let W = 0, H = 0;
  let mx = -9999, my = -9999;
  let particles = [];
  let running = true;

  function buildParticleGrid() {
    // Target roughly 1 particle per 8000 px² of viewport, clamped.
    const area = W * H;
    const target = Math.max(90, Math.min(300, Math.round(area / 8000)));
    // Match grid aspect to viewport so spacing stays visually even
    const ar = W / Math.max(1, H);
    const rows = Math.max(8, Math.round(Math.sqrt(target / ar)));
    const cols = Math.max(10, Math.round(target / rows));
    particles = new Array(rows * cols);
    let i = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const ox = (c + 0.5) / cols * W;
        const oy = (r + 0.5) / rows * H;
        particles[i++] = { ox, oy, x: ox, y: oy, sz: 1.0 + Math.random() * 0.9 };
      }
    }
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildParticleGrid();
  }

  const heroEl = canvas.closest('.hero');
  if (heroEl) {
    heroEl.addEventListener('mousemove', e => {
      const r = heroEl.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    }, { passive: true });
    heroEl.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

    // Pause loop when hero is scrolled out of view
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        running = entries[0].isIntersecting;
        if (running) requestAnimationFrame(draw);
      }, { threshold: 0.01 });
      io.observe(heroEl);
    }
  }

  // Pause when tab loses focus — most impactful battery save
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden && (heroEl ? heroEl.getBoundingClientRect().bottom > 0 : true);
    if (running) requestAnimationFrame(draw);
  });

  function draw() {
    if (!running) return;
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];
      const dx = mx - p.ox, dy = my - p.oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / 230);
      p.x += (p.ox + dx * influence * 0.30 - p.x) * 0.072;
      p.y += (p.oy + dy * influence * 0.30 - p.y) * 0.072;
      const a  = 0.07 + influence * 0.40;
      const sz = p.sz + influence * 2.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, 6.2832);
      ctx.fillStyle = `rgba(115,243,164,${a.toFixed(2)})`;
      ctx.fill();
      if (influence > 0.22) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 4.5, 0, 6.2832);
        ctx.fillStyle = `rgba(115,243,164,${(influence * 0.055).toFixed(3)})`;
        ctx.fill();
      }
    }
  }

  resize();
  // Debounced resize — avoids rebuilding particles on every pixel
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(resize, 140);
  });
  requestAnimationFrame(draw);
})();

// ─── Hero GSAP reveal — tighter, less drawn-out ───────────────
(function heroTimeline() {
  const lines = gsap.utils.toArray('.hero-line-inner');
  if (!lines.length) return;

  gsap.set('.hero-eyebrow', { opacity: 0, y: 16 });
  gsap.set(lines,           { y: '108%' });
  gsap.set('.hero-sub',     { opacity: 0, y: 24 });
  gsap.set('.hero-cta-row', { opacity: 0, y: 18 });
  gsap.set('.hero-meta',    { opacity: 0, y: 14 });
  gsap.set('#scrollIndicator', { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl
    .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.55 })
    // Short tension pause (was 0.38, now 0.15) before heading erupts
    .to(lines, { y: '0%', duration: 0.75, ease: 'expo.out', stagger: 0.09 }, '+=0.15')
    .to('.hero-sub',     { opacity: 1, y: 0, duration: 0.6 }, '-=0.40')
    .to('.hero-cta-row', { opacity: 1, y: 0, duration: 0.55 }, '-=0.45')
    .to('.hero-meta',    { opacity: 1, y: 0, duration: 0.5 }, '-=0.40')
    .to('#scrollIndicator', { opacity: 1, duration: 0.6 }, '-=0.20');
})();

// ─── Scroll indicator: vanish on first scroll ────────────────
(function scrollIndicator() {
  const el = document.getElementById('scrollIndicator');
  if (!el) return;
  window.addEventListener('scroll', function hide() {
    if (window.scrollY > 60) {
      gsap.to(el, { opacity: 0, y: 12, duration: 0.6, ease: 'power3.out' });
      window.removeEventListener('scroll', hide);
    }
  }, { passive: true });
})();

// ─── Scroll reveals (all .reveal elements below fold) ────────
gsap.utils.toArray('.reveal').forEach(el => {
  const delay = parseFloat(el.dataset.delay || '0') / 1000;
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out',
    delay,
    scrollTrigger: {
      trigger: el,
      start: 'top 88%',
      toggleActions: 'play none none none',
    },
  });
});

// ─── Live console (flow section) ──────────────────────────────
(function liveConsole() {
  const consoleEl = document.querySelector('.console');
  if (!consoleEl) return;

  // ── Counters: animate 0 → target when console enters view
  const counters = consoleEl.querySelectorAll('[data-counter]');
  const storeBars = consoleEl.querySelectorAll('.store-bar .fill');

  ScrollTrigger.create({
    trigger: consoleEl,
    start: 'top 78%',
    once: true,
    onEnter: () => {
      counters.forEach((el, i) => {
        const target = parseInt(el.dataset.counter, 10);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2.0 + i * 0.08,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = Math.round(obj.v); },
        });
      });
      storeBars.forEach((el, i) => {
        const target = el.style.getPropertyValue('--w') || '0%';
        gsap.fromTo(el, { width: '0%' }, {
          width: target,
          duration: 1.4,
          ease: 'power3.out',
          delay: 0.35 + i * 0.10,
        });
      });
    },
  });

  // ── Cycle countdown + progress bar
  const cycleTimeEl = document.getElementById('cycleTime');
  const cycleFill = document.getElementById('cycleFill');
  const CYCLE_TOTAL = 30 * 60; // 30 min cycle
  let remaining = 8 * 60 + 42; // start at 8:42 for visual variety

  function fmt(s) {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  function tickCycle() {
    if (cycleTimeEl) cycleTimeEl.textContent = fmt(remaining);
    if (cycleFill) {
      const pct = ((CYCLE_TOTAL - remaining) / CYCLE_TOTAL) * 100;
      cycleFill.style.width = pct + '%';
    }
    remaining--;
    if (remaining < 0) remaining = CYCLE_TOTAL;
  }
  tickCycle();
  setInterval(tickCycle, 1000);

  // ── Live activity feed — rotating items
  const feedList = document.getElementById('feedList');
  if (!feedList) return;

  const MARKETPLACES = {
    Shopee:   { cls: 'mp-shopee' },
    ML:       { cls: 'mp-ml' },
    Amazon:   { cls: 'mp-amazon' },
    TikTok:   { cls: 'mp-tiktok' },
    Nuvem:    { cls: 'mp-nuvem' },
    Shopify:  { cls: 'mp-shopify' },
  };

  // Pool of realistic events; cycled in order
  const EVENTS = [
    { mp: 'Shopee',  action: 'NF emitida',         id: '#48291' },
    { mp: 'ML',      action: 'Envio programado',   id: '#48290' },
    { mp: 'Amazon',  action: 'Etiqueta impressa',  id: '#48289' },
    { mp: 'TikTok',  action: 'NF emitida',         id: '#48288' },
    { mp: 'Nuvem',   action: 'Envio programado',   id: '#48287' },
    { mp: 'Shopify', action: 'Etiqueta impressa',  id: '#48286' },
    { mp: 'Shopee',  action: 'Etiqueta impressa',  id: '#48285' },
    { mp: 'ML',      action: 'NF emitida',         id: '#48284' },
    { mp: 'Amazon',  action: 'Envio programado',   id: '#48283' },
    { mp: 'TikTok',  action: 'Etiqueta impressa',  id: '#48282' },
  ];

  const MAX_FEED = 5;
  let seq = 0;

  function makeItem(ev, isNew) {
    const mp = MARKETPLACES[ev.mp] || { cls: '' };
    const li = document.createElement('li');
    li.className = 'feed-item' + (isNew ? ' is-new' : '');
    li.innerHTML = `
      <span class="feed-badge ${mp.cls}">${ev.mp}</span>
      <span class="feed-action">${ev.action} · <strong>${ev.id}</strong></span>
      <span class="feed-time">agora</span>
    `;
    return li;
  }

  function updateTimes() {
    const items = feedList.querySelectorAll('.feed-item');
    items.forEach((item, i) => {
      const t = item.querySelector('.feed-time');
      if (!t) return;
      if (i === 0) t.textContent = 'agora';
      else if (i === 1) t.textContent = 'há 3s';
      else t.textContent = `há ${i * 4 - 1}s`;
    });
  }

  function addItem() {
    const ev = EVENTS[seq % EVENTS.length];
    seq++;
    const li = makeItem(ev, true);
    feedList.prepend(li);
    updateTimes();

    // Slide in animation
    gsap.fromTo(li,
      { opacity: 0, y: -14, scaleY: 0.85 },
      { opacity: 1, y: 0, scaleY: 1, duration: 0.6, ease: 'power3.out' }
    );

    // Drop highlight after a moment
    setTimeout(() => li.classList.remove('is-new'), 1400);

    // Trim list
    while (feedList.children.length > MAX_FEED) {
      const last = feedList.lastElementChild;
      gsap.to(last, {
        opacity: 0, y: 8, duration: 0.45, ease: 'power3.in',
        onComplete: () => last.remove(),
      });
    }
  }

  // Pre-populate 3 items for context
  for (let i = 0; i < 3; i++) {
    feedList.appendChild(makeItem(EVENTS[i], false));
    seq++;
  }
  updateTimes();

  // Rotate new item in every 3.5 s
  setInterval(addItem, 3500);
})();

// ─── FAQ accordion ───────────────────────────────────────────
// Keyboard-accessible: each Q is a <button>, ARIA expanded toggled.
// One-open-at-a-time pattern for tighter cognitive flow.
(function faqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // Close all others (one-open-at-a-time)
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.faq-q');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

// ─── Live clock (diferenciais) ────────────────────────────────
const diffClock = document.getElementById('diffClock');
function tickClock() {
  if (!diffClock) return;
  const d = new Date();
  diffClock.textContent =
    String(d.getHours()).padStart(2, '0') + 'h' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0');
}
tickClock();
setInterval(tickClock, 1000);
