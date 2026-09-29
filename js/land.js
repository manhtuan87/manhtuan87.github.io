/* ケロちゃん ランド — the menu that opens every game.
   To add a game: put it in its own folder on the site (like /kero-mogumogu/),
   add one line to GAMES below, and add its icon to GAME_ICONS in sw.js. */
(function () {
  'use strict';
  var D = window.Draw, W = 360, H = 640;
  var $ = function (id) { return document.getElementById(id); };

  var GAMES = [
    { name: 'ケロちゃん\nもぐもぐ', url: '/kero-mogumogu/', icon: '/kero-mogumogu/icons/icon-192.png', c1: '#c4ebff', c2: '#f0faff' },
    { name: 'ケロちゃん\nぴよぴよポン', url: '/kero-piyopiyo/', icon: '/kero-piyopiyo/icons/icon-192.png', c1: '#ffe99e', c2: '#fffbe8' },
    { name: 'ケロちゃん\nあたま ぐんぐん', url: '/kero-gungun/', icon: '/kero-gungun/icons/icon-192.png', c1: '#ffd3e6', c2: '#fff6fb' },
    { name: 'ケロちゃん\nみるみる', url: '/kero-mirumiru/', icon: '/kero-mirumiru/icons/icon-192.png', c1: '#bff3e2', c2: '#f1fffb' }
  ];

  // ---------------------------------------------------------------- view (the 360 x 640 stage, scaled to fit)

  var canvas = $('scene'), ctx = canvas.getContext('2d'), stageEl = $('stage'), scroller = $('scroller');
  var view = { cw: 1, ch: 1, dpr: 1, s: 1, ox: 0, oy: 0 }, bg = null;

  // The menu scrolls, so the stage starts at the top of the screen and reaches the bottom
  // (taller than 640 on tall phones).
  function resize() {
    var cw = window.innerWidth, ch = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    var s = Math.min(cw / W, ch / H);
    view = { cw: cw, ch: ch, dpr: dpr, s: s, ox: (cw - W * s) / 2, oy: 0 };
    stageEl.style.height = Math.max(H, ch / s) + 'px';
    stageEl.style.transform = 'translate(' + view.ox + 'px,0) scale(' + s + ')';
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
    if (!(view.s > 0)) return;   // (a window with no size yet)
    drawBackground();
    var c = ctx, sc = scene, t = sc.t, f = sc.crit;
    worldTransform(c);
    sc.balloons.forEach(function (b) { balloon(c, b, t); });
    // the island scrolls with the page (it sits in the gap between the title and the games)
    c.translate(0, 18 - scroller.scrollTop);
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
  // (silent on the PC, localhost, so trying the site there makes no sound)
  var QUIET = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  function click() {
    if (QUIET) return;
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
      nm.className = 'game-name'; nm.textContent = L(g.name);
      g.verEl = document.createElement('span');   // (the version, filled in by showVersions)
      g.verEl.className = 'game-ver';
      a.appendChild(img); a.appendChild(nm); a.appendChild(g.verEl);
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

  var ICONS = {
    install: '<path d="M12 4v10M7.5 9.5 12 14l4.5-4.5M5 19h14"/>',
    pencil: '<path d="M4.5 19.5l1.2-4.4L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.9 18.3z"/><path d="M13.6 7.2l3.2 3.2"/>',
    globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.6 12h16.8M12 3.4c2.5 2.4 3.7 5.3 3.7 8.6s-1.2 6.2-3.7 8.6c-2.5-2.4-3.7-5.3-3.7-8.6s1.2-6.2 3.7-8.6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }
  document.querySelectorAll('[data-icon]').forEach(function (el) { el.innerHTML = svg(el.getAttribute('data-icon')); });
  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; $('btn-install').hidden = false; });
  $('btn-install').addEventListener('click', function () {
    if (!installEvt) return;
    click();
    installEvt.prompt();
    installEvt.userChoice.then(function () { installEvt = null; $('btn-install').hidden = true; });
  });
  window.addEventListener('appinstalled', function () { $('btn-install').hidden = true; });

  // ---------------------------------------------------------------- players, shared by every game on the site
  // Chosen here: every game starts with the player chosen (a game can switch players too, and edit them). The list
  // is kept by js/accounts.js ('kero-users'); each game keeps its records per player. No password here (the user's
  // choice); removing a player asks for a second tap.

  var editing = null, delArmed = false;
  // The first time: the players that あたま ぐんぐん and みるみる had of their own join the shared list, so they are
  // all here at once (each game moves its records to the shared players when it is opened; see Accounts.adopt).
  (function adoptGames() {
    ['kero-gungun-v1', 'kero-mirumiru-v1'].forEach(function (key) {
      var s = null;
      try { s = JSON.parse(localStorage.getItem(key)); } catch (e) { s = null; }
      if (!s || s.shared || !Array.isArray(s.users)) return;
      Accounts.adopt(s.users.map(function (u) {
        return { id: u && u.id, name: u && u.name, type: u && u.type, color: u && u.color };
      }));
    });
  }());
  function panel(id, on) { $(id).classList.toggle('on', on); }
  function typeName(u) { return L(u.type === 'adult' ? 'おとな' : 'こども'); }
  function refreshUser() {
    var u = Accounts.cur(), many = Accounts.list().length > 1;
    $('user-dot').style.background = Accounts.COLORS[u.color];
    $('user-label').textContent = u.name || L(many ? 'なまえなし' : 'なまえ');
    $('sub').textContent = u.name ? L('{name}、ゲームを えらんでね！', { name: u.name }) : L('あそびたい ゲームを えらんでね！');
  }
  function buildUsers() {
    var box = $('user-list'), now = Accounts.cur().id, list = Accounts.list();
    box.innerHTML = '';
    list.forEach(function (u) {
      var row = document.createElement('div');
      row.className = 'user-row';
      var b = document.createElement('button');
      b.className = 'btn user-pick' + (u.id === now ? ' on' : '');
      b.innerHTML = '<i class="udot" style="background:' + Accounts.COLORS[u.color] + '"></i>';
      var nm = document.createElement('span');
      nm.className = 'uname'; nm.textContent = u.name || L('なまえなし');
      var ty = document.createElement('small');
      ty.textContent = typeName(u);
      b.appendChild(nm); b.appendChild(ty);
      b.addEventListener('click', function () {
        click();
        Accounts.setCur(u.id);
        refreshUser();
        panel('users-panel', false);
        scene.crit.mode = 'happy'; scene.crit.mt = 0;
      });
      var e = document.createElement('button');
      e.className = 'btn small icon user-edit';
      e.setAttribute('aria-label', L('なおす'));
      e.innerHTML = svg('pencil');
      e.addEventListener('click', function () { click(); openEdit(u); });
      row.appendChild(b); row.appendChild(e);
      box.appendChild(row);
    });
    $('user-add').hidden = list.length >= Accounts.MAX;
  }
  function openEdit(u) {
    delArmed = false;
    var used = Accounts.list().map(function (x) { return x.color; }), free = 0;
    while (used.indexOf(free) >= 0 && free < Accounts.COLORS.length - 1) free++;
    editing = u ? { id: u.id, name: u.name, type: u.type, color: u.color } : { id: null, name: '', type: 'kid', color: free };
    $('ue-name').value = editing.name;
    $('ue-del').hidden = !u || Accounts.list().length <= 1;
    $('ue-del').textContent = L('けす');
    renderEdit();
    panel('users-panel', false);
    panel('uedit-panel', true);
  }
  function renderEdit() {
    document.querySelectorAll('#ue-type button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === editing.type); });
    var sw = $('ue-color');
    sw.innerHTML = '';
    Accounts.COLORS.forEach(function (c, i) {
      var b = document.createElement('button');
      b.style.background = c;
      b.className = editing.color === i ? 'on' : '';
      b.setAttribute('aria-label', String(i + 1));
      b.addEventListener('click', function () { click(); editing.color = i; renderEdit(); });
      sw.appendChild(b);
    });
  }
  function backToUsers() { panel('uedit-panel', false); buildUsers(); panel('users-panel', true); refreshUser(); }
  $('btn-user').addEventListener('click', function () { click(); Accounts.reload(); buildUsers(); panel('users-panel', true); });
  $('users-close').addEventListener('click', function () { click(); panel('users-panel', false); });
  $('user-add').addEventListener('click', function () { click(); openEdit(null); });
  document.querySelectorAll('#ue-type button').forEach(function (b) {
    b.addEventListener('click', function () { click(); editing.type = b.getAttribute('data-v'); renderEdit(); });
  });
  $('ue-cancel').addEventListener('click', function () { click(); backToUsers(); });
  $('ue-ok').addEventListener('click', function () {
    click();
    var name = $('ue-name').value.trim().slice(0, Accounts.NAME_MAX);
    if (editing.id) Accounts.update(editing.id, { name: name, type: editing.type, color: editing.color });
    else Accounts.add(name, editing.type, editing.color);
    backToUsers();
  });
  $('ue-del').addEventListener('click', function () {
    click();
    if (!delArmed) { delArmed = true; $('ue-del').textContent = L('もう一度 おすと けすよ'); return; }
    Accounts.remove(editing.id);
    backToUsers();
  });
  // (a game may have switched or edited the players meanwhile)
  window.addEventListener('pageshow', function (e) { if (e.persisted) { Accounts.reload(); refreshUser(); showVersions(); } });

  // ---------------------------------------------------------------- versions: the one on this phone (each app's sw.js
  // answers), or, for a game not stored yet (and on the PC), the newest on the site

  function askVersion(worker) {
    return new Promise(function (ok) {
      if (!worker || typeof MessageChannel === 'undefined') { ok(null); return; }
      var ch = new MessageChannel(), t = setTimeout(function () { ok(null); }, 1500);
      ch.port1.onmessage = function (e) { clearTimeout(t); ok(typeof e.data === 'string' ? e.data : null); };
      try { worker.postMessage('version', [ch.port2]); } catch (e) { clearTimeout(t); ok(null); }
    });
  }
  function siteVersion(url) {
    return fetch(new URL('sw.js', new URL(url, location.href)).href, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { var m = /var VERSION = '([^']+)'/.exec(t); return m ? m[1] : null; })
      .catch(function () { return null; });
  }
  function verText(v) { var m = /-v(\d+)$/.exec(v || ''); return m ? 'v' + m[1] : ''; }
  function showVersions() {
    var sw = 'serviceWorker' in navigator && location.protocol === 'https:';
    (sw ? navigator.serviceWorker.getRegistrations() : Promise.resolve([])).catch(function () { return []; }).then(function (rs) {
      var apps = [{ url: './', el: $('land-ver'), name: L('ケロちゃん ランド') }].concat(GAMES.map(function (g) { return { url: g.url, el: g.verEl }; }));
      apps.forEach(function (a) {
        var scope = new URL(a.url, location.href).href, r = rs.filter(function (x) { return x.scope === scope; })[0];
        askVersion(r && r.active).then(function (v) { return v || siteVersion(a.url); }).then(function (v) {
          if (v && verText(v)) a.el.textContent = (a.name ? a.name + ' ' : '') + verText(v);
        });
      });
    });
  }

  // ---------------------------------------------------------------- language, shared by every game on the site
  // Saved here like the nickname ('kero-lang'); every game reads it when it starts (js/lang.js).

  // The big title in the chosen language: every letter hops on its own.
  var LOGO_COLORS = ['#86d65c', '#ff8fc0', '#ffb347', '#6cc6ff', '#b58cff', '#ffd23d', '#ff8fc0', '#6cc6ff'];
  function buildLogo() { Lang.logo(document.querySelector('.logo'), Lang.pick(LAND_LOGO), LOGO_COLORS); }
  function buildLangs() {
    var box = $('lang-list');
    Lang.LIST.forEach(function (l) {
      var b = document.createElement('button');
      b.className = 'btn lang-item' + (l.id === Lang.cur ? ' on' : '');
      b.lang = l.id;
      b.textContent = l.name;
      b.addEventListener('click', function () {
        click();
        if (l.id === Lang.cur) { $('lang-panel').classList.remove('on'); return; }
        Lang.set(l.id);
        location.reload();   // (the whole page starts again in the new language)
      });
      box.appendChild(b);
    });
  }
  $('btn-lang').addEventListener('click', function () { click(); $('lang-panel').classList.add('on'); });
  $('lang-close').addEventListener('click', function () { click(); $('lang-panel').classList.remove('on'); });

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
  buildLogo();
  Lang.apply();
  buildLangs();
  buildGames();
  refreshUser();
  showVersions();
  requestAnimationFrame(frame);

  // Offline play and updates. A new version of the menu, and of every game already on the phone, is looked
  // for whenever the menu is opened or comes back to the front, so a game opened from here is the newest one.
  // When the menu itself has a new version, the page reloads itself (unless the name panel is open).
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    var swHad = !!navigator.serviceWorker.controller, swNew = false;
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function () {});
    var swCheck = function () {
      if (document.hidden || !navigator.onLine) return;
      navigator.serviceWorker.getRegistrations().then(function (rs) {
        return Promise.all(rs.map(function (r) { return r.update().catch(function () {}); }));
      }).then(function () { setTimeout(showVersions, 3000); }).catch(function () {});   // (a new version may have come)
    };
    setTimeout(swCheck, 1500);
    document.addEventListener('visibilitychange', swCheck);
    window.addEventListener('pageshow', function (e) { if (e.persisted) swCheck(); });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (swHad) swNew = true;   // (not the first time the menu is stored)
      swHad = true;
    });
    setInterval(function () {
      if (swNew && !document.hidden && !document.querySelector('.panel.on')) { swNew = false; location.reload(); }
    }, 700);
  }
  setTimeout(prepareGames, 2500);
}());
