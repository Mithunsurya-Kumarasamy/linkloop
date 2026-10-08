#!/usr/bin/env bash
# Start script for Render Web Service (Free Tier)

echo "Starting LinkLoop TCP Core..."
cd tcp-core
pip install -r requirements.txt
python server.py &
TCP_PID=$!

echo "Starting LinkLoop Gateway..."
cd ../gateway
npm install
npm run build
npm start

# Exit if the gateway exits
kill $TCP_PID
