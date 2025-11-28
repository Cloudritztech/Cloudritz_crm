@echo off
echo Stopping frontend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a 2>nul
timeout /t 2 /nobreak >nul

echo Starting frontend...
cd frontend
start "Frontend Server" cmd /k "npm run dev"
echo Frontend restarted!