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
            old_room = client.current_room
            if old_room and old_room != room_name and old_room in self.rooms:
                if client in self.rooms[old_room]:
                    self.rooms[old_room].remove(client)
                    self._broadcast_internal(old_room, f"{client.username} left the room.", exclude=client)
            
            if room_name not in self.rooms:
                self.rooms[room_name] = set()
            already_in = client in self.rooms[room_name]
            self.rooms[room_name].add(client)
            client.current_room = room_name

        if not already_in:
            self._broadcast_internal(room_name, f"{client.username} joined the room.", exclude=client)
            log.info(f"{client.username} joined room {room_name}")
        return True

    def leave_room(self, room_name, client):
        with self.lock:
            if room_name in self.rooms and client in self.rooms[room_name]:
                self.rooms[room_name].remove(client)
            if client.current_room == room_name:
                client.current_room = None
        self._broadcast_internal(room_name, f"{client.username} left the room.", exclude=client)
        log.info(f"{client.username} left room {room_name}")
        return True

    def list_rooms(self):
        with self.lock:
            return list(self.rooms.keys())

    def list_users(self, room_name):
        with self.lock:
            if room_name in self.rooms:
                return [c.username for c in self.rooms[room_name]]
            return []

    def broadcast(self, room_name, sender_username, message, timestamp=None, msg_id=None):
        with self.lock:
            if room_name not in self.rooms:
                return
            members = list(self.rooms[room_name])
        
        msg_payload = {"type": "MESSAGE", "room": room_name, "sender": sender_username, "content": message}
        if msg_id is not None:
            msg_payload["id"] = msg_id
        if timestamp:
            msg_payload["timestamp"] = timestamp
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

    def private_message(self, sender_username, recipient_username, message):
        with self.lock:
            recipient_client = self.usernames.get(recipient_username)
        if recipient_client:
            msg_payload = {"type": "PRIVATE_MESSAGE", "sender": sender_username, "content": message}
            encoded = Protocol.encode(msg_payload)
            try:
                recipient_client.connection.sendall(encoded)
            except Exception as e:
                log.error(f"Failed to send PM to {recipient_username}: {e}")

