/* Scholar Scribe Consulting: interactions and animation */
(function () {
  'use strict';
  var d = document, html = d.documentElement, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(pointer: fine)').matches;

  setupCopy();
  if (!w.gsap || !w.ScrollTrigger) { html.classList.add('reveal-all'); setupMenuPlain(); return; }
  w.__ssReady = true;
  gsap.registerPlugin(ScrollTrigger);
  if (w.SplitText) gsap.registerPlugin(SplitText);
  gsap.config({ nullTargetWarn: false });

  var introDelay = reduce ? 0 : html.classList.contains('is-intro') ? 1.05 : html.classList.contains('is-entering') ? 0.6 : 0.15;

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduce && w.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    w.__lenis = lenis;
  }
  d.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = d.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -96, duration: 1.4 });
      else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- header, progress ---------- */
  var header = d.querySelector('.site-header');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      if (!header) return;
      var y = self.scroll();
      header.classList.toggle('is-scrolled', y > 30);
      if (!html.classList.contains('menu-open')) header.classList.toggle('is-hidden', self.direction === 1 && y > 260);
    }
  });
  var bar = d.querySelector('.progress');
  if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---------- mobile menu ---------- */
  var burger = d.querySelector('.nav__burger'), menu = d.querySelector('.menu');
  if (burger && menu) {
    var mtl = gsap.timeline({ paused: true })
      .set(menu, { visibility: 'visible' })
      .fromTo(menu, { clipPath: 'circle(0% at 93% 5%)' }, { clipPath: 'circle(150% at 93% 5%)', duration: 0.9, ease: 'expo.inOut' })
      .fromTo(menu.querySelectorAll('.menu__links a span'), { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.32)
      .fromTo(menu.querySelector('.menu__meta'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.55);
    var setMenu = function (open) {
      html.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
      if (open) { if (header) header.classList.remove('is-hidden'); if (lenis) lenis.stop(); mtl.timeScale(1).play(); }
      else { if (lenis) lenis.start(); mtl.timeScale(1.7).reverse(); }
    };
    burger.addEventListener('click', function () { setMenu(!html.classList.contains('menu-open')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && html.classList.contains('menu-open')) setMenu(false); });
  }

  /* ---------- page transitions ---------- */
  var curtain = d.querySelector('.curtain');
  if (curtain && !reduce) {
    d.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(mailto|tel):/i.test(href)) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (er) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) { if (!url.hash) { e.preventDefault(); if (lenis) lenis.scrollTo(0); else w.scrollTo(0, 0); } return; }
      e.preventDefault();
      try { sessionStorage.setItem('ss-enter', '1'); } catch (er) {}
      html.classList.remove('is-intro', 'is-entering');
      gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.65, ease: 'expo.inOut', onComplete: function () { location.href = url.href; } });
    });
    w.addEventListener('pageshow', function (e) {
      if (e.persisted) { gsap.set(curtain, { yPercent: 100 }); html.classList.remove('menu-open', 'is-intro', 'is-entering'); if (lenis) lenis.start(); }
    });
  }

  /* ---------- reveals ---------- */
  var inTop = function (el) { return !!el.closest('.hero, .page-hero'); };
  var reveals = gsap.utils.toArray('[data-reveal]');
  reveals.filter(inTop).forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: introDelay + 0.25 + parseFloat(el.getAttribute('data-delay') || 0) });
  });
  ScrollTrigger.batch(reveals.filter(function (el) { return !inTop(el); }), {
    start: 'top 89%', once: true,
    onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 1.15, ease: 'expo.out', stagger: 0.09, overwrite: true }); }
  });

  /* split headings: lines slide up from a mask */
  if (w.SplitText) {
    gsap.utils.toArray('[data-split]').forEach(function (el) {
      var top = inTop(el);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          gsap.set(el, { visibility: 'visible' });
          if (reduce) return;
          return gsap.from(self.lines, {
            yPercent: 112, duration: 1.25, ease: 'expo.out', stagger: 0.1,
            delay: top ? introDelay : 0,
            scrollTrigger: top ? null : { trigger: el, start: 'top 88%', once: true }
          });
        }
      });
    });
    /* statements: words fill in as you scroll */
    gsap.utils.toArray('[data-words]').forEach(function (el) {
      var dark = !!el.closest('.section--dark, .checks, .cta');
      var sp = SplitText.create(el, { type: 'words' });
      if (reduce) { gsap.set(sp.words, { color: dark ? '#ffffff' : '#0a1730' }); return; }
      gsap.to(sp.words, {
        color: dark ? '#ffffff' : '#0a1730', ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: 0.6 }
      });
    });
    var word = d.querySelector('.footer__word');
    if (word && !reduce) {
      var fw = SplitText.create(word, { type: 'chars', charsClass: 'char' });
      gsap.from(fw.chars, { yPercent: 100, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: word, start: 'top 99%', once: true } });
    }
  } else {
    gsap.set('[data-split]', { visibility: 'visible' });
  }

  /* line drawings */
  gsap.utils.toArray('.draw').forEach(function (svg) {
    var parts = svg.querySelectorAll('[pathLength]');
    if (!parts.length) return;
    if (reduce) { gsap.set(parts, { strokeDashoffset: 0 }); return; }
    gsap.to(parts, {
      strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: 0.12,
      delay: inTop(svg) ? introDelay + 0.4 : 0,
      scrollTrigger: inTop(svg) ? null : { trigger: svg, start: 'top 90%', once: true }
    });
  });

  /* counters */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var fmt = function (v) { return v.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
    if (reduce) { el.textContent = fmt(end); return; }
    var o = { v: 0 };
    el.textContent = fmt(0);
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: function () { el.textContent = fmt(o.v); } });
  });
  gsap.utils.toArray('[data-meter]').forEach(function (el) {
    gsap.to(el, { scaleX: parseFloat(el.getAttribute('data-meter')), duration: reduce ? 0 : 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });

  /* ticker, speeds up and turns with the scroll */
  var track = d.querySelector('.ticker__track');
  if (track && !reduce) {
    var tw = gsap.to(track, { xPercent: -50, ease: 'none', duration: 42, repeat: -1 });
    tw.totalTime(tw.duration() * 400);
    var dir = 1;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        dir = self.direction;
        var v = Math.min(1 + Math.abs(self.getVelocity()) / 260, 7);
        gsap.to(tw, { timeScale: dir * v, duration: 0.25, overwrite: true, onComplete: function () { gsap.to(tw, { timeScale: dir, duration: 1.4, ease: 'power2.out' }); } });
      }
    });
  }

  /* magnetic buttons and spotlight cards */
  if (fine && !reduce) {
    gsap.utils.toArray('[data-magnetic]').forEach(function (el) {
      var xt = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      var yt = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); xt((e.clientX - r.left - r.width / 2) * 0.22); yt((e.clientY - r.top - r.height / 2) * 0.32); });
      el.addEventListener('pointerleave', function () { xt(0); yt(0); });
    });
    d.querySelectorAll('.svc, .sit').forEach(function (el) {
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    });
  }

  /* ---------- page modules ---------- */
  var plane = d.querySelector('.hero__plane canvas');
  if (plane) heroPlane(plane);
  var stack = d.querySelector('[data-stack]');
  if (stack) evidenceStack(stack);
  d.querySelectorAll('.checks').forEach(checksSection);
  d.querySelectorAll('[data-fan]').forEach(packFan);
  d.querySelectorAll('.hscroll').forEach(hScroll);
  d.querySelectorAll('.flow').forEach(flowDiagram);
  d.querySelectorAll('.cta__lines').forEach(ctaLines);
  if (fine && !reduce) heroTilt();

  w.addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* ================= helpers ================= */
  function offsetIn(el, root) {
    var x = 0, y = 0, n = el;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }
  function rand(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* hero: a receding desk of pages; a scan line passes and marks lines it has checked */
  function heroPlane(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var W = 0, H = 0, segs = [], pages = [], raf = 0, visible = true, t0 = performance.now();
    function build() {
      var dpr = Math.min(w.devicePixelRatio || 1, 2);
      W = Math.max(1, canvas.clientWidth); H = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      segs = []; pages = [];
      var r = rand(11), pw = 128, ph = 168, gx = 30, gy = 34, lh = 10, row = 0;
      for (var y0 = 6; y0 < H + ph; y0 += ph + gy, row++) {
        for (var x0 = (row % 2 ? -pw / 2 : 6); x0 < W; x0 += pw + gx) {
          pages.push([x0, y0, pw, ph]);
          var y = y0 + 14;
          segs.push({ x: x0 + 12, y: y, w: (pw - 24) * (0.35 + r() * 0.3), h: 3, a: 0.22, t: 0, c: 0 });
          y += lh * 1.7;
          while (y < y0 + ph - 12) {
            var n = 3 + Math.floor(r() * 4);
            for (var i = 0; i < n && y < y0 + ph - 12; i++) {
              segs.push({ x: x0 + 12, y: y, w: (pw - 24) * (i === n - 1 ? 0.28 + r() * 0.45 : 0.82 + r() * 0.18), h: 2, a: 0.1 + r() * 0.07, t: 0, c: 0 });
              y += lh;
            }
            y += lh * 0.7;
          }
        }
      }
    }
    function draw(now) {
      raf = 0;
      var t = (now - t0) / 1000, period = 8.5, span = H + 260;
      var beam = ((t % period) / period) * span - 130;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(150,185,235,0.1)'; ctx.lineWidth = 1;
      for (var p = 0; p < pages.length; p++) { var g = pages[p]; ctx.strokeRect(g[0] + 0.5, g[1] + 0.5, g[2], g[3]); }
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i], dist = Math.abs(s.y - beam), glow = dist < 70 ? 1 - dist / 70 : 0;
        if (glow > 0.94 && s.t <= 0 && Math.random() < 0.05) { s.t = 1; s.c = Math.random() < 0.13 ? 2 : 1; }
        if (s.t > 0) s.t -= 0.004;
        if (s.t > 0) ctx.fillStyle = s.c === 2 ? 'rgba(245,180,67,' + (0.25 + 0.65 * s.t).toFixed(3) + ')' : 'rgba(99,214,193,' + (0.2 + 0.6 * s.t).toFixed(3) + ')';
        else ctx.fillStyle = 'rgba(176,200,240,' + (s.a + glow * 0.42).toFixed(3) + ')';
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
      var gr = ctx.createLinearGradient(0, beam - 70, 0, beam + 4);
      gr.addColorStop(0, 'rgba(99,214,193,0)'); gr.addColorStop(1, 'rgba(99,214,193,0.18)');
      ctx.fillStyle = gr; ctx.fillRect(0, beam - 70, W, 74);
      ctx.fillStyle = 'rgba(150,240,220,0.75)'; ctx.fillRect(0, beam + 3, W, 1.5);
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    }
    build();
    if (reduce) { draw(t0 + 4200); return; }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); }).observe(canvas.parentNode);
    var rt;
    w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); });
    raf = requestAnimationFrame(draw);
  }

  function heroTilt() {
    var hero = d.querySelector('.hero'), inner = d.querySelector('.stack__inner'), planeEl = d.querySelector('.hero__plane');
    if (!hero || !inner) return;
    var rx = gsap.quickTo(inner, 'rotationX', { duration: 1, ease: 'power3.out' });
    var ry = gsap.quickTo(inner, 'rotationY', { duration: 1, ease: 'power3.out' });
    var px = planeEl ? gsap.quickTo(planeEl, 'x', { duration: 1.6, ease: 'power3.out' }) : null;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      ry(x * 9); rx(-y * 7); if (px) px(-x * 40);
    });
    hero.addEventListener('pointerleave', function () { rx(0); ry(0); if (px) px(0); });
  }

  /* hero: issue cards are assembled one after another, like pages of the evidence pack */
  function wireCard(card) {
    var panes = card.querySelector('.ecard__panes'), path = card.querySelector('.ecard__wire path');
    var dots = card.querySelectorAll('.ecard__wire circle'), hl = card.querySelectorAll('.ln--hl');
    if (!panes || !path || hl.length < 2) return;
    var a = offsetIn(hl[0], panes), b = offsetIn(hl[1], panes);
    var x1 = a.x + a.w + 4, y1 = a.y + a.h / 2, x2 = b.x - 4, y2 = b.y + b.h / 2, mx = (x1 + x2) / 2;
    path.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2);
    dots[0].setAttribute('cx', x1); dots[0].setAttribute('cy', y1);
    dots[1].setAttribute('cx', x2); dots[1].setAttribute('cy', y2);
  }
  function cardParts(c) {
    return { hl: c.querySelectorAll('.ln--hl i'), wire: c.querySelector('.ecard__wire path'), dots: c.querySelectorAll('.ecard__wire circle'),
      verdict: c.querySelector('.verdict'), cite: c.querySelector('.ecard__cite'), links: c.querySelectorAll('.ecard__links span') };
  }
  function cardReset(c) {
    var p = cardParts(c); wireCard(c);
    gsap.set(p.hl, { scaleX: 0 }); gsap.set(p.dots, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(p.wire, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set([p.verdict, p.cite], { opacity: 0, y: 8 }); gsap.set(p.links, { opacity: 0, y: 6 });
  }
  function cardDone(c) {
    var p = cardParts(c); wireCard(c);
    gsap.set(p.hl, { scaleX: 1 }); gsap.set(p.dots, { scale: 1, transformOrigin: '50% 50%' });
    gsap.set(p.wire, { strokeDasharray: 1, strokeDashoffset: 0 });
    gsap.set([p.verdict, p.cite].concat(Array.prototype.slice.call(p.links)).filter(Boolean), { opacity: 1, y: 0 });
  }
  function cardPlay(c, onIssue) {
    var p = cardParts(c); wireCard(c);
    return gsap.timeline()
      .to(p.hl[0], { scaleX: 1, duration: 0.85, ease: 'power2.inOut' })
      .to(p.dots[0], { scale: 1, duration: 0.3, ease: 'back.out(3)' }, '-=0.05')
      .to(p.wire, { strokeDashoffset: 0, duration: 0.75, ease: 'power2.inOut' }, '-=0.1')
      .to(p.dots[1], { scale: 1, duration: 0.3, ease: 'back.out(3)' }, '-=0.12')
      .to(p.hl[1], { scaleX: 1, duration: 0.85, ease: 'power2.inOut' }, '-=0.15')
      .to(p.verdict, { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(2.2)', onStart: onIssue }, '+=0.1')
      .to(p.cite, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .to(p.links, { opacity: 1, y: 0, duration: 0.45, stagger: 0.09, ease: 'power2.out' }, '-=0.25');
  }
  function evidenceStack(root) {
    var cards = gsap.utils.toArray(root.querySelectorAll('.ecard'));
    var chips = gsap.utils.toArray(root.querySelectorAll('.fchip'));
    var issueChip = root.querySelector('.fchip--issue');
    var slots = [{ y: 0, scale: 1, opacity: 1 }, { y: -24, scale: 0.94, opacity: 0.92 }, { y: -46, scale: 0.88, opacity: 0.8 }];
    var order = cards.slice(), visible = true;
    var place = function (dur) {
      order.forEach(function (c, i) { gsap.to(c, { y: slots[i].y, scale: slots[i].scale, opacity: slots[i].opacity, zIndex: 3 - i, duration: dur, ease: 'expo.out' }); });
    };
    var pulse = function () { if (issueChip) gsap.fromTo(issueChip, { scale: 1 }, { scale: 1.08, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }); };
    order.forEach(cardReset);
    place(0);
    if (reduce) { cardDone(order[0]); return; }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(root);
    var cycle = function () { cardReset(order[0]); cardPlay(order[0], pulse).eventCallback('onComplete', function () { gsap.delayedCall(2.6, advance); }); };
    var advance = function () {
      if (!visible) { gsap.delayedCall(1, advance); return; }
      var front = order[0];
      gsap.to(front, { y: 80, opacity: 0, rotation: -3, duration: 0.7, ease: 'power3.in', onComplete: function () {
        order.push(order.shift());
        gsap.set(front, { rotation: 0, zIndex: 0, y: -70, scale: 0.82, opacity: 0 });
        cardDone(front);
        place(1.1);
        gsap.delayedCall(0.6, cycle);
      } });
    };
    gsap.from(cards, { y: 90, opacity: 0, rotationX: -28, duration: 1.5, ease: 'expo.out', stagger: 0.12, delay: introDelay + 0.35 });
    gsap.from(chips, { opacity: 0, scale: 0.8, y: 14, duration: 0.9, ease: 'back.out(2)', stagger: 0.15, delay: introDelay + 1.1 });
    chips.forEach(function (c, i) { gsap.to(c, { y: i % 2 ? 8 : -8, duration: 2.6 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: introDelay + 2 }); });
    gsap.delayedCall(introDelay + 1.3, cycle);
    w.addEventListener('resize', function () { cards.forEach(wireCard); });
  }

  /* five checks: each scene has its own short animation */
  function sceneTL(sc) {
    var k = sc.getAttribute('data-scene'), tl = gsap.timeline({ paused: true }), badge = sc.querySelector('.scene__badge');
    gsap.set(badge, { opacity: 0, y: 6 });
    if (k === '1') {
      var rows = sc.querySelectorAll('.rec__row'), strike = sc.querySelector('.strike'), nv = sc.querySelector('.ln--new');
      gsap.set(sc.querySelectorAll('.tick'), { scale: 0 }); gsap.set(strike, { scaleX: 0 }); gsap.set(nv, { opacity: 0, x: -8 });
      rows.forEach(function (r) {
        var t = r.querySelector('.tick');
        if (r.querySelector('.strike')) tl.to(r, { backgroundColor: '#fdf2e1', duration: 0.15 }).to(r.querySelector('.strike'), { scaleX: 1, duration: 0.3 }).to(nv, { opacity: 1, x: 0, duration: 0.3 }).to(t, { scale: 1, duration: 0.25, ease: 'back.out(3)' });
        else tl.to(t, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, '-=0.05');
      });
    } else if (k === '2') {
      var track = sc.querySelector('.doc__pages-track'), pages = sc.querySelectorAll('.doc__page'), pg = sc.querySelector('[data-page]');
      var hls = sc.querySelectorAll('.ln--hl i'), lens = sc.querySelector('.lens'), o = { p: 1 }, n = pages.length;
      gsap.set(hls, { scaleX: 0 }); gsap.set(track, { y: 0 }); gsap.set(lens, { left: '18%', top: '30%' });
      if (pg) pg.textContent = '1';
      tl.to(hls[0], { scaleX: 1, duration: 0.4, ease: 'power2.inOut' })
        .to(track, { y: -(n - 1) * 224, duration: 1.3, ease: 'power1.inOut' }, '+=0.05')
        .to(o, { p: n, duration: 1.3, ease: 'power1.inOut', onUpdate: function () { if (pg) pg.textContent = Math.round(o.p); } }, '<')
        .to(lens, { keyframes: [{ left: '58%', top: '55%' }, { left: '24%', top: '62%' }, { left: '46%', top: '16%' }], duration: 1.3, ease: 'sine.inOut' }, '<')
        .to(hls[1], { scaleX: 1, duration: 0.45, ease: 'power2.inOut' });
    } else if (k === '3') {
      var rws = sc.querySelectorAll('tbody tr:not(.total)'), tot = sc.querySelector('tr.total'), sum = sc.querySelector('[data-sum]'), pills = sc.querySelectorAll('.calc__pill'), s = { v: 0 };
      var target = parseFloat(sum.getAttribute('data-sum'));
      gsap.set(pills, { opacity: 0, y: 8 }); sum.textContent = '0';
      rws.forEach(function (r, i) { tl.fromTo(r, { backgroundColor: 'rgba(43,181,159,0)' }, { backgroundColor: 'rgba(43,181,159,0.13)', duration: 0.18, yoyo: true, repeat: 1 }, i * 0.2); });
      tl.to(pills[0], { opacity: 1, y: 0, duration: 0.3 }, 0.1)
        .to(s, { v: target, duration: 0.9, ease: 'power2.out', onUpdate: function () { sum.textContent = Math.round(s.v).toLocaleString('en-GB'); } }, 0.15)
        .fromTo(tot, { backgroundColor: 'rgba(245,166,35,0)' }, { backgroundColor: 'rgba(245,166,35,0.18)', duration: 0.3 })
        .to(pills[1], { opacity: 1, y: 0, duration: 0.3 })
        .to(pills[2], { opacity: 1, y: 0, duration: 0.3 });
    } else if (k === '4') {
      var map = sc.querySelector('.map'), claim = sc.querySelector('.map__claim'), boxes = sc.querySelectorAll('.map__box'), paths = sc.querySelectorAll('.map svg path');
      var lay = function () {
        var c = offsetIn(claim, map);
        boxes.forEach(function (b, i) {
          var o2 = offsetIn(b, map), x1 = c.x + c.w / 2, y1 = c.y + c.h, x2 = o2.x + o2.w / 2, y2 = o2.y, my = (y1 + y2) / 2;
          paths[i].setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + my + ' ' + x2 + ' ' + my + ' ' + x2 + ' ' + y2);
        });
      };
      lay(); if (w.ResizeObserver) new ResizeObserver(lay).observe(map);
      gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 }); gsap.set(boxes, { opacity: 0.35, y: 10 });
      paths.forEach(function (p, i) { tl.to(p, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.inOut' }, i * 0.3).to(boxes[i], { opacity: 1, y: 0, duration: 0.3 }, '-=0.12'); });
      tl.fromTo(boxes[boxes.length - 1], { scale: 1 }, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });
    } else if (k === '5') {
      var dels = sc.querySelectorAll('.diff__line.del'), adds = sc.querySelectorAll('.diff__line.add'), ni = sc.querySelector('.diff__line.new-issue');
      gsap.set(dels, { '--s': 0 }); gsap.set(adds, { scaleX: 0, transformOrigin: '0 50%' }); gsap.set(ni, { opacity: 0.15 });
      tl.to(dels, { '--s': 1, duration: 0.35, stagger: 0.25 })
        .to(adds, { scaleX: 1, duration: 0.4, stagger: 0.25 }, '-=0.15')
        .to(ni, { opacity: 1, duration: 0.18, repeat: 3, yoyo: true })
        .set(ni, { opacity: 1 });
    }
    tl.to(badge, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' });
    return tl;
  }
  function checksSection(sec) {
    var steps = gsap.utils.toArray(sec.querySelectorAll('.step'));
    var scenes = steps.map(function (s) { return s.querySelector('.scene'); });
    var stage = sec.querySelector('.checks__stage'), rail = sec.querySelector('.steps__rail i'), pin = sec.querySelector('.checks__pin');
    if (!steps.length || scenes.indexOf(null) > -1) return;
    var mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 981px)', mob: '(max-width: 980px)', rm: '(prefers-reduced-motion: reduce)' }, function (ctx) {
      var c = ctx.conditions;
      if (c.desk && stage) {
        scenes.forEach(function (sc) { stage.appendChild(sc); });
        var tls = scenes.map(sceneTL);
        if (c.rm) {
          tls.forEach(function (t) { t.progress(1); });
          gsap.set(scenes, { autoAlpha: 0 }); gsap.set(scenes[0], { autoAlpha: 1 });
          steps.forEach(function (st, i) { st.addEventListener('mouseenter', function () { gsap.set(scenes, { autoAlpha: 0 }); gsap.set(scenes[i], { autoAlpha: 1 }); }); });
        } else {
          gsap.set(scenes, { autoAlpha: 0, y: 34 }); gsap.set(scenes[0], { autoAlpha: 1, y: 0 });
          gsap.set(steps, { opacity: 0.34 }); gsap.set(steps[0], { opacity: 1 });
          var tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: sec, start: 'top top', end: function () { return '+=' + Math.round(w.innerHeight * 4.4); },
              pin: pin, scrub: 0.8, invalidateOnRefresh: true,
              snap: { snapTo: 'labelsDirectional', duration: { min: 0.25, max: 0.8 }, delay: 0.12, ease: 'power2.inOut' }
            }
          });
          scenes.forEach(function (sc, i) {
            if (i > 0) {
              tl.addLabel('s' + i)
                .to(scenes[i - 1], { autoAlpha: 0, y: -34, duration: 0.3, ease: 'power2.in' }, 's' + i)
                .to(steps[i - 1], { opacity: 0.34, duration: 0.25 }, 's' + i)
                .to(steps[i], { opacity: 1, duration: 0.25 }, 's' + i)
                .to(sc, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 's' + i + '+=0.2');
            } else tl.addLabel('s0');
            tls[i].paused(false);
            tl.add(tls[i], i ? 's' + i + '+=0.45' : 0.05);
            tl.to({}, { duration: 0.5 });
          });
          tl.addLabel('end');
          if (rail) tl.fromTo(rail, { scaleY: 0.2 }, { scaleY: 1, duration: tl.duration(), ease: 'none' }, 0);
        }
        return function () {
          scenes.forEach(function (sc, i) { steps[i].appendChild(sc); });
          gsap.set(scenes.concat(steps), { clearProps: 'all' });
        };
      }
      if (c.mob) {
        scenes.forEach(function (sc) {
          var t = sceneTL(sc);
          if (c.rm) { t.progress(1); return; }
          ScrollTrigger.create({ trigger: sc, start: 'top 78%', once: true, onEnter: function () { t.play(); } });
        });
      }
    });
  }

  function packFan(el) {
    var cards = gsap.utils.toArray(el.querySelectorAll('.pcard'));
    cards.forEach(function (p) { var c = p.querySelector('.ecard'); if (c) cardDone(c); });
    w.addEventListener('resize', function () { cards.forEach(function (p) { var c = p.querySelector('.ecard'); if (c) wireCard(c); }); });
    if (reduce || cards.length < 3) return;
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', end: 'center 42%', scrub: 1 } });
    tl.fromTo(cards[0], { rotation: -2, xPercent: 0, y: 60 }, { rotation: -10, xPercent: -24, y: 22, ease: 'none' }, 0)
      .fromTo(cards[1], { rotation: 2, xPercent: 0, y: 60 }, { rotation: 9, xPercent: 24, y: 34, ease: 'none' }, 0)
      .fromTo(cards[2], { rotation: 0, y: 90, scale: 0.94 }, { rotation: 0, y: -12, scale: 1, ease: 'none' }, 0);
  }

  function hScroll(sec) {
    var track = sec.querySelector('.hscroll__track');
    if (!track) return;
    gsap.matchMedia().add('(min-width: 981px) and (prefers-reduced-motion: no-preference)', function () {
      var dist = function () { return Math.max(0, track.scrollWidth - w.innerWidth); };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true } });
      gsap.utils.toArray(track.querySelectorAll('.hcard')).forEach(function (card, i) {
        gsap.fromTo(card, { rotation: i % 2 ? 2 : -2 }, { rotation: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 1 } });
      });
    });
  }

  function flowDiagram(el) {
    var boxes = el.querySelectorAll('.fstep'), arrows = el.querySelectorAll('.arrow'), dots = el.querySelectorAll('.dot');
    if (reduce) return;
    gsap.set(arrows, { strokeDasharray: 1, strokeDashoffset: 1 });
    var tl = gsap.timeline({ delay: introDelay + 0.5 });
    boxes.forEach(function (b, i) {
      tl.from(b, { opacity: 0, y: 14, duration: 0.55, ease: 'power3.out' }, i * 0.38);
      if (arrows[i]) tl.to(arrows[i], { strokeDashoffset: 0, duration: 0.4, ease: 'power2.inOut' }, i * 0.38 + 0.32);
    });
    tl.add(function () {
      dots.forEach(function (dot, i) {
        var len = parseFloat(dot.getAttribute('data-len') || 60);
        gsap.fromTo(dot, { y: 0, opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.15 }, { y: len, duration: 1.1, ease: 'power1.inOut' }, { opacity: 0, duration: 0.15 }], repeat: -1, repeatDelay: 0.9, delay: i * 0.45 });
      });
    });
  }

  function ctaLines(svg) {
    var paths = svg.querySelectorAll('path');
    if (reduce) return;
    gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.to(paths, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: 0.15, scrollTrigger: { trigger: svg, start: 'top 85%', once: true } });
    gsap.to(svg, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: svg.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- no-GSAP fallbacks ---------- */
  function setupMenuPlain() {
    var b = d.querySelector('.nav__burger'), m = d.querySelector('.menu');
    if (!b || !m) return;
    b.addEventListener('click', function () {
      var open = !html.classList.contains('menu-open');
      html.classList.toggle('menu-open', open);
      m.style.visibility = open ? 'visible' : 'hidden';
      m.style.clipPath = open ? 'none' : '';
      b.setAttribute('aria-expanded', String(open));
    });
  }
  function setupCopy() {
    d.querySelectorAll('[data-copy]').forEach(function (btn) {
      var label = btn.textContent;
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var done = function (msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = label; }, 1800); };
        var fallback = function () {
          var ta = d.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
          ta.style.position = 'fixed'; ta.style.opacity = '0'; d.body.appendChild(ta); ta.select();
          var ok = false; try { ok = d.execCommand('copy'); } catch (er) {}
          d.body.removeChild(ta); done(ok ? 'Copied' : 'Press Ctrl+C');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done('Copied'); }, fallback);
        else fallback();
      });
    });
  }
})();
