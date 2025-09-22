@echo off
echo Setting up EternaNote - Messages Across Time...
echo.

echo Installing backend dependencies...
call npm install

echo.
echo Installing frontend dependencies...
cd frontend
call npm install

echo.
echo Setup complete! 
echo.
echo To start EternaNote:
echo 1. Run 'npm run dev' for development mode
echo 2. Or run 'npm start' for production mode
echo.
echo EternaNote will be available at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:5000
echo.
pause