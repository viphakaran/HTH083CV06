@echo off
title LowKeySigns - FastAPI & WebSocket Bridge Server
cd /d "%~dp0"
echo ============================================================
echo   Starting LowKeySigns Bridge Server (Port 8001)
echo   Connects live to lowkeysigns-frontend React Dashboard!
echo ============================================================
echo.
.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8001
pause
