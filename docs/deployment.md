# LinkLoop Deployment Guide

## Prerequisites
- Node.js (for Gateway & Frontend)
- Python 3.9+ (for TCP Core)
- A Neon DB Database URL (PostgreSQL).

## Environment Variables
Create a `.env` file in the root based on `.env.example`:
```
DATABASE_URL=postgresql://user:password@ep-name.region.aws.neon.tech/neondb
```

## Running Locally
1. Start the TCP Core: `cd tcp-core && .\.venv\Scripts\Activate.ps1 && python server.py`
2. Start the Gateway: `cd gateway && npm start`
3. Start the Frontend: `cd frontend && npm run dev`

## Production Deployment
- The backend (`tcp-core`) MUST run on infrastructure capable of persistent socket connections (e.g., VPS, AWS EC2, DigitalOcean Droplet). Serverless environments (like AWS Lambda or Vercel) are NOT suitable.
- Ensure ports `9000` (TCP), `8080` (WSS), and `80`/`443` (HTTP/HTTPS) are exposed in the firewall.
- Set up an SSL reverse proxy (e.g., Nginx) in front of the `gateway` to serve Secure WebSockets (`wss://`).
- The Frontend can be built using `npm run build` and served via Nginx or Vercel/Netlify.
