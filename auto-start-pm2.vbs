' Auto-start PM2 (company website backend) silently on Windows boot
' This VBS script runs hidden (no console window)
' It restores the PM2 process list which includes company-website backend

Set shell = CreateObject("WScript.Shell")

' Wait a bit for network to be ready after boot
WScript.Sleep 8000

' Start PM2 resurrect (restores the saved process list) hidden
shell.Run "cmd /c pm2 resurrect", 0, False

' Also start cloudflared tunnel if configured
' (commented out - user can enable after setting up tunnel)
' shell.Run """D:\Project-Company\my-company-website\cloudflared-tunnel.bat""", 0, False

