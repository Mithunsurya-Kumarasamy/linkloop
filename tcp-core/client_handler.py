import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from logger import log
from protocol import Protocol
from database.crud import get_db, create_user, get_user_by_username, verify_password, create_room, add_message, get_messages

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
                if len(buffer) > 8192:
                    self.send({"type": "ERROR", "message": "Buffer overflow"})
                    break
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
            
            db_gen = get_db()
            db = next(db_gen)
            
            try:
                if msg_type == "REGISTER":
                    username = msg.get("username")
                    password = msg.get("password", "default")
                    
                    if get_user_by_username(db, username):
                        self.send({"type": "ERROR", "message": "Username taken"})
                    else:
                        create_user(db, username, password)
                        if self.room_manager.register_user(username, self):
                            self.send({"type": "REGISTER_OK"})
                
                elif msg_type == "AUTH":
                    username = msg.get("username")
                    password = msg.get("password", "default")
                    
                    user = get_user_by_username(db, username)
                    if user and verify_password(password, user.password_hash):
                        if self.room_manager.register_user(username, self):
                            self.send({"type": "AUTH_OK"})
                        else:
                            self.send({"type": "ERROR", "message": "Already logged in"})
                    else:
                        self.send({"type": "ERROR", "message": "Invalid credentials"})
                        
                elif not self.username:
                    self.send({"type": "ERROR", "message": "Not authenticated"})
                    return
                
                elif msg_type == "CREATE_ROOM":
                    room = msg.get("room")
                    create_room(db, room, self.username)
                    if self.room_manager.create_room(room):
                        self.send({"type": "CREATE_OK", "room": room})
                    else:
                        self.send({"type": "ERROR", "message": "Room exists in memory"})
                        
                elif msg_type == "JOIN_ROOM":
                    room = msg.get("room")
                    self.room_manager.join_room(room, self)
                    self.send({"type": "JOIN_OK", "room": room})
                    
                    history = get_messages(db, room, limit=20)
                    for h_msg, h_username in reversed(history):
                        self.send({"type": "MESSAGE", "room": room, "sender": h_username, "content": h_msg.content, "history": True})
                        
                elif msg_type == "LEAVE_ROOM":
                    room = msg.get("room")
                    self.room_manager.leave_room(room, self)
                    self.send({"type": "LEAVE_OK", "room": room})
                    
                elif msg_type == "LIST_ROOMS":
                    rooms = self.room_manager.list_rooms()
                    self.send({"type": "ROOM_LIST", "rooms": rooms})
                    
                elif msg_type == "LIST_USERS":
                    room = msg.get("room")
                    users = self.room_manager.list_users(room)
                    self.send({"type": "USER_LIST", "room": room, "users": users})
                    
                elif msg_type == "MESSAGE":
                    room = msg.get("room") or self.current_room
                    if room:
                        content = msg.get("content")
                        add_message(db, room, self.username, content)
                        self.room_manager.broadcast(room, self.username, content)
                    else:
                        self.send({"type": "ERROR", "message": "Not in a room"})
                        
                elif msg_type == "PRIVATE_MESSAGE":
                    recipient = msg.get("recipient")
                    content = msg.get("content")
                    self.room_manager.private_message(self.username, recipient, content)
                    
                elif msg_type == "PING":
                    self.send({"type": "PONG"})
                    
                elif msg_type == "DISCONNECT":
                    self.connection.close()
                    
                else:
                    self.send({"type": "ERROR", "message": "Unknown command"})
            finally:
                db.close()
                
        except ValueError as ve:
            self.send({"type": "ERROR", "message": str(ve)})
        except Exception as e:
            log.error(f"Message parsing error: {e}")
            self.send({"type": "ERROR", "message": "Invalid protocol"})

    def send(self, msg_dict):
        try:
            encoded = Protocol.encode(msg_dict)
            if encoded:
                self.connection.sendall(encoded)
        except Exception as e:
            log.error(f"Send error: {e}")
