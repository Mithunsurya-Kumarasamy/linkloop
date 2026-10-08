# LinkLoop Architecture

```mermaid
graph TD
    A[Browser] -->|WSS| B[Gateway Node.js]
    B -->|TCP| C[TCP Core Python]
    C -->|SQLAlchemy| D[(PostgreSQL)]
```
