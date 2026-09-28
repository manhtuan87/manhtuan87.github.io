/* ケロちゃん ランド — offline support for the menu.
   The menu sits at the top of the site, so this worker's scope ("/") also covers the games.
   It only answers requests for the menu's own files and the game icons it shows;
   everything else goes to the network (or to each game's own worker, which takes over
   once that game has been opened). Only caches named "land-..." are ever deleted here.
   Bump VERSION whenever the menu changes. The menu looks for new versions (of itself and of
   every game) whenever it is opened or comes back to the front; new files are fetched straight
   from the server, never from the browser's own cache. */
var VERSION = 'land-v7';
var FONTS = 'land-fonts';
var FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'offline.html',
  'js/lang.js', 'js/lang-text.js', 'js/draw.js', 'js/land.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];
// icons of the games, shown on the menu (add one line per new game)
var GAME_ICONS = [
  '/kero-mogumogu/icons/icon-192.png',
  '/kero-piyopiyo/icons/icon-192.png',
  '/kero-gungun/icons/icon-192.png',
  '/kero-mirumiru/icons/icon-192.png'
];

var BASE = new URL('./', self.location).href;
var OWN = FILES.concat(GAME_ICONS).map(function (f) { return new URL(f, BASE).href; });

// A file straight from the server, not from the browser's own cache (GitHub Pages lets browsers
// keep files for 10 minutes, which could otherwise put old files into a new version).
function fresh(f) { return new Request(f, { cache: 'reload' }); }

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION)
    .then(function (c) {
      return c.addAll(FILES.map(fresh)).then(function () {
        return Promise.all(GAME_ICONS.map(function (u) { return c.add(fresh(u)).catch(function () {}); }));
      });
    })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('land-') === 0 && k !== VERSION && k !== FONTS; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (url.origin === self.location.origin) {
    var key = url.origin + url.pathname;
    // The menu's own files: answer from the cache at once, refresh it in the background.
    if (OWN.indexOf(key) >= 0) {
      e.respondWith(caches.open(VERSION).then(function (c) {
        return c.match(req, { ignoreSearch: true }).then(function (hit) {
          var net = fetch(req.url, { cache: 'no-cache' }).then(function (res) {
            if (res.ok) c.put(req, res.clone());
            return res;
          }).catch(function () { return hit; });
          return hit || net;
        });
      }));
      return;
    }
    // A game that has never been opened, while offline: a friendly page instead of an error.
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).catch(function () { return caches.match(new URL('offline.html', BASE).href); }));
    }
    return;
  }

  // Rounded font from Google Fonts: keep a copy for offline use.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { c.put(req, res.clone()); return res; });
      });
    }));
  }
});
