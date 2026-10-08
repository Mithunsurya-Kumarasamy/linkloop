# LinkLoop Protocol

The LinkLoop TCP Protocol uses JSON encoded payloads. Each payload is terminated with a newline character (`\n`).

## Message Structure
All messages are JSON objects containing at least a `type` field.

### Client to Server Messages
- `AUTH`: {"type": "AUTH", "username": "string", "password": "password_string"}
- `CREATE_ROOM`: {"type": "CREATE_ROOM", "room": "string"}
- `JOIN_ROOM`: {"type": "JOIN_ROOM", "room": "string"}
- `LEAVE_ROOM`: {"type": "LEAVE_ROOM", "room": "string"}
- `LIST_ROOMS`: {"type": "LIST_ROOMS"}
- `LIST_USERS`: {"type": "LIST_USERS", "room": "string"}
- `MESSAGE`: {"type": "MESSAGE", "room": "string", "content": "string"}
- `PRIVATE_MESSAGE`: {"type": "PRIVATE_MESSAGE", "recipient": "string", "content": "string"}
- `PING`: {"type": "PING"}
- `DISCONNECT`: {"type": "DISCONNECT"}

### Server to Client Messages
- `AUTH_OK`: {"type": "AUTH_OK"}
- `ERROR`: {"type": "ERROR", "message": "string"}
- `CREATE_OK`: {"type": "CREATE_OK", "room": "string"}
- `JOIN_OK`: {"type": "JOIN_OK", "room": "string"}
- `LEAVE_OK`: {"type": "LEAVE_OK", "room": "string"}
- `ROOM_LIST`: {"type": "ROOM_LIST", "rooms": ["string"]}
- `USER_LIST`: {"type": "USER_LIST", "room": "string", "users": ["string"]}
- `MESSAGE`: {"type": "MESSAGE", "room": "string", "sender": "string", "content": "string"}
- `PRIVATE_MESSAGE`: {"type": "PRIVATE_MESSAGE", "sender": "string", "content": "string"}
- `NOTIFICATION`: {"type": "NOTIFICATION", "room": "string", "content": "string"}
- `SYSTEM`: {"type": "SYSTEM", "content": "string"}
- `PONG`: {"type": "PONG"}
