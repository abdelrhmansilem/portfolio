/* ============================================================
   Abdelrhman Salim — Portfolio
   JS: particle background, dark/light theme, mobile menu, scroll nav
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     1) Dark / Light theme toggle
     - stored in localStorage
     - falls back to system preference when unset
  --------------------------------------------------------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById('theme-toggle');

  function currentTheme() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(mode) {
    root.dataset.theme = mode;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', mode === 'dark' ? '#0e1412' : '#f8f7f3');
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
    });
  }

  // follow OS theme changes while the user has no explicit preference
  var schemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  function onSchemeChange(e) {
    var stored = null;
    try {
      stored = localStorage.getItem('theme');
    } catch (err) {}
    if (!stored) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  }
  if (typeof schemeMedia.addEventListener === 'function') {
    schemeMedia.addEventListener('change', onSchemeChange);
  }

  /* ---------------------------------------------------------
     2) Animated particle-network background (canvas)
     Calm emerald nodes, soft linking lines, mouse attraction.
     Colors adapt automatically to the active theme.
  --------------------------------------------------------- */
  var canvas = document.getElementById('bg-canvas');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = null;
  var W = 0, H = 0, dpr = 1;
  var nodes = [];
  var raf = null;
  var LINK = 120;   // max node-node link distance
  var MOUSE = 150;  // mouse interaction radius
  var mouse = { x: -9999, y: -9999 };

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function palette() {
    var dark = currentTheme() === 'dark';
    return dark
      ? {
          node: '94, 214, 175',   // brighter mint on dark bg
          accent: '223, 194, 128',
          nodeA: 0.9,
          linkA: 0.16,
          mouseA: 0.3
        }
      : {
          node: '53, 160, 126',   // deep emerald on light bg
          accent: '176, 141, 87',
          nodeA: 0.75,
          linkA: 0.22,
          mouseA: 0.3
        };
  }

  function makeNodes() {
    var count = Math.min(90, Math.max(26, Math.round((W * H) / 22000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rand(-0.28, 0.28),
        vy: rand(-0.22, 0.22),
        r: rand(1, 2.2),
        gold: Math.random() < 0.14
      });
    }
  }

  function resize() {
    if (!ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeNodes();
    draw();
  }

  function step() {
    var i, n, dx, dy, d;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      // gentle attraction toward the cursor
      dx = mouse.x - n.x;
      dy = mouse.y - n.y;
      d = dx * dx + dy * dy;
      if (d < MOUSE * MOUSE && d > 1) {
        d = Math.sqrt(d);
        n.x += (dx / d) * 0.35;
        n.y += (dy / d) * 0.35;
      }

      // wrap around the edges (seamless field)
      if (n.x < -20) n.x = W + 20;
      else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      else if (n.y > H + 20) n.y = -20;
    }
  }

  function draw() {
    if (!ctx) return;
    var p = palette();
    var i, j, a, b, dx, dy, d2, d, alpha;

    ctx.clearRect(0, 0, W, H);

    // linking lines between close nodes
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x;
        dy = a.y - b.y;
        d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          d = Math.sqrt(d2);
          alpha = (1 - d / LINK) * p.linkA;
          ctx.strokeStyle = 'rgba(' + p.node + ', ' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // shimmering accent links toward the cursor
      dx = a.x - mouse.x;
      dy = a.y - mouse.y;
      d2 = dx * dx + dy * dy;
      if (d2 < MOUSE * MOUSE) {
        d = Math.sqrt(d2);
        alpha = (1 - d / MOUSE) * p.mouseA;
        ctx.strokeStyle = 'rgba(' + p.accent + ', ' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    // nodes
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      ctx.fillStyle = 'rgba(' + (a.gold ? p.accent : p.node) + ', ' + p.nodeA + ')';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    step();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf === null && !document.hidden && !reducedMotion) {
      raf = requestAnimationFrame(loop);
    }
  }

  function stop() {
    if (raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }

  if (canvas && canvas.getContext) {
    ctx = canvas.getContext('2d');
    resize();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener('mouseout', function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (reducedMotion) draw();
      else start();
    });

    if (reducedMotion) draw(); // one static frame only
    else start();
  }

  /* ---------------------------------------------------------
     3) Mobile hamburger menu closes on link tap
  --------------------------------------------------------- */
  var navToggle = document.getElementById('nav-toggle');
  if (navToggle) {
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        navToggle.checked = false;
      });
    });
  }

  /* ---------------------------------------------------------
     4) Highlight the active section in the nav while scrolling
  --------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a, .mobile-menu a')
  );
  var sections = ['home', 'about', 'skills', 'practice', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function markActive(id) {
    navLinks.forEach(function (l) {
      var isActive = l.getAttribute('href') === '#' + id;
      l.classList.toggle('active', isActive);
    });
  }
  markActive('home');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) markActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { observer.observe(s); });
  }
})();
