@echo off
echo Starting EternaNote - Messages Across Time...
echo.

echo Starting backend server...
start "EternaNote Backend" cmd /k "npm start"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting frontend...
cd frontend
start "EternaNote Frontend" cmd /k "npm start"

echo.
echo EternaNote is starting up!
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul