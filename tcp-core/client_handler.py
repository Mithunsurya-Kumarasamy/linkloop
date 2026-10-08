from logger import log

class ClientHandler:
    def __init__(self, connection, address):
        self.connection = connection
        self.address = address

    def handle(self):
        log.info(f"Handling connection from {self.address}")
        try:
            while True:
                data = self.connection.recv(1024)
                if not data:
                    break
                decoded = data.decode('utf-8').strip()
                log.info(f"Received from {self.address}: {decoded}")
                self.connection.sendall(f"{decoded} received\n".encode('utf-8'))
        except Exception as e:
            log.error(f"Error with {self.address}: {e}")
        finally:
            log.info(f"Connection closed for {self.address}")
            self.connection.close()
