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
// Touch / coarse-pointer = mobile: use native scroll + skip desktop-only FX
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

let lenis;
if (!reduceMotion && !isTouch && typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    lerp: 0.12,            // continuous interpolation — linear feel, low latency
    smoothWheel: true,
    wheelMultiplier: 1,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Sync ScrollTrigger with Lenis scroll position
  lenis.on('scroll', ScrollTrigger.update);
}

// ─── Anchor links: smooth-scroll via Lenis ───────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: -80, duration: 1.0 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─── Mobile nav menu (hamburger) ──────────────────────────────
(function navMenu() {
  const toggle = document.querySelector('.js-nav-toggle');
  const navEl = document.querySelector('.nav');
  const menu = document.getElementById('navMobile');
  if (!toggle || !navEl || !menu) return;

  function setOpen(open) {
    navEl.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', () => setOpen(!navEl.classList.contains('menu-open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 860) setOpen(false); });
})();

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

  const lines = heading.querySelectorAll('.hl-in');

  // FOUC guard: set initial hidden states
  gsap.set('.hero-eyebrow',    { opacity: 0, y: 10 });
  gsap.set('.hero-sub',        { opacity: 0, y: 20 });
  gsap.set('.hero-cta-row',    { opacity: 0, y: 16 });
  gsap.set('.hero-trust-line', { opacity: 0, y: 12 });
  gsap.set('.hero-right',      { opacity: 0, x: 40 });
  gsap.set(lines,              { clipPath: 'inset(-12% -8% 116% 0)' });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });

  // Eyebrow
  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.5 });

  // Headline lines rise from behind a clip mask, staggered
  tl.to(lines, {
    clipPath: 'inset(-12% -8% -12% 0)',
    duration: 0.75,
    ease: 'expo.out',
    stagger: 0.1,
  }, '-=0.2');

  // Sub + CTA + trust line
  tl.to('.hero-sub',        { opacity: 1, y: 0, duration: 0.65 }, '-=0.5')
    .to('.hero-cta-row',    { opacity: 1, y: 0, duration: 0.55 }, '-=0.5')
    .to('.hero-trust-line', { opacity: 1, y: 0, duration: 0.5 },  '-=0.4');

  // Right card slides in
  tl.to('.hero-right', { opacity: 1, x: 0, duration: 0.9, ease: 'expo.out' }, '-=1.0');

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
  if (heroRight && !reduceMotion && !isTouch) {
    gsap.to(heroRight, {
      y: 40,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
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

// ─── Problem: ordered reveal — items first, big card last ─────
(function problemReveal() {
  const list = document.querySelector('.js-problem-list');
  if (!list) return;
  const items = gsap.utils.toArray(list.querySelectorAll('.problem-item'));
  const visual = document.querySelector('.js-problem-visual');

  // initial hidden states
  gsap.set(items, { opacity: 0, x: -20 });
  items.forEach(it => {
    const idx = it.querySelector('.problem-index');
    if (idx) gsap.set(idx, { opacity: 0 });
  });
  // visual card + its inner pieces
  const vLabel = visual && visual.querySelector('.problem-visual-label');
  const vNumWrap = visual && visual.querySelector('.problem-visual-number');
  const vCount = visual && visual.querySelector('[data-pv-count]');
  const vBars = visual ? gsap.utils.toArray(visual.querySelectorAll('.problem-visual-bars span')) : [];
  const vFoot = visual && visual.querySelector('.problem-visual-foot');

  if (visual) {
    gsap.set(visual, { opacity: 0, y: 30, scale: 0.94 });
    if (vLabel) gsap.set(vLabel, { opacity: 0, y: 10 });
    if (vNumWrap) gsap.set(vNumWrap, { opacity: 0, y: 16 });
    if (vBars.length) gsap.set(vBars, { scaleY: 0 });
    if (vFoot) gsap.set(vFoot, { opacity: 0, y: 10 });
  }

  ScrollTrigger.create({
    trigger: list,
    start: 'top 78%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1) each problem appears in order — number ticks in, then text
      items.forEach((item, i) => {
        const idx = item.querySelector('.problem-index');
        tl.to(item, { opacity: 1, x: 0, duration: 0.5 }, i * 0.18);
        if (idx) tl.to(idx, { opacity: 1, duration: 0.4 }, i * 0.18 + 0.05);
      });

      // 2) the big card animates in last, then its inner pieces play
      if (visual) {
        const cardAt = '>-0.1';
        tl.to(visual, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.5)' }, cardAt);
        if (vLabel) tl.to(vLabel, { opacity: 1, y: 0, duration: 0.4 }, '>-0.35');
        if (vNumWrap) {
          tl.to(vNumWrap, { opacity: 1, y: 0, duration: 0.5 }, '<+0.05');
          if (vCount) {
            const target = parseInt(vCount.dataset.pvCount, 10);
            const obj = { v: 0 };
            tl.to(obj, {
              v: target, duration: 0.9, ease: 'power2.out',
              onUpdate: () => { vCount.textContent = Math.round(obj.v); },
            }, '<');
          }
        }
        if (vBars.length) {
          tl.to(vBars, { scaleY: 1, duration: 0.5, ease: 'power2.out', stagger: 0.04 }, '<+0.1');
        }
        if (vFoot) tl.to(vFoot, { opacity: 1, y: 0, duration: 0.45 }, '<+0.2');
      }
    },
  });
})();

// ─── Flow: console assembles itself on scroll ─────────────────
(function consoleAssemble() {
  const consoleEl = document.querySelector('.js-console');
  if (!consoleEl) return;
  const parts = consoleEl.querySelectorAll('.js-console-part');
  if (!parts.length) return;

  gsap.set(consoleEl, { opacity: 0, y: 40, scale: 0.985 });
  gsap.set(parts, { opacity: 0, y: 24 });

  ScrollTrigger.create({
    trigger: consoleEl,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to(consoleEl, { opacity: 1, y: 0, scale: 1, duration: 0.7 })
        .to(parts, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 }, '-=0.4');
    },
  });
})();

// ─── Diferenciais: interactive showcase (tabs + visual stage) ─
(function diffShowcase() {
  const show = document.querySelector('.js-diff-show');
  if (!show) return;
  const tabs = gsap.utils.toArray(show.querySelectorAll('.diff-tab'));
  const panels = gsap.utils.toArray(show.querySelectorAll('.diff-panel'));
  const thumb = show.querySelector('.js-diff-thumb');
  if (!tabs.length || !panels.length) return;

  let active = 0;
  let timer = null;
  let inView = false;
  const DELAY = 4200;
  const isDesktop = () => window.matchMedia('(min-width: 861px)').matches;

  function moveThumb() {
    if (!thumb || !isDesktop()) return;
    const tab = tabs[active];
    gsap.to(thumb, {
      top: tab.offsetTop,
      height: tab.offsetHeight,
      duration: 0.45,
      ease: 'power3.out',
    });
  }

  function setActive(i, animate = true) {
    if (i === active && animate) return;
    active = i;
    tabs.forEach((t, n) => t.classList.toggle('is-active', n === i));

    panels.forEach((p, n) => {
      if (n === i) {
        p.classList.add('is-active');
        if (animate && !reduceMotion) {
          gsap.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
          const v = p.querySelector('.diff-panel-visual');
          const txt = p.querySelector('.diff-panel-text');
          gsap.fromTo([v, txt].filter(Boolean),
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08, delay: 0.05 });
        }
      } else {
        p.classList.remove('is-active');
      }
    });
    moveThumb();
  }

  function startAuto() {
    if (reduceMotion || !inView) return;
    stopAuto();
    timer = setInterval(() => setActive((active + 1) % tabs.length), DELAY);
  }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

  tabs.forEach((tab, i) => {
    tab.addEventListener('mouseenter', () => { if (isDesktop()) setActive(i); });
    tab.addEventListener('click', () => setActive(i));
  });
  show.addEventListener('mouseenter', stopAuto);
  show.addEventListener('mouseleave', startAuto);

  // Init (no animation) — but do NOT rotate until the section is in view
  setActive(0, false);
  requestAnimationFrame(moveThumb);
  window.addEventListener('resize', moveThumb);

  // Rotate only while the section is actually on screen
  ScrollTrigger.create({
    trigger: show,
    start: 'top 70%',
    end: 'bottom 30%',
    onToggle: (self) => {
      inView = self.isActive;
      if (inView) { moveThumb(); startAuto(); }
      else stopAuto();
    },
  });
})();

// ─── How-it-works: stacked deck that fans out on scroll ───────
(function howtoDeck() {
  const stage = document.querySelector('.js-howto-stage');
  const deck = document.querySelector('.js-howto-deck');
  if (!stage || !deck) return;
  const cards = gsap.utils.toArray(deck.querySelectorAll('.howto-card'));
  const n = cards.length;
  if (!n) return;

  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    const GAP = 20;

    // Cached layout — recomputed only on refresh, not every frame
    let L = { scale: 1, x: cards.map(() => 0) };
    function computeLayout() {
      const cardW = cards[0].offsetWidth || 360;
      const avail = Math.min(deck.clientWidth, 1400) - 16;
      const slot = (avail - GAP * (n - 1)) / n;
      const scale = Math.min(1, slot / cardW);
      const step = cardW * scale + GAP;
      L = { scale, x: cards.map((_, i) => (i - (n - 1) / 2) * step) };
    }
    computeLayout();

    // Initial stacked state — card 0 on top
    cards.forEach((card, i) => {
      gsap.set(card, {
        x: 0,
        y: i * 10,
        rotation: (i - (n - 1) / 2) * 3,
        scale: 1 - i * 0.04,
        zIndex: n - i,
        transformOrigin: 'center center',
      });
    });

    // Scrubbed timeline: deal each card out to its row slot, in order
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'center center',
        end: () => '+=' + Math.round(window.innerHeight * 1.5),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onRefresh: computeLayout,
      },
    });

    cards.forEach((card, i) => {
      tl.to(card, {
        x: () => L.x[i],
        y: 0,
        rotation: 0,
        scale: () => L.scale,
        ease: 'power2.inOut',
        duration: 1,
      }, i * 0.85);
    });

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
      gsap.set(cards, { clearProps: 'all' });
    };
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

// ─── Recalculate ScrollTrigger positions once everything's loaded ──
// Fonts/images can shift layout; refresh so pins & horizontal scroll
// measure against the final document height.
window.addEventListener('load', () => ScrollTrigger.refresh());
