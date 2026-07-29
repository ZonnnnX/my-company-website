@echo off
title Install Company Website as Windows Service
cd /d "%~dp0"

echo ============================================
echo   Installing Company Website Auto-Start Service
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found.
echo.

:: Check if PM2 is installed globally
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing PM2 globally (needed for auto-start)...
    npm install -g pm2
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install PM2.
        pause
        exit /b 1
    )
    echo [OK] PM2 installed.
) else (
    echo [OK] PM2 already installed.
)
echo.

:: Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Dependencies installed.
echo.

:: Generate Prisma client
echo [INFO] Generating Prisma client...
cd backend
call npx prisma generate
cd ..
echo [OK] Prisma client generated.
echo.

:: Seed database
echo [INFO] Seeding database...
cd backend
node prisma/seed.js
cd ..
echo [OK] Database seeded.
echo.

:: Start with PM2
echo [INFO] Starting server with PM2...
pm2 start ecosystem.config.js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start with PM2.
    pause
    exit /b 1
)
echo [OK] Server started with PM2.
echo.

:: Save PM2 process list
echo [INFO] Saving PM2 process list...
pm2 save
echo [OK] Process list saved.
echo.

:: Configure PM2 to auto-start on boot
echo [INFO] Configuring PM2 to auto-start on Windows boot...
pm2 startup
echo.
echo [NOTE] If PM2 asked you to run a command above, please:
echo        1. Copy the command shown by PM2
echo        2. Open a NEW Command Prompt as Administrator
echo        3. Paste and run that command
echo.
echo [HINT] The command usually looks like:
echo        %~d0
echo        cd "%~dp0"
echo        pm2-startup.js install
echo.

echo ============================================
echo   ✅ Setup Complete!
echo.
echo   The server is NOW RUNNING:
echo   - http://localhost:5000
echo   - http://%COMPUTERNAME%:5000
echo.
echo   Access from other devices:
echo   Find your IP with: ipconfig
echo   Then use: http://YOUR_IP:5000
echo.
echo   Admin Login:
echo   Email: Thangtan480@gmail.com
echo   Password: Sliverseven0
echo.
echo   The server will auto-start when Windows boots!
echo   No need to manually run anything!
echo ============================================
echo.
echo   Press any key to open the website in your browser...
pause >nul

start http://localhost:5000

