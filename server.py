import http.server
import socketserver
import webbrowser
import os
import socket

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Clean terminal logging
        pass


def run():
    global PORT
    for attempt in range(10):
        try:
            with socketserver.TCPServer(("", PORT), Handler) as httpd:
                local_url = f"http://localhost:{PORT}"
                network_url = f"http://{get_local_ip()}:{PORT}"

                print("=" * 60)
                print("  [*] STICKFALL WEB SERVER IS LIVE!")
                print(f"  [>] Local URL:   {local_url}")
                print(f"  [>] Network URL: {network_url}")
                print("=" * 60)
                print("  Press Ctrl+C to stop the server.")

                # Open the browser automatically
                webbrowser.open(local_url)

                httpd.serve_forever()
        except OSError:
            PORT += 1


if __name__ == "__main__":
    run()
