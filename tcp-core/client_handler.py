import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from logger import log
from protocol import Protocol
from database.crud import get_db, create_user, get_user_by_username, verify_password, create_room, add_message, get_messages, get_room_by_code, add_user_to_room, get_user_rooms
import time
import string
import random
from datetime import datetime

class ClientHandler:
    def __init__(self, connection, address, room_manager):
        self.connection = connection
        self.address = address
        self.room_manager = room_manager
        self.username = None
        self.current_room = None
        self.last_msg_time = time.time()
        self.msg_count = 0

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
        now = time.time()
        if now - self.last_msg_time > 1:
            self.msg_count = 0
            self.last_msg_time = now
        self.msg_count += 1
        if self.msg_count > 10:
            self.send({"type": "ERROR", "message": "Rate limit exceeded"})
            return

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
                    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                    create_room(db, room, self.username, code)
                    add_user_to_room(db, self.username, room)
                    if self.room_manager.create_room(room):
                        self.room_manager.join_room(room, self)
                        self.send({"type": "CREATE_OK", "room": room, "code": code})
                    else:
                        self.send({"type": "ERROR", "message": "Room exists in memory"})
                        
                elif msg_type == "JOIN_ROOM":
                    room = msg.get("room")
                    user_rooms = get_user_rooms(db, self.username)
                    if room in user_rooms:
                        self.room_manager.join_room(room, self)
                        self.send({"type": "JOIN_OK", "room": room})
                    else:
                        self.send({"type": "ERROR", "message": "Access denied. Use a join code."})
                    
                    history = get_messages(db, room, limit=20)
                    for h_msg, h_username in reversed(history):
                        ts = h_msg.timestamp.isoformat() + "Z" if h_msg.timestamp else None
                        self.send({"type": "MESSAGE", "room": room, "sender": h_username, "content": h_msg.content, "timestamp": ts, "history": True})

                elif msg_type == "JOIN_BY_CODE":
                    code = msg.get("code")
                    db_room = get_room_by_code(db, code)
                    if db_room:
                        room = db_room.name
                        add_user_to_room(db, self.username, room)
                        self.room_manager.join_room(room, self)
                        self.send({"type": "JOIN_OK", "room": room, "code": code})
                        
                        history = get_messages(db, room, limit=20)
                        for h_msg, h_username in reversed(history):
                            ts = h_msg.timestamp.isoformat() + "Z" if h_msg.timestamp else None
                            self.send({"type": "MESSAGE", "room": room, "sender": h_username, "content": h_msg.content, "timestamp": ts, "history": True})
                    else:
                        self.send({"type": "ERROR", "message": "Invalid room code"})
                        
                elif msg_type == "LEAVE_ROOM":
                    room = msg.get("room")
                    self.room_manager.leave_room(room, self)
                    self.send({"type": "LEAVE_OK", "room": room})
                    
                elif msg_type == "LIST_ROOMS":
                    rooms = get_user_rooms(db, self.username)
                    self.send({"type": "ROOM_LIST", "rooms": rooms})
                    
                elif msg_type == "LIST_USERS":
                    room = msg.get("room")
                    users = self.room_manager.list_users(room)
                    self.send({"type": "USER_LIST", "room": room, "users": users})
                    
                elif msg_type == "MESSAGE":
                    room = msg.get("room") or self.current_room
                    if room:
                        content = msg.get("content")
                        db_msg = add_message(db, room, self.username, content)
                        ts = db_msg.timestamp.isoformat() + "Z" if db_msg and db_msg.timestamp else datetime.utcnow().isoformat() + "Z"
                        self.room_manager.broadcast(room, self.username, content, ts)
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
