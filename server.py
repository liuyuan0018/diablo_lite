import http.server
import socketserver
import os

PORT = 8080

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Route /m to m.html
        if self.path == '/m' or self.path == '/m/':
            self.path = '/m.html'
        return super().do_GET()

with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving at http://0.0.0.0:{PORT} (no-cache mode)")
    httpd.serve_forever()
