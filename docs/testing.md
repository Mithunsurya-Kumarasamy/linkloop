# LinkLoop Testing Report

## TCP Core
- **Connection & Disconnection**: Verified robust handling of standard and abrupt socket closures (WinError 10054 caught).
- **Concurrency**: Tested 5 simultaneous clients; server remained responsive via daemon threads.
- **Large Packets**: Attempted >8192 bytes; connection explicitly rejects and terminates on buffer overflow.

## Multiroom Chat
- **Room Creation & Join**: Users successfully created and joined rooms.
- **Isolation**: Messages sent to "General" are completely isolated from "Gaming". Verified via multiple test scripts.
- **Broadcasting**: All members within a single room receive events almost instantly.

## Database & Persistence
- **User Integrity**: Duplicate registrations rejected gracefully via DB query fallback constraints.
- **Message Persistence**: Messages correctly logged with timestamps and valid `sender_id`.
- **History Retrieval**: Newly joining users receive the last 20 messages of history sorted correctly.

## WebSocket Gateway
- **Connections**: Verified frontend establishes WSS, and gateway properly translates and passes traffic over standard TCP.
- **Reconnection**: Frontend successfully attempts reconnection on a 3000ms delay.
