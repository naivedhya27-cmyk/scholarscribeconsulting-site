/* Scholar Scribe Consulting: header, menu, copy button and a little motion. Every page reads in full without it. */
(function () {
  'use strict';
  var d = document, h = d.documentElement, w = window;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showAll() { h.classList.add('reveal-all'); }
  w.__ssReady = true;

  /* a line under the header once the page has moved */
  var header = $('.site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', w.pageYOffset > 4); }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var burger = $('.nav__burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    w.addEventListener('resize', function () { if (w.innerWidth > 900) setMenu(false); });
  }

  /* copy the email address */
  $$('[data-copy]').forEach(function (b) {
    var label = b.textContent;
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy');
      function done() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = label; }, 1600); }
      if (navigator.clipboard && w.isSecureContext) { navigator.clipboard.writeText(t).then(done, function () {}); return; }
      var a = d.createElement('textarea');
      a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0';
      d.body.appendChild(a); a.select();
      try { if (d.execCommand('copy')) done(); } catch (e) {}
      d.body.removeChild(a);
    });
  });

  /* blocks fade in once as they come into view; the evidence pages fan out */
  var once = $$('.rv').concat($$('.papers'));
  if ('IntersectionObserver' in w && !reduce) {
    var seen = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = (k++ * 0.07) + 's';
        e.target.classList.add('is-in');
        seen.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    once.forEach(function (el) { seen.observe(el); });
  } else {
    once.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* how one issue is found: on wide, tall screens the step in the middle of the screen sets the desk */
  var how = $('.how'), desk = how && $('.desk', how);
  if (how && desk && 'IntersectionObserver' in w && w.matchMedia) {
    var mq = w.matchMedia('(min-width: 1024px) and (min-height: 680px) and (max-height: 1700px)');
    var steps = $$('.step', how), io = null;
    var setStep = function (n) {
      desk.setAttribute('data-at', String(n));
      steps.forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-step') === String(n)); });
    };
    var apply = function () {
      if (io) { io.disconnect(); io = null; }
      if (mq.matches) {
        how.classList.add('is-scrolly');
        setStep(0);
        io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) setStep(e.target.getAttribute('data-step')); });
        }, { rootMargin: '-46% 0px -53% 0px' });
        steps.forEach(function (s) { io.observe(s); });
      } else {
        how.classList.remove('is-scrolly');
        steps.forEach(function (s) { s.classList.remove('is-on'); });
        desk.setAttribute('data-at', '4');
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
    apply();
  }

  /* first screen: the heading rises line by line, then the example page is marked up */
  var pre = $$('.pre'), gs = w.gsap;
  if (!pre.length) return;
  if (reduce || !gs) { showAll(); return; }
  var started = false;
  function start() {
    if (started) return;
    started = true;
    try {
      if (w.SplitText) gs.registerPlugin(w.SplitText);
      var tl = gs.timeline({ delay: 0.05 }), t = 0;
      pre.forEach(function (el) {
        if (el.hasAttribute('data-split') && w.SplitText) {
          gs.set(el, { opacity: 1 });
          var sp = new w.SplitText(el, { type: 'lines', mask: 'lines' });
          tl.from(sp.lines, { yPercent: 105, duration: 0.85, ease: 'power3.out', stagger: 0.08, onComplete: function () { sp.revert(); } }, 0);
          t = 0.3 + sp.lines.length * 0.08;
        } else {
          tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', clearProps: 'transform' }, t);
          t += 0.09;
        }
      });
      var doc = $('.hero__doc');
      if (doc) {
        tl.fromTo($$('.hl', doc), { '--hl': '0%' }, { '--hl': '100%', duration: 1.1, ease: 'power1.inOut' }, '+=0.15');
        tl.fromTo($$('.err', doc), { '--u': 0 }, { '--u': 1, duration: 0.45, ease: 'power2.out' }, '+=0.05');
        tl.fromTo($$('.pmark, .mnote', doc), { opacity: 0 }, { opacity: 1, duration: 0.45, stagger: 0.12 }, '-=0.1');
      }
    } catch (e) { showAll(); }
  }
  if (d.fonts && d.fonts.ready) { d.fonts.ready.then(start, start); setTimeout(start, 1200); } else { start(); }
})();
