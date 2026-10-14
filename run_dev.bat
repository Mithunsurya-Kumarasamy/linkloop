@echo off
echo ==============================================
echo        Starting LinkLoop Full Stack
echo ==============================================

echo [1/3] Starting Python TCP Core Backend (Port 9000)...
start "LinkLoop - TCP Core (Port 9000)" cmd /k "if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe tcp-core/server.py) else (python tcp-core/server.py)"

echo [2/3] Starting Node.js WebSocket Gateway (Port 8080)...
start "LinkLoop - Gateway (Port 8080)" cmd /k "cd gateway && npm start"

echo [3/3] Starting React Frontend (Port 5173)...
start "LinkLoop - Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo All services started! Opening browser at http://localhost:5173...
timeout /t 3 >nul
start http://localhost:5173
