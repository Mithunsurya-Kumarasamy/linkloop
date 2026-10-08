# Security and Robustness

## Measures Implemented
- **Password Hashing**: Bcrypt is used to hash all user passwords before storing in the database.
- **Payload Limits**: Hard limits on incoming TCP buffer size (8192 bytes) and JSON payload size to prevent OOM DOS attacks.
- **Rate Limiting**: Clients are limited to 5 messages per second. Exceeding this returns a rate limit error.
- **Malformed Packet Protection**: Invalid JSON is gracefully caught and an `ERROR` is returned without crashing the server thread.
- **SQL Injection**: SQLAlchemy ORM is used, inherently parameterizing queries and preventing SQLi.
- **Room Isolation**: Messages are strictly broadcasted using server-side maintained room mappings, preventing arbitrary room leakage.
- **Secrets Management**: Configuration is loaded strictly from environment variables (e.g. `DATABASE_URL`, `JWT_SECRET`).
