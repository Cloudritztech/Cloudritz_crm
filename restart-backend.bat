@echo off
echo Stopping backend...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend...
cd backend
start "Backend Server" cmd /k "npm run dev"
echo Backend restarted!