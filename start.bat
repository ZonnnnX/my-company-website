@echo off
title Company Website - Backend Server
cd /d "%~dp0"

echo ============================================
echo   Starting Company Website Backend Server
echo ============================================
echo.

:: Check if node_modules exists
if not exist "backend\node_modules" (
    echo [INFO] Installing dependencies...
    cd backend
    call npm install
    cd ..
    echo.
)

:: Navigate to backend and run seed if needed
cd backend
echo [INFO] Seeding database (admin account)...
call npx prisma generate 2>nul
node prisma/seed.js
echo.

:: Start the server
echo [INFO] Starting server on port 5000...
echo [INFO] Open http://localhost:5000 in your browser
echo [INFO] Press Ctrl+C to stop
echo.
node index.js

pause

