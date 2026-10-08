import socket
import threading
from config import HOST, PORT
from logger import log
from client_handler import ClientHandler
from room_manager import RoomManager

class LinkLoopServer:
    def __init__(self, host=HOST, port=PORT):
        self.host = host
        self.port = port
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.room_manager = RoomManager()

    def start(self):
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(10)
        log.info(f"TCP Server listening on {self.host}:{self.port}")

        try:
            while True:
                conn, addr = self.server_socket.accept()
                handler = ClientHandler(conn, addr, self.room_manager)
                client_thread = threading.Thread(target=handler.handle)
                client_thread.daemon = True
                client_thread.start()
        except KeyboardInterrupt:
            log.info("Server shutting down.")
        finally:
            self.server_socket.close()

if __name__ == "__main__":
    server = LinkLoopServer(host='127.0.0.1', port=9000)
    server.start()
