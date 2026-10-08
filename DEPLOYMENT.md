# LinkLoop Deployment Guide

Since we aren't using Docker, deploying the application involves pushing the frontend to a static host and running the backend components natively on a cloud server. 

Here is the easiest, most professional way to deploy LinkLoop to the internet for free or very cheap:

## 1. Deploy the Frontend (Vercel)

Vercel is the best platform for React/Vite apps. It is completely free and automatically builds your site.

1. Go to [Vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New... > Project**.
3. Import your `linkloop` repository from GitHub.
4. **Important**: In the configuration settings, set the **Root Directory** to `frontend`.
5. Vercel will automatically detect Vite. Click **Deploy**.
6. In a few minutes, your frontend will be live on a public URL! 
   *(Note: You'll need to update the `GATEWAY_URL` in `App.tsx` once your backend is deployed).*

## 2. Deploy the Database (Neon)

You're already using [Neon DB](https://neon.tech), which is perfectly set up for production! 
Keep your `DATABASE_URL` handy for the backend deployment.

## 3. Deploy the Backend (Gateway + TCP Core)

For the backend, you have two components (Node.js Gateway + Python TCP Server) that need to run continuously. 

### Option A: Use a Virtual Private Server (VPS) - *Recommended for Networks Projects*
Using an AWS EC2 instance, DigitalOcean Droplet, or Hetzner server is the most realistic way to deploy a custom TCP architecture.

1. Rent a cheap Linux VPS (e.g., $4/mo DigitalOcean droplet).
2. SSH into your server and install Node.js and Python 3.
3. Clone your GitHub repository:
   ```bash
   git clone https://github.com/Mithunsurya-Kumarasamy/linkloop.git
   cd linkloop
   ```
4. **Start the TCP Core**:
   ```bash
   cd tcp-core
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   export DATABASE_URL="postgresql+psycopg2://<your_neon_url>"
   
   # Run in background using pm2
   npm install -g pm2
   pm2 start server.py --interpreter python3 --name tcp-core
   ```
5. **Start the Gateway**:
   ```bash
   cd ../gateway
   npm install
   npm run build
   
   # Run the gateway on port 80 (requires sudo)
   sudo PORT=80 pm2 start dist/server.js --name gateway
   ```
6. **Final Step**: Once your server is running, go back to your Frontend code (`frontend/src/App.tsx`), change the `GATEWAY_URL` to `ws://<YOUR_VPS_IP_ADDRESS>:80`, commit, and Vercel will automatically redeploy!

### Option B: Use Render.com (PaaS) - 100% Free
If you don't want to manage a Linux server, you can host the entire backend on [Render](https://render.com) for completely free by running both the Python and Node servers in a single Web Service!
1. Click **New +** and create a **Web Service** on Render.
2. Connect your GitHub repository.
3. **Configuration**:
   * Root Directory: Leave this blank (root).
   * Environment: `Node` (Render's Node environments also have Python pre-installed!)
   * Build Command: `chmod +x start.sh`
   * Start Command: `./start.sh`
4. **Environment Variables**:
   * Add `DATABASE_URL` and paste your Neon DB URL.
   * Add `TCP_SERVER_HOST` and set it to `127.0.0.1`.
5. Update your Vercel Frontend to point to the secure WebSocket (`wss://`) URL provided by Render for your Web Service.
