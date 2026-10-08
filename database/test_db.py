import os
import sys

# Add root directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import init_db
from database.crud import get_db, create_user, verify_password, create_room, add_message, get_messages

def test_db():
    print("Initializing Database...")
    init_db()
    
    db = next(get_db())
    print("Database initialized.")
    
    print("Creating user 'TestUser'...")
    user = create_user(db, "TestUser", "password123")
    if user:
        print(f"User created: {user.username}")
    else:
        user = get_user_by_username(db, "TestUser")
        print("User already exists.")
        
    print("Verifying password...")
    if verify_password("password123", user.password_hash):
        print("Password verified successfully!")
        
    print("Creating room 'TestRoom'...")
    room = create_room(db, "TestRoom", "TestUser")
    if room:
        print(f"Room created: {room.name}")
        
    print("Adding message...")
    msg = add_message(db, "TestRoom", "TestUser", "Hello Database!")
    if msg:
        print("Message added.")
        
    print("Retrieving messages...")
    msgs = get_messages(db, "TestRoom")
    for m, uname in msgs:
        print(f"- [{uname}] {m.content}")

if __name__ == "__main__":
    test_db()
