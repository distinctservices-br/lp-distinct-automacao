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
(function heroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

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
  let running = false;
  let rafId = 0; // guard: only one rAF chain runs at a time

  // Pre-built fill-style lookup tables — avoids per-frame string alloc
  // 64 levels of opacity, pre-rendered as rgba strings
  const BASE_FILLS  = new Array(64);
  const GLOW_FILLS  = new Array(64);
  for (let i = 0; i < 64; i++) {
    const a = (0.07 + (i / 63) * 0.40).toFixed(2);
    const g = (i / 63 * 0.055).toFixed(3);
    BASE_FILLS[i] = `rgba(115,243,164,${a})`;
    GLOW_FILLS[i] = `rgba(115,243,164,${g})`;
  }

  function buildParticleGrid() {
    const area = W * H;
    // Reduced ceiling to 120 (was 300) — still looks great, costs ~60% less GPU
    const target = Math.max(60, Math.min(120, Math.round(area / 10000)));
    const ar = W / Math.max(1, H);
    const rows = Math.max(6, Math.round(Math.sqrt(target / ar)));
    const cols = Math.max(8, Math.round(target / rows));
    particles = new Array(rows * cols);
    let i = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const ox = (c + 0.5) / cols * W;
        const oy = (r + 0.5) / rows * H;
        particles[i++] = { ox, oy, x: ox, y: oy, sz: 1.0 + Math.random() * 0.9 };
      }
    }
    particles.length = i; // trim any extra slots
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildParticleGrid();
  }

  function scheduleResume() {
    // Only start a new rAF chain if one isn't already running
    if (running && rafId === 0) rafId = requestAnimationFrame(draw);
  }

  const heroEl = canvas.closest('.hero');
  if (heroEl) {
    heroEl.addEventListener('mousemove', e => {
      const r = heroEl.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    }, { passive: true });
    heroEl.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        running = entries[0].isIntersecting;
        if (running) scheduleResume();
      }, { threshold: 0.01 });
      io.observe(heroEl);
    }
  }

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden && (heroEl ? heroEl.getBoundingClientRect().bottom > 0 : true);
    if (running) scheduleResume();
  });

  function draw() {
    if (!running) {
      rafId = 0; // chain ends here; scheduleResume() will restart it if needed
      return;
    }
    rafId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];
      const dx = mx - p.ox, dy = my - p.oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / 230);
      p.x += (p.ox + dx * influence * 0.30 - p.x) * 0.072;
      p.y += (p.oy + dy * influence * 0.30 - p.y) * 0.072;

      // Map influence (0–1) to lookup index (0–63) — no string alloc
      const idx = Math.min(63, Math.round(influence * 63));
      const sz  = p.sz + influence * 2.8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, 6.2832);
      ctx.fillStyle = BASE_FILLS[idx];
      ctx.fill();

      if (influence > 0.22) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 4.5, 0, 6.2832);
        ctx.fillStyle = GLOW_FILLS[idx];
        ctx.fill();
      }
    }
  }

  resize();
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(resize, 140);
  });

  // Start running — visibility/intersection will pause it when appropriate
  running = true;
  rafId = requestAnimationFrame(draw);
})();

// ─── Hero GSAP reveal ─────────────────────────────────────────
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
    .to(lines, { y: '0%', duration: 0.75, ease: 'expo.out', stagger: 0.09 }, '+=0.15')
    .to('.hero-sub',     { opacity: 1, y: 0, duration: 0.6 }, '-=0.40')
    .to('.hero-cta-row', { opacity: 1, y: 0, duration: 0.55 }, '-=0.45')
    .to('.hero-meta',    { opacity: 1, y: 0, duration: 0.5 }, '-=0.40')
    .to('#scrollIndicator', { opacity: 1, duration: 0.6 }, '-=0.20');
})();

// ─── Scroll indicator: vanish on first scroll ─────────────────
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

// ─── Scroll reveals (all .reveal elements below fold) ─────────
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

  const counters  = consoleEl.querySelectorAll('[data-counter]');
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

  // ── Cycle countdown — pauses when tab is hidden
  const cycleTimeEl = document.getElementById('cycleTime');
  const cycleFill   = document.getElementById('cycleFill');
  const CYCLE_TOTAL = 30 * 60;
  let remaining = 8 * 60 + 42;

  function fmt(s) {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  function tickCycle() {
    if (document.hidden) return; // don't burn cycles in background
    if (cycleTimeEl) cycleTimeEl.textContent = fmt(remaining);
    if (cycleFill) {
      cycleFill.style.width = ((CYCLE_TOTAL - remaining) / CYCLE_TOTAL * 100) + '%';
    }
    remaining = remaining > 0 ? remaining - 1 : CYCLE_TOTAL;
  }
  tickCycle();
  setInterval(tickCycle, 1000);

  // ── Live activity feed
  const feedList = document.getElementById('feedList');
  if (!feedList) return;

  const MARKETPLACES = {
    Shopee:  { cls: 'mp-shopee' },
    ML:      { cls: 'mp-ml' },
    Amazon:  { cls: 'mp-amazon' },
    TikTok:  { cls: 'mp-tiktok' },
  };

  // Fluxo: para cada loja, executa a sequência completa em ordem
  // (busca → emite NF → programa envio → imprime etiqueta) antes de
  // partir pra próxima loja. Espelha como a Distinct opera de verdade.
  const STORES   = ['Shopee', 'ML', 'Amazon', 'TikTok'];
  const ACTIONS  = [
    'Pedidos capturados',
    'NF emitida',
    'Envio programado',
    'Etiqueta impressa',
  ];

  // Build sequential event list: store 1 (all 4 actions) → store 2 → ...
  const EVENTS = [];
  let baseId = 48282;
  STORES.forEach(mp => {
    ACTIONS.forEach(action => {
      EVENTS.push({ mp, action, id: '#' + (baseId++) });
    });
  });

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
      if (i === 0)      t.textContent = 'agora';
      else if (i === 1) t.textContent = 'há 3s';
      else              t.textContent = `há ${i * 4 - 1}s`;
    });
  }

  function addItem() {
    if (document.hidden) return; // skip updates when tab not visible

    const ev = EVENTS[seq % EVENTS.length];
    seq++;
    const li = makeItem(ev, true);
    feedList.prepend(li);
    updateTimes();

    gsap.fromTo(li,
      { opacity: 0, y: -14, scaleY: 0.85 },
      { opacity: 1, y: 0, scaleY: 1, duration: 0.6, ease: 'power3.out' }
    );
    setTimeout(() => li.classList.remove('is-new'), 1400);

    // Trim: kill any running tween on the outgoing element before removing
    while (feedList.children.length > MAX_FEED) {
      const last = feedList.lastElementChild;
      gsap.killTweensOf(last);
      gsap.to(last, {
        opacity: 0, y: 8, duration: 0.35, ease: 'power3.in',
        onComplete: () => { if (last.parentNode) last.remove(); },
      });
      break; // only trim one per tick
    }
  }

  // Pre-populate 3 static items
  for (let i = 0; i < 3; i++) {
    feedList.appendChild(makeItem(EVENTS[i], false));
    seq++;
  }
  updateTimes();
  setInterval(addItem, 3500);
})();

// ─── FAQ accordion ────────────────────────────────────────────
(function faqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          const ob = other.querySelector('.faq-q');
          if (ob) ob.setAttribute('aria-expanded', 'false');
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
  if (!diffClock || document.hidden) return;
  const d = new Date();
  diffClock.textContent =
    String(d.getHours()).padStart(2, '0')   + 'h' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0');
}
tickClock();
setInterval(tickClock, 1000);
