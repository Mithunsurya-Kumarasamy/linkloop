# Database Schema
- **Users**: id, username, password_hash
- **Rooms**: id, name, owner_id
- **RoomMembers**: user_id, room_id
- **Messages**: id, room_id, sender_id, content, timestamp
