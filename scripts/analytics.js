/* ============================================================
 * Distinct Services — GA4 custom tracking
 * Rastreia: cliques em CTAs/botões, leads no WhatsApp,
 * profundidade de rolagem, seções vistas, FAQ aberto, contato.
 * Depende da tag base gtag.js (G-CXCQMXHHPQ) no <head>.
 * ============================================================ */
(function () {
  'use strict';

  // Envia um evento para o GA4 (com fallback para dataLayer)
  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    } else {
      (window.dataLayer = window.dataLayer || []).push(
        Object.assign({ event: name }, params || {})
      );
    }
  }

  // Identifica a seção onde o elemento está (usa data-screen-label, id, nav ou footer)
  function sectionOf(el) {
    var sec = el.closest(
      'section[data-screen-label], section[id], footer, .site-nav, nav'
    );
    if (!sec) return 'desconhecida';
    if (sec.dataset && sec.dataset.screenLabel) return sec.dataset.screenLabel;
    if (sec.tagName === 'NAV' || (sec.className || '').indexOf('site-nav') > -1) return 'nav';
    if (sec.tagName === 'FOOTER') return 'footer';
    if (sec.id) return sec.id;
    return (sec.className || '').split(' ')[0] || 'desconhecida';
  }

  // Extrai o nome do plano da mensagem do link do WhatsApp
  function planFromHref(href) {
    var decoded = '';
    try { decoded = decodeURIComponent(href); } catch (e) { decoded = href; }
    var m = decoded.match(/plano\s+([A-Za-zÀ-ÿ]+)/i);
    if (m) return m[1].toLowerCase();
    return 'trial'; // "testar 5 dias grátis"
  }

  // ── 1. Cliques em CTAs, botões e links ────────────────────
  // Captura na fase de captura para registrar antes de qualquer navegação.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a, button');
    if (!a) return;

    var href = a.getAttribute('href') || '';
    var label = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    var location = sectionOf(a);

    // WhatsApp = lead (conversão principal)
    if (/wa\.me|api\.whatsapp\.com|whatsapp/i.test(href)) {
      var plan = planFromHref(href);
      track('whatsapp_click', {
        cta_location: location,
        cta_label: label,
        plan: plan,
        link_url: href
      });
      // Evento recomendado p/ marcar como evento-chave (conversão) no GA4
      track('generate_lead', {
        cta_location: location,
        plan: plan,
        currency: 'BRL'
      });
      return;
    }

    // E-mail
    if (/^mailto:/i.test(href)) {
      track('contact_click', { method: 'email', cta_location: location });
      return;
    }
    // Telefone
    if (/^tel:/i.test(href)) {
      track('contact_click', { method: 'phone', cta_location: location });
      return;
    }
    // Links de âncora (navegação interna)
    if (href.charAt(0) === '#') {
      track('nav_click', {
        nav_target: href,
        cta_location: location,
        cta_label: label
      });
      return;
    }
    // Demais botões estilizados como CTA
    if (a.classList.contains('btn')) {
      track('cta_click', {
        cta_location: location,
        cta_label: label,
        link_url: href
      });
    }
  }, true);

  // ── 2. Abertura de perguntas do FAQ ───────────────────────
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      // aria-expanded ainda reflete o estado ANTES do toggle do site.js
      if (btn.getAttribute('aria-expanded') !== 'true') {
        var q = '';
        var span = btn.querySelector('span');
        if (span) q = (span.textContent || '').trim().slice(0, 100);
        track('faq_open', { question: q });
      }
    });
  });

  // ── 3. Profundidade de rolagem (25/50/75/100%) ────────────
  var marks = [25, 50, 75, 100];
  var fired = {};
  function checkScroll() {
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop || 0;
    var height = doc.scrollHeight - window.innerHeight;
    if (height <= 0) return;
    var pct = Math.min(100, Math.round((scrollTop / height) * 100));
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      if (pct >= m && !fired[m]) {
        fired[m] = true;
        track('scroll_depth', { percent_scrolled: m });
      }
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () {
        checkScroll();
        ticking = false;
      });
    }
  }, { passive: true });
  checkScroll();

  // ── 4. Seções visualizadas ────────────────────────────────
  if ('IntersectionObserver' in window) {
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var name = en.target.dataset.screenLabel || en.target.id || 'secao';
        if (!seen[name]) {
          seen[name] = true;
          track('section_view', { section_name: name });
        }
      });
    }, { threshold: 0.5 });
    document
      .querySelectorAll('section[data-screen-label]')
      .forEach(function (s) { io.observe(s); });
  }
})();
