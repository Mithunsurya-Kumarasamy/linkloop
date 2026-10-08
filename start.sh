#!/usr/bin/env bash
# Start script for Render Web Service (Free Tier)

echo "Starting LinkLoop TCP Core..."
cd tcp-core
python3 -m pip install -r requirements.txt
python3 server.py 2>&1 &
TCP_PID=$!

echo "Starting LinkLoop Gateway..."
cd ../gateway
npm install
npm run build
npm start

# Exit if the gateway exits
kill $TCP_PID
