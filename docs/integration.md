# LinkLoop System Integration

LinkLoop has been fully integrated across all layers:

1. **Frontend (React)**: Communicates via WebSocket to the Gateway. It handles UI state, authentication token/session logic, and realtime rendering of messages.
2. **Gateway (Node.js)**: Receives WebSocket connections, translates them directly into TCP payloads, and forwards them to the Python TCP Core. Responses from the Core are forwarded back to the React client.
3. **TCP Core (Python)**: The heart of LinkLoop. Manages connected clients, handles the multiroom logic, broadcast queues, and intercepts commands to query or mutate the Database.
4. **Database (PostgreSQL via SQLAlchemy)**: Persists user accounts (with hashed passwords), room metadata, and chat history.

## Flows Verified
- **Registration**: React -> WS -> Gateway -> TCP -> Core -> DB (insert) -> OK
- **Login**: React -> WS -> Gateway -> TCP -> Core -> DB (verify hash) -> OK
- **Room Creation & Join**: Memory state updated, broadcast notifications sent.
- **Messaging**: Message persisted in DB, then broadcasted to all sockets in the same room.
