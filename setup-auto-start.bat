@echo off
title Setup Auto-Start for Company Website
cd /d "%~dp0"

echo ============================================
echo   Setting up Auto-Start for Company Website
echo ============================================
echo.

:: Check for existing backend process on port 5000
netstat -ano 2>nul | findstr :5000 >nul
if %errorlevel% neq 0 (
    echo [INFO] Backend not running. Starting it now with PM2...
    pm2 start ecosystem.config.js
    pm2 save
) else (
    echo [INFO] Backend already running on port 5000.
)

:: Copy VBS auto-start script to Windows Startup folder
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SOURCE_VBS=%~dp0auto-start-pm2.vbs
set DEST_VBS=%STARTUP_DIR%\CompanyWebsiteAutoStart.vbs

echo [INFO] Installing auto-start script to Startup folder...
copy /Y "%SOURCE_VBS%" "%DEST_VBS%" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Failed to copy auto-start script.
    pause
    exit /b 1
)
echo [OK] Auto-start script installed to:
echo      %DEST_VBS%
echo.

:: Verify PM2 is running the app
pm2 status company-website

echo.
echo ============================================
echo   ✅ Auto-Start Setup Complete!
echo.
echo   The backend will now automatically start
echo   whenever Windows boots.
echo.
echo   Access locally:  http://localhost:5000
echo   Access on LAN:   http://192.168.1.44:5000
echo.
echo   Admin: Thangtan480@gmail.com / Sliverseven0
echo ============================================
echo.
pause

