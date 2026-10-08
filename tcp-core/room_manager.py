import threading
from logger import log
from protocol import Protocol

class RoomManager:
    def __init__(self):
        self.lock = threading.Lock()
        self.rooms = {}
        self.usernames = {}

    def register_user(self, username, client):
        with self.lock:
            if username in self.usernames:
                return False
            self.usernames[username] = client
            client.username = username
            log.info(f"User registered: {username}")
            return True

    def remove_user(self, client):
        with self.lock:
            if client.username and client.username in self.usernames:
                del self.usernames[client.username]
            for room_name, members in list(self.rooms.items()):
                if client in members:
                    members.remove(client)
                    self._broadcast_internal(room_name, f"{client.username} left the room.", exclude=client)

    def create_room(self, room_name):
        with self.lock:
            if room_name not in self.rooms:
                self.rooms[room_name] = set()
                return True
            return False

    def join_room(self, room_name, client):
        with self.lock:
            if room_name not in self.rooms:
                self.rooms[room_name] = set()
            self.rooms[room_name].add(client)
            client.current_room = room_name
        self._broadcast_internal(room_name, f"{client.username} joined the room.", exclude=client)
        log.info(f"{client.username} joined room {room_name}")
        return True

    def leave_room(self, room_name, client):
        with self.lock:
            if room_name in self.rooms and client in self.rooms[room_name]:
                self.rooms[room_name].remove(client)
                client.current_room = None
        self._broadcast_internal(room_name, f"{client.username} left the room.")
        return True

    def list_rooms(self):
        with self.lock:
            return list(self.rooms.keys())

    def list_users(self, room_name):
        with self.lock:
            if room_name in self.rooms:
                return [c.username for c in self.rooms[room_name]]
            return []

    def broadcast(self, room_name, sender_username, message):
        with self.lock:
            if room_name not in self.rooms:
                return
            members = self.rooms[room_name]
        
        msg_payload = {"type": "MESSAGE", "room": room_name, "sender": sender_username, "content": message}
        encoded = Protocol.encode(msg_payload)
        for client in members:
            try:
                client.connection.sendall(encoded)
            except Exception as e:
                log.error(f"Failed to send to {client.username}: {e}")

    def _broadcast_internal(self, room_name, message, exclude=None):
        msg_payload = {"type": "NOTIFICATION", "room": room_name, "content": message}
        encoded = Protocol.encode(msg_payload)
        members = self.rooms.get(room_name, set())
        for client in members:
            if client != exclude:
                try:
                    client.connection.sendall(encoded)
                except Exception:
                    pass
