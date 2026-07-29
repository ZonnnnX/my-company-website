@echo off
title Company Website - One-Click Setup
cd /d "%~dp0"

echo ============================================
echo   Company Website - One-Click Setup
echo ============================================
echo.

:: Step 1: Install backend dependencies
echo [1/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)
cd ..
echo [OK] Dependencies installed.
echo.

:: Step 2: Generate Prisma client
echo [2/4] Generating Prisma client...
cd backend
call npx prisma generate
cd ..
echo [OK] Prisma client generated.
echo.

:: Step 3: Seed database
echo [3/4] Seeding database (creating admin account)...
cd backend
node prisma/seed.js
cd ..
echo [OK] Database seeded.
echo.

:: Step 4: Start server
echo [4/4] Starting server...
echo.
echo ============================================
echo   ✅ Setup Complete!
echo.
echo   Access the website: http://localhost:5000
echo   Or use your network IP to share with others
echo.
echo   Admin Account: Thangtan480@gmail.com
echo   Admin Password: Sliverseven0
echo ============================================
echo.
echo   Press any key to start the server...
pause >nul

cd backend
node index.js

pause

