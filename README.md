# LinkLoop
## A Multiroom TCP-Based Real-Time Chat System

### Problem Statement
Modern chat systems abstract away network fundamentals. LinkLoop was built to demonstrate raw TCP socket programming underlying real-time communication.

### Objectives
- Demonstrate genuine TCP networking.
- Support persistent real-time multi-room messaging.
- Build a modern responsive UI.

### Features
- Multiroom Chat
- Broadcast & Isolation
- Real-time Notifications
- Message Persistence

### Architecture & Tech Stack
- Frontend: React + Tailwind CSS
- Gateway: Node.js WebSocket
- Backend: Python TCP Sockets
- Database: PostgreSQL (Neon DB)

### Setup & Running
See [Deployment](docs/deployment.md) for full instructions.
1. Populate `.env` with `DATABASE_URL`
2. `cd tcp-core && .\.venv\Scripts\Activate.ps1 && python server.py`
3. `cd gateway && npm start`
4. `cd frontend && npm run dev`

### Networking
See [Networking](docs/networking.md).
