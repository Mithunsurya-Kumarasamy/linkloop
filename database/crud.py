from sqlalchemy.orm import Session
import bcrypt
from .models import User, Room, RoomMember, Message, SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_user(db: Session, username: str, password: str):
    hashed_password = hash_password(password)
    db_user = User(username=username, password_hash=hashed_password)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception:
        db.rollback()
        return None

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_room(db: Session, room_name: str, owner_username: str = None, code: str = None):
    owner_id = None
    if owner_username:
        user = get_user_by_username(db, owner_username)
        if user:
            owner_id = user.id
    db_room = Room(name=room_name, owner_id=owner_id, code=code)
    db.add(db_room)
    try:
        db.commit()
        db.refresh(db_room)
        return db_room
    except Exception:
        db.rollback()
        return None

def get_room_by_code(db: Session, code: str):
    return db.query(Room).filter(Room.code == code).first()

def get_room_by_name(db: Session, room_name: str):
    return db.query(Room).filter(Room.name == room_name).first()

def add_message(db: Session, room_name: str, sender_username: str, content: str):
    room = get_room_by_name(db, room_name)
    user = get_user_by_username(db, sender_username)
    if not room or not user:
        return None
    
    db_message = Message(room_id=room.id, sender_id=user.id, content=content)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages(db: Session, room_name: str, limit: int = 50):
    room = get_room_by_name(db, room_name)
    if not room:
        return []
    
    results = db.query(Message, User.username).join(User, Message.sender_id == User.id).filter(
        Message.room_id == room.id
    ).order_by(Message.timestamp.desc()).limit(limit).all()
    return results
