/* ケロちゃん ランド — the menu that opens every game.
   To add a game: put it in its own folder on the site (like /kero-mogumogu/),
   add one line to GAMES below, and add its icon to GAME_ICONS in sw.js. */
(function () {
  'use strict';
  var D = window.Draw, W = 360, H = 640;
  var $ = function (id) { return document.getElementById(id); };

  var GAMES = [
    { name: 'ケロちゃん\nもぐもぐ', url: '/kero-mogumogu/', icon: '/kero-mogumogu/icons/icon-192.png', c1: '#c4ebff', c2: '#f0faff' },
    { name: 'ケロちゃん\nぴよぴよポン', url: '/kero-piyopiyo/', icon: '/kero-piyopiyo/icons/icon-192.png', c1: '#ffe99e', c2: '#fffbe8' }
  ];

  // ---------------------------------------------------------------- view (the 360 x 640 stage, scaled to fit)

  var canvas = $('scene'), ctx = canvas.getContext('2d'), stageEl = $('stage');
  var view = { cw: 1, ch: 1, dpr: 1, s: 1, ox: 0, oy: 0 }, bg = null;

  function resize() {
    var cw = window.innerWidth, ch = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    var s = Math.min(cw / W, ch / H);
    view = { cw: cw, ch: ch, dpr: dpr, s: s, ox: (cw - W * s) / 2, oy: (ch - H * s) / 2 };
    stageEl.style.transform = 'translate(' + view.ox + 'px,' + view.oy + 'px) scale(' + s + ')';
    bg = null;
  }
  function worldTransform(c) { c.setTransform(view.dpr * view.s, 0, 0, view.dpr * view.s, view.dpr * view.ox, view.dpr * view.oy); }
  function visible() {
    var x0 = -view.ox / view.s, y0 = -view.oy / view.s;
    return { x0: x0, y0: y0, x1: x0 + view.cw / view.s, y1: y0 + view.ch / view.s };
  }

  function drawBackground() {
    if (!bg) {
      bg = document.createElement('canvas');
      bg.width = canvas.width; bg.height = canvas.height;
      var b = bg.getContext('2d'), v = visible();
      worldTransform(b);
      D.background(b, 4, v.x0, v.y0, v.x1, v.y1);   // mint sky with a rainbow
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg, 0, 0);
  }

  // ---------------------------------------------------------------- the little scene: a cloud island in the sky

  var BALLOON_COLORS = ['#ff94c2', '#ffd23d', '#66c3ff', '#8bd86a', '#b48cff', '#ffa552'];
  var scene = { t: 0, balloons: [], chicks: [], hopT: 3, crit: { mode: 'idle', mt: 0, blink: false, blinkT: 2, look: null, lookT: 0 } };
  for (var i = 0; i < 7; i++) {
    scene.balloons.push({ x: 20 + Math.random() * 320, y: 80 + Math.random() * 560, r: 13 + Math.random() * 6, vy: 14 + Math.random() * 12, k: i % BALLOON_COLORS.length, seed: Math.random() * 6 });
  }
  [[78, 1, 0], [118, -1, 3], [248, 1, 1], [292, -1, 2]].forEach(function (p) {
    scene.chicks.push({ x: p[0], vx: p[1] * (16 + Math.random() * 14), t: Math.random() * 3, stop: Math.random() * 2, shell: p[2] });
  });

  var ISLAND = [[-118, 6, 22], [-88, -4, 26], [-52, 2, 28], [-14, -6, 30], [24, 0, 30], [62, -4, 28], [96, 2, 26], [122, 8, 20], [-70, 16, 22], [0, 16, 26], [70, 16, 22]];
  function island(c, x, y) {
    c.lineJoin = 'round';
    ISLAND.forEach(function (p) { D.circle(c, x + p[0], y + p[1], p[2]); D.paint(c, null, '#8fb9e0', 5); });
    ISLAND.forEach(function (p) { D.circle(c, x + p[0], y + p[1], p[2]); D.paint(c, '#ffffff'); });
    D.ellipse(c, x - 60, y - 16, 16, 5, -0.2); D.paint(c, 'rgba(200,225,255,.8)');
    D.ellipse(c, x + 50, y - 20, 12, 4, 0.1); D.paint(c, 'rgba(200,225,255,.8)');
  }

  function balloon(c, b, t) {
    var sway = Math.sin(t * 1.3 + b.seed) * 5, x = b.x + sway, y = b.y, r = b.r;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y + r * 1.05);
    c.quadraticCurveTo(x - sway * 0.6 + 5, y + r * 2, x - sway * 0.4, y + r * 3);
    D.paint(c, null, 'rgba(90,56,37,.45)', 1.6);
    D.ellipse(c, x, y, r * 0.86, r); D.paint(c, BALLOON_COLORS[b.k], D.INK, 2.4);
    c.beginPath(); c.moveTo(x - 3.5, y + r + 4); c.lineTo(x, y + r - 1); c.lineTo(x + 3.5, y + r + 4); c.closePath();
    D.paint(c, BALLOON_COLORS[b.k], D.INK, 1.8);
    D.ellipse(c, x - r * 0.35, y - r * 0.4, r * 0.2, r * 0.13, -0.7); D.paint(c, 'rgba(255,255,255,.85)');
  }

  function update(dt) {
    var sc = scene, f = sc.crit;
    sc.t += dt;
    sc.balloons.forEach(function (b) {
      b.y -= b.vy * dt;
      if (b.y < -60) { b.y = 680 + Math.random() * 60; b.x = 20 + Math.random() * 320; }
    });
    sc.chicks.forEach(function (ch) {
      ch.t += dt; ch.stop -= dt;
      if (ch.stop < 0) {
        ch.x += ch.vx * dt;
        var lo = ch.x < 180 ? 48 : 232, hi = ch.x < 180 ? 128 : 312;
        if (ch.x < lo || ch.x > hi) { ch.vx = -ch.vx; ch.x = Math.max(lo, Math.min(hi, ch.x)); }
        if (Math.random() < 0.005) ch.stop = 0.8 + Math.random() * 1.6;
      }
    });
    f.mt += dt;
    sc.hopT -= dt;
    if (sc.hopT < 0) { f.mode = 'happy'; f.mt = 0; sc.hopT = 3.5 + Math.random() * 3; }
    if (f.mode === 'happy' && f.mt > 1) f.mode = 'idle';
    f.lookT -= dt;
    if (f.lookT < 0) { var b = sc.balloons[Math.floor(Math.random() * sc.balloons.length)]; f.look = { x: b.x, y: b.y }; f.lookT = 2 + Math.random() * 2; }
    f.blinkT -= dt;
    if (f.blinkT < 0) { f.blink = true; if (f.blinkT < -0.13) { f.blink = false; f.blinkT = 2 + Math.random() * 3; } }
  }

  function draw() {
    drawBackground();
    var c = ctx, sc = scene, t = sc.t, f = sc.crit;
    worldTransform(c);
    sc.balloons.forEach(function (b) { balloon(c, b, t); });
    island(c, 180, 344);
    c.save(); c.translate(180, 296); c.scale(0.8, 0.8); c.translate(-180, -296);
    D.critter(c, { x: 180, y: 296, t: t, kind: 'frog', look: f.look, mode: f.mode, mt: f.mt, blink: f.blink });
    c.restore();
    sc.chicks.forEach(function (ch) {
      var moving = ch.stop < 0;
      D.chick(c, ch.x, 322 - (moving ? Math.abs(Math.sin(ch.t * 10)) * 5 : 0), 0.72, t + ch.shell, { run: moving, shell: ch.shell, dir: ch.vx > 0 ? 1 : -1, happy: !moving });
    });
  }

  // ---------------------------------------------------------------- the games

  var ac = null;
  function click() {
    try {
      if (!ac) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ac = new AC(); }
      var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.07);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.15);
    } catch (e) { /* sound is best-effort */ }
  }

  function buildGames() {
    var box = $('games');
    GAMES.forEach(function (g) {
      var a = document.createElement('a');
      a.className = 'game';
      a.href = g.url;
      a.style.setProperty('--c1', g.c1);
      a.style.setProperty('--c2', g.c2);
      var img = document.createElement('img');
      img.src = g.icon; img.alt = '';
      var nm = document.createElement('span');
      nm.className = 'game-name'; nm.textContent = g.name;
      a.appendChild(img); a.appendChild(nm);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        click();
        a.classList.add('go');
        scene.crit.mode = 'happy'; scene.crit.mt = 0;
        setTimeout(function () { location.href = g.url; }, 180);
      });
      box.appendChild(a);
    });
  }
  // coming back with the back button: the page may be restored as it was
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('.game.go').forEach(function (a) { a.classList.remove('go'); });
  });

  // ---------------------------------------------------------------- offline: get every game ready once

  // Opening a game once (in a hidden frame) lets it store itself for offline play,
  // so every game works without a connection after the land has been opened online.
  function prepareGames() {
    if (location.protocol !== 'https:' || !('serviceWorker' in navigator) || !navigator.onLine) return;
    var queue = GAMES.slice();
    function ready(scope) {
      return navigator.serviceWorker.getRegistrations().then(function (rs) {
        return rs.some(function (r) { return r.scope === scope && r.active; });
      });
    }
    (function next() {
      var g = queue.shift();
      if (!g) return;
      var scope = new URL(g.url, location.href).href;
      ready(scope).then(function (done) {
        if (done) { next(); return; }
        var f = document.createElement('iframe');
        f.src = g.url;
        f.setAttribute('aria-hidden', 'true');
        f.tabIndex = -1;
        f.style.cssText = 'position:fixed;left:-20px;top:-20px;width:2px;height:2px;border:0;opacity:0;pointer-events:none';
        document.body.appendChild(f);
        var tries = 0, timer = setInterval(function () {
          ready(scope).then(function (ok) {
            if (ok || ++tries > 60) { clearInterval(timer); f.remove(); next(); }
          });
        }, 500);
      }).catch(function () { /* ignore */ });
    }());
  }

  // ---------------------------------------------------------------- icons & install

  var ICONS = { install: '<path d="M12 4v10M7.5 9.5 12 14l4.5-4.5M5 19h14"/>' };
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[el.getAttribute('data-icon')] + '</svg>';
  });
  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; $('btn-install').hidden = false; });
  $('btn-install').addEventListener('click', function () {
    if (!installEvt) return;
    click();
    installEvt.prompt();
    installEvt.userChoice.then(function () { installEvt = null; $('btn-install').hidden = true; });
  });
  window.addEventListener('appinstalled', function () { $('btn-install').hidden = true; });

  // ---------------------------------------------------------------- start

  var lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    update(dt);
    draw();
  }

  window.addEventListener('resize', resize);
  resize();
  buildGames();
  requestAnimationFrame(frame);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  setTimeout(prepareGames, 2500);
}());
