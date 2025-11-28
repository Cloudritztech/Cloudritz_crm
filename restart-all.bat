@echo off
echo Restarting both frontend and backend...

echo Stopping all services...
taskkill /f /im node.exe 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a 2>nul
timeout /t 3 /nobreak >nul

echo Starting backend...
cd backend
start "Backend Server" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo Starting frontend...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo Both services restarted!