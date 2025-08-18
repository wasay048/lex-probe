@echo off
echo Starting Cartel Detection Platform...

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d C:\Users\DELL\Projects\lex-probe\cartel-detection-platform\backend && npm run dev"

timeout /t 5 /nobreak

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d C:\Users\DELL\Projects\lex-probe\cartel-detection-platform\frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo.
echo Press any key to close this window
pause
