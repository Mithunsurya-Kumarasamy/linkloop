# LinkLoop
> **A Multiroom TCP-Based Real-Time Chat System**

LinkLoop is an advanced, production-ready Computer Networks academic project. It demonstrates the fundamental principles of custom socket programming, real-time bidirectional communication, and scalable system architecture without relying on third-party real-time frameworks like Socket.io or Firebase.

Instead, LinkLoop is built from scratch using raw **TCP Sockets** in Python, bridged to the web via a high-performance **Node.js Gateway**, and presented through a crisp, enterprise-grade **React** interface.

---

## 🏗 System Architecture

LinkLoop utilizes a three-tier architecture to bridge the gap between traditional raw TCP sockets and modern web browsers:

1. **TCP Core Backend (Python)**
   - The heart of the system. It handles all raw `socket` connections, manages threads (one thread per client), and maintains the in-memory state of active rooms and users.
   - It communicates using a custom **newline-delimited JSON protocol** over raw TCP.
   - Handles all persistence by reading/writing to a serverless **PostgreSQL** database (Neon).

2. **WebSocket Gateway (Node.js)**
   - Browsers cannot speak raw TCP. The Node.js gateway acts as a low-latency proxy.
   - It accepts `WebSocket` connections from web clients and immediately translates them into raw TCP streams connected directly to the Python backend.

3. **Frontend Client (React + Vite)**
   - A minimalist, professional "dark mode" SaaS interface.
   - Connects to the Node.js gateway and dynamically renders live messages, timestamps, typing indicators, and room memberships.

---

## ✨ Core Features

- **Raw TCP Socket Programming**: Custom protocol built from scratch using Python's `socket` library.
- **Private Room Visibility**: Rooms are completely invisible unless you are the creator or have explicitly joined using a secret 6-character room code.
- **Serverless PostgreSQL**: Persistent message history, user accounts, and room memberships stored securely in Neon DB.
- **Enterprise UI/UX**: Ultra-clean, pitch-black dark mode interface with automatic clickable link parsing and localized UTC message timestamps.
- **Rate Limiting & Security**: Prevents spamming and buffer overflows natively on the TCP server level.

---

## 🔌 The Custom TCP Protocol

Communication between the Gateway and the TCP Core is done via newline-delimited JSON payloads.

**Example Client -> Server (Send Message):**
```json
{"type": "MESSAGE", "room": "General", "content": "Hello World!"}\n
```

**Example Server -> Client (Broadcast):**
```json
{"type": "MESSAGE", "room": "General", "sender": "Alice", "content": "Hello World!", "timestamp": "2026-10-08T17:15:00Z"}\n
```

---

## 🚀 Local Development Setup

To run LinkLoop locally on your machine, you must start the three components in order:

### 1. Database (PostgreSQL)
Ensure you have a PostgreSQL database running (or use Neon.tech).
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql+psycopg2://user:pass@host/dbname"
```

### 2. Python TCP Core
```bash
cd tcp-core
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python server.py
```
*The server will start listening for TCP connections on `127.0.0.1:9000`.*

### 3. Node.js Gateway
```bash
cd gateway
npm install
npm run build
npm start
```
*The gateway will start listening for WebSockets on `ws://127.0.0.1:8080`.*

### 4. React Frontend
```bash
cd frontend
npm install
npm run dev
```
*The app will be accessible at `http://localhost:5173`.*

---

## 🌍 Deployment

Since this project avoids Docker for strict native execution, see the `DEPLOYMENT.md` file for step-by-step instructions on deploying the Frontend to Vercel and the Backend components natively to a DigitalOcean Droplet or AWS EC2 instance.
