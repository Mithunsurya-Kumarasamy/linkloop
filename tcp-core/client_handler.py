from logger import log
from protocol import Protocol

class ClientHandler:
    def __init__(self, connection, address, room_manager):
        self.connection = connection
        self.address = address
        self.room_manager = room_manager
        self.username = None
        self.current_room = None

    def handle(self):
        log.info(f"Connection from {self.address}")
        try:
            buffer = ""
            while True:
                data = self.connection.recv(1024)
                if not data:
                    break
                buffer += data.decode('utf-8')
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    if line.strip():
                        self.process_message(line.strip())
        except Exception as e:
            log.error(f"Error with {self.address}: {e}")
        finally:
            self.room_manager.remove_user(self)
            self.connection.close()
            log.info(f"Connection closed for {self.address}")

    def process_message(self, message_str):
        try:
            msg = Protocol.decode(message_str.encode('utf-8'))
            if not msg: return
            msg_type = msg.get("type")
            
            if msg_type == "REGISTER":
                username = msg.get("username")
                if self.room_manager.register_user(username, self):
                    self.send({"type": "REGISTER_OK"})
                else:
                    self.send({"type": "ERROR", "message": "Username taken"})
            elif msg_type == "JOIN_ROOM":
                room = msg.get("room")
                if self.username:
                    self.room_manager.join_room(room, self)
                    self.send({"type": "JOIN_OK", "room": room})
            elif msg_type == "MESSAGE":
                if self.username and self.current_room:
                    content = msg.get("content")
                    self.room_manager.broadcast(self.current_room, self.username, content)
        except Exception as e:
            log.error(f"Message parsing error: {e}")

    def send(self, msg_dict):
        try:
            self.connection.sendall(Protocol.encode(msg_dict))
        except Exception as e:
            log.error(f"Send error: {e}")
