@echo off
title Cloudflare Tunnel - Company Website
cd /d "%~dp0"

echo ============================================
echo   Cloudflare Tunnel - Company Website
echo ============================================
echo.
echo   This will create a public URL for your
echo   local website using Cloudflare Tunnel.
echo.
echo   Link: https://CompanyWebsiteSerect.vn (via Cloudflare)
echo.

:: Check if backend is running
netstat -ano 2>nul | findstr :5000 >nul
if %errorlevel% neq 0 (
    echo [WARNING] Backend server may not be running on port 5000.
    echo [INFO] Please start the backend first using start.bat or:
    echo        cd backend ^&^& node index.js
    echo.
    set /p continue=Continue anyway? (Y/N): 
    if /i "!continue!" neq "Y" exit /b
)

echo [INFO] Starting Cloudflare Tunnel...
echo [INFO] Your public URL will be displayed below.
echo [INFO] Press Ctrl+C to stop the tunnel.
echo.

:: Run cloudflared tunnel
cloudflared tunnel --url http://localhost:5000

pause

