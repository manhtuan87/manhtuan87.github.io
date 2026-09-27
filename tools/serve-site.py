# Serves the whole site the way GitHub Pages does, for trying it on the PC:
#   /                  -> this menu (kero-land)
#   /kero-mogumogu/    -> the game folders next to it (C:\sagyo\kero-mogumogu, ...)
# usage: python tools/serve-site.py [port]      then open http://localhost:8767/
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.dirname(ROOT)


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        first = path.split('?', 1)[0].split('#', 1)[0].lstrip('/').split('/', 1)[0]
        game = os.path.join(SITE, first)
        is_game = first and first != os.path.basename(ROOT) and os.path.isfile(os.path.join(game, 'index.html'))
        self.directory = SITE if is_game else ROOT
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')   # always the newest files while testing
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8767
    http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
