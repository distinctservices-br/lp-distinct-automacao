/* ============================================================
 * Distinct Services — site behavior v2
 * Lenis smooth scroll · SplitType hero · Magnetic CTA
 * Nav shrink · ScrollTrigger reveals · Trust counters
 * Live console · FAQ accordion · Live clock
 * ============================================================ */

gsap.registerPlugin(ScrollTrigger);

// ─── Lenis smooth scroll ──────────────────────────────────────
// Integrated with GSAP ticker for frame-perfect sync
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis;
if (!reduceMotion && typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Sync ScrollTrigger with Lenis scroll position
  lenis.on('scroll', ScrollTrigger.update);
}

// ─── Nav: shrink on scroll ────────────────────────────────────
const nav = document.querySelector('.nav');
function onScrollNav() {
  const scrolled = lenis ? lenis.scroll > 30 : window.scrollY > 30;
  nav.classList.toggle('scrolled', scrolled);
}
if (lenis) {
  lenis.on('scroll', onScrollNav);
} else {
  window.addEventListener('scroll', onScrollNav, { passive: true });
}
onScrollNav();

// ─── Hero: SplitType word reveal + result card ────────────────
(function heroReveal() {
  const heading = document.querySelector('.js-hero-heading');
  if (!heading) return;

  // SplitType splits h1 into .word spans, each becomes an overflow mask
  let splitInstance;
  if (typeof SplitType !== 'undefined') {
    splitInstance = new SplitType(heading, { types: 'words' });
    // Wrap each word's inner content so we can clip-path reveal it
    splitInstance.words.forEach(word => {
      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.style.cssText = 'display:inline-block; clip-path: inset(0 0 100% 0);';
      while (word.firstChild) inner.appendChild(word.firstChild);
      word.style.cssText = 'overflow:hidden; display:inline-block; padding-bottom:0.06em; vertical-align:bottom;';
      word.appendChild(inner);
    });
  }

  // FOUC guard: set initial hidden states
  gsap.set('.hero-eyebrow', { opacity: 0, y: 10 });
  gsap.set('.hero-sub',     { opacity: 0, y: 20 });
  gsap.set('.hero-cta-row', { opacity: 0, y: 16 });
  gsap.set('.hero-right',   { opacity: 0, x: 40 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });

  // Eyebrow line
  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.5 });

  // Headline words clip-path reveal
  if (splitInstance && splitInstance.words.length) {
    const inners = heading.querySelectorAll('.word-inner');
    tl.to(inners, {
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.06,
    }, '-=0.25');
  }

  // Sub + CTA
  tl.to('.hero-sub',     { opacity: 1, y: 0, duration: 0.65 }, '-=0.45')
    .to('.hero-cta-row', { opacity: 1, y: 0, duration: 0.55 }, '-=0.5');

  // Right card slides in
  tl.to('.hero-right', { opacity: 1, x: 0, duration: 0.9, ease: 'expo.out' }, '-=0.85');

  // Mini cards cascade in after main card
  const minis = gsap.utils.toArray('.hero-mini');
  if (minis.length) {
    gsap.set(minis, { opacity: 0, y: 12, scale: 0.92 });
    tl.to(minis, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.55, ease: 'back.out(1.4)',
      stagger: 0.12,
    }, '-=0.3');
  }

  // Hero result card: subtle parallax on scroll
  const heroRight = document.querySelector('.hero-right');
  if (heroRight) {
    gsap.to(heroRight, {
      y: 60,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2,
      },
    });
  }
})();

// ─── Magnetic CTA button ──────────────────────────────────────
(function magneticButtons() {
  if (reduceMotion) return;
  document.querySelectorAll('.js-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const relX = (e.clientX - rect.left - rect.width  / 2) * 0.25;
      const relY = (e.clientY - rect.top  - rect.height / 2) * 0.25;
      gsap.to(btn, { x: relX, y: relY, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'expo.out', overwrite: 'auto' });
    });
  });
})();

// ─── Scroll reveals (all .reveal elements) ────────────────────
gsap.utils.toArray('.reveal').forEach(el => {
  const delay = parseFloat(el.dataset.delay || '0') / 1000;
  gsap.fromTo(el,
    { opacity: 0, y: 36 },
    {
      opacity: 1, y: 0,
      duration: 0.85,
      ease: 'power3.out',
      delay,
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    }
  );
});

// ─── Trust bar: counter animation on scroll ───────────────────
(function trustCounters() {
  const counters = document.querySelectorAll('[data-trust-counter]');
  if (!counters.length) return;

  ScrollTrigger.create({
    trigger: '.trust-bar',
    start: 'top 82%',
    once: true,
    onEnter: () => {
      counters.forEach((el, i) => {
        const target = parseInt(el.dataset.trustCounter, 10);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8 + i * 0.1,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = Math.round(obj.v); },
        });
      });
    },
  });
})();

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
    if (document.hidden) return;
    if (cycleTimeEl) cycleTimeEl.textContent = fmt(remaining);
    if (cycleFill) cycleFill.style.width = ((CYCLE_TOTAL - remaining) / CYCLE_TOTAL * 100) + '%';
    remaining = remaining > 0 ? remaining - 1 : CYCLE_TOTAL;
  }
  tickCycle();
  setInterval(tickCycle, 1000);

  // ── Live activity feed
  const feedList = document.getElementById('feedList');
  if (!feedList) return;

  const MARKETPLACES = {
    Shopee: { cls: 'mp-shopee' },
    ML:     { cls: 'mp-ml' },
    Amazon: { cls: 'mp-amazon' },
    TikTok: { cls: 'mp-tiktok' },
  };

  const STORES  = ['Shopee', 'ML', 'Amazon', 'TikTok'];
  const ACTIONS = ['Pedidos capturados', 'NF emitida', 'Envio programado', 'Etiqueta impressa'];
  const EVENTS  = [];
  let baseId = 48282;
  STORES.forEach(mp => {
    ACTIONS.forEach(action => { EVENTS.push({ mp, action, id: '#' + (baseId++) }); });
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
    feedList.querySelectorAll('.feed-item').forEach((item, i) => {
      const t = item.querySelector('.feed-time');
      if (!t) return;
      if (i === 0) t.textContent = 'agora';
      else if (i === 1) t.textContent = 'há 3s';
      else t.textContent = `há ${i * 4 - 1}s`;
    });
  }

  function addItem() {
    if (document.hidden) return;
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
    while (feedList.children.length > MAX_FEED) {
      const last = feedList.lastElementChild;
      gsap.killTweensOf(last);
      gsap.to(last, { opacity: 0, y: 8, duration: 0.35, ease: 'power3.in',
        onComplete: () => { if (last.parentNode) last.remove(); } });
      break;
    }
  }

  for (let i = 0; i < 3; i++) { feedList.appendChild(makeItem(EVENTS[i], false)); seq++; }
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
