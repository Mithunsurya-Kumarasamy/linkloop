import socket
from config import HOST, PORT
from logger import log
from client_handler import ClientHandler

class LinkLoopServer:
    def __init__(self, host=HOST, port=PORT):
        self.host = host
        self.port = port
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    def start(self):
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(5)
        log.info(f"TCP Server listening on {self.host}:{self.port}")

        try:
            while True:
                conn, addr = self.server_socket.accept()
                log.info(f"Accepted connection from {addr}")
                handler = ClientHandler(conn, addr)
                handler.handle()
        except KeyboardInterrupt:
            log.info("Server shutting down.")
        finally:
            self.server_socket.close()

if __name__ == "__main__":
    server = LinkLoopServer(host='127.0.0.1', port=9000)
    server.start()
