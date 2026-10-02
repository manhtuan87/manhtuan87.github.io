/* Moving house (2026-10-03): the family's ケロちゃん ランド moved from https://manhtuan87.github.io/ to
   https://kero.meosys.com/. The browser keeps every record per address ('kero-...' in localStorage), so the
   records do not follow by themselves:
   - at the old address the menu shows the moving card. Its button carries every 'kero-...' record to the new
     address, packed (gzip, when the phone can) in the part after '#' - a browser never sends that part to any
     server - and remembers that they were sent. The records also stay at the old address (nothing is deleted).
   - at the new address this file - loaded before every other one - reads them back. With no records there yet
     they replace the empty start; otherwise the menu asks before replacing what is there.
   On the PC, http://localhost:8767/?move=send&to=http://127.0.0.1:8767/ is an old address moving to 127.0.0.1
   (another address, so another storage). Move.start(...) shows the cards once the menu is built. */
var Move = (function () {
  'use strict';
  var OLD_HOST = 'manhtuan87.github.io', NEW_HOME = 'https://kero.meosys.com/';
  var PREFIX = 'kero-', SENT = 'kero-moved', DONE = 'kero-move-done';
  var PLAIN = '#move=', ZIPPED = '#movez=';
  var KEY_OK = /^kero-[a-z0-9-]{1,40}$/;
  var LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var q = new URLSearchParams(location.search);
  var sender = location.hostname === OLD_HOST || (LOCAL && q.get('move') === 'send');
  var home = LOCAL && /^http:\/\/(localhost|127\.0\.0\.1):\d+\/$/.test(q.get('to') || '') ? q.get('to') : NEW_HOME;

  function store() { try { return window.localStorage; } catch (e) { return null; } }
  // this address's own records (not the note that they were sent)
  function own() {
    var s = store(), out = [];
    if (!s) return out;
    try {
      for (var i = 0; i < s.length; i++) {
        var k = s.key(i);
        if (k && k.indexOf(PREFIX) === 0 && k !== SENT) out.push(k);
      }
    } catch (e) { /* none */ }
    return out;
  }

  // bytes <-> base64 that is safe in an address; gzip with the browser's own streams
  function b64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64(text) {
    var bin = atob(text.replace(/-/g, '+').replace(/_/g, '/')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function gzip(bytes, unzip) {
    var s = new Blob([bytes]).stream().pipeThrough(unzip ? new DecompressionStream('gzip') : new CompressionStream('gzip'));
    return new Response(s).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  // the records in what arrived (only 'kero-...' keys with text values)
  function records(bytes) {
    var p = JSON.parse(new TextDecoder().decode(bytes)), data = {}, n = 0;
    if (!p || p.v !== 1 || !p.data || typeof p.data !== 'object') throw new Error('not a move');
    Object.keys(p.data).forEach(function (k) {
      if (KEY_OK.test(k) && k !== SENT && typeof p.data[k] === 'string') { data[k] = p.data[k]; n++; }
    });
    if (!n) throw new Error('nothing to move');
    return data;
  }
  // what was here before goes (the menu asks first when there was anything)
  function save(data) {
    var s = store();
    if (!s) return false;
    try {
      own().forEach(function (k) { s.removeItem(k); });
      Object.keys(data).forEach(function (k) { s.setItem(k, data[k]); });
      return true;
    } catch (e) { return false; }
  }

  // ---------------------------------------------------------------- at the new address: right away, before the menu
  var state = '', pending = null, started = false;   // state: '' | 'wait' | 'done' | 'ask' | 'bad'
  function saved() {   // start again with the records in place, then say so
    try { sessionStorage.setItem(DONE, '1'); } catch (e) { /* ignore */ }
    location.reload();
  }
  (function arrive() {
    var h = location.hash, zipped = h.indexOf(ZIPPED) === 0;
    if (sender || !(zipped || h.indexOf(PLAIN) === 0)) {
      try { if (!sender && sessionStorage.getItem(DONE)) { sessionStorage.removeItem(DONE); state = 'done'; } } catch (e) { /* ignore */ }
      return;
    }
    var text = h.slice(zipped ? ZIPPED.length : PLAIN.length);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }   // (a reload must not bring them again)
    var had = own().length > 0;   // (looked at before the menu writes its first player)
    if (!zipped) {
      try {
        pending = records(unb64(text));
        state = had ? 'ask' : (save(pending) ? 'done' : 'bad');
      } catch (e) { state = 'bad'; }
      return;
    }
    state = 'wait';
    Promise.resolve().then(function () { return gzip(unb64(text), true); }).then(function (bytes) {
      pending = records(bytes);
      if (had) { state = 'ask'; render(); return; }
      if (!save(pending)) throw new Error('not saved');
      saved();
    }).catch(function () { state = 'bad'; render(); });
  }());
  // (records arriving while the menu is already open here: read them the same way, from the start)
  window.addEventListener('hashchange', function () {
    if (!sender && (location.hash.indexOf(PLAIN) === 0 || location.hash.indexOf(ZIPPED) === 0)) location.reload();
  });

  // ---------------------------------------------------------------- the cards (once the menu is built)
  var opt = { click: function () {} }, card = null, busy = false;
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function button(txt, cls, fn) {
    var b = el('button', 'btn ' + (cls || ''), txt);
    b.addEventListener('click', function () { opt.click(); fn(b); });
    return b;
  }
  function show(title, lines, buttons) {
    if (card) card.remove();
    card = el('div', 'panel on move-panel');
    var c = el('div', 'panel-card');
    c.appendChild(el('div', 'panel-title', title));
    lines.forEach(function (l) { c.appendChild(typeof l === 'string' ? el('p', 'panel-note move-note', l) : l); });
    var col = el('div', 'move-buttons');
    buttons.forEach(function (b) { col.appendChild(b); });
    c.appendChild(col);
    card.appendChild(c);
    document.getElementById('stage').appendChild(card);
  }
  function close() { if (card) { card.remove(); card = null; } }
  function address() { return el('div', 'move-addr', home.replace(/^https?:\/\//, '').replace(/\/$/, '')); }

  // the old address: send everything to the new one
  function go(withRecords) {
    if (busy) return;
    if (!withRecords) { location.href = home; return; }
    busy = true;
    var s = store(), data = {};
    own().forEach(function (k) { try { data[k] = s.getItem(k); } catch (e) { /* skip */ } });
    var bytes = new TextEncoder().encode(JSON.stringify({ v: 1, from: location.host, at: Date.now(), data: data }));
    var send = function (tag, b) {
      try { s.setItem(SENT, String(Date.now())); } catch (e) { /* ignore */ }
      location.href = home + tag + b64(b);
    };
    if (typeof CompressionStream !== 'function') { send(PLAIN, bytes); return; }
    gzip(bytes, false).then(function (z) { send(ZIPPED, z); }, function () { send(PLAIN, bytes); });
  }
  function senderCard() {
    var sent = false;
    try { sent = !!store().getItem(SENT); } catch (e) { /* ignore */ }
    if (!sent) {
      show(L('ケロちゃん ランドは おひっこし したよ！'),
        [L('あたらしい ばしょで あそんでね。きろくも ぜんぶ もっていくよ。'), address()],
        [button(L('おひっこし する'), 'ok move-go', function () { go(true); })]);
    } else {
      show(L('ケロちゃん ランドは おひっこし したよ！'),
        [L('あたらしい ばしょを ひらいてね。'), address()],
        [button(L('あたらしい ランドを ひらく'), 'ok move-go', function () { go(false); }),
         button(L('きろくを もう いちど おくる'), 'small move-again', function () { go(true); })]);
    }
  }

  // the new address
  function doneCard() {
    var inst = button(L('ホームに ついか'), 'ok move-go', function () {
      var b = document.getElementById('btn-install');
      if (b && !b.hidden) b.click();
    });
    inst.hidden = true;
    show(L('おひっこし できたよ！'),
      [L('きろくも ぜんぶ もってきたよ。'), L('この ランドを ホームに ついか して、ふるい ほうは けしてね。')],
      [inst, button(L('とじる'), '', close)]);
    // (shown when the phone offers to add it, which may be a moment later)
    var t = setInterval(function () {
      if (!inst.isConnected) { clearInterval(t); return; }
      var b = document.getElementById('btn-install');
      inst.hidden = !b || b.hidden;
    }, 400);
  }
  function askCard() {
    show(L('まえの きろくで うわがき する？'),
      [L('この スマホの あたらしい ランドには もう きろくが あるよ。うわがき すると いまの きろくは きえるよ。')],
      [button(L('うわがき する'), 'ok move-go', function () {
        if (save(pending)) saved();
        else { state = 'bad'; render(); }
      }),
       button(L('やめる'), '', function () { state = ''; pending = null; close(); })]);
  }
  function badCard() {
    show(L('きろくを よめなかったよ'),
      [L('まえの ランドで もう いちど「おひっこし する」を おしてね。')],
      [button(L('とじる'), '', function () { state = ''; close(); })]);
  }

  function render() {
    if (!started) return;
    if (sender) senderCard();
    else if (state === 'done') doneCard();
    else if (state === 'ask') askCard();
    else if (state === 'bad') badCard();
  }
  function start(o) { opt = o || opt; started = true; render(); }

  return {
    start: start,
    // the old address, or records on their way / waiting for an answer: the menu does not get the games ready
    // (they would write records of their own)
    holds: function () { return sender || state === 'ask' || state === 'wait'; },
    sender: sender, home: home
  };
}());
