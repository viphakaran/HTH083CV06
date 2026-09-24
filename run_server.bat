@echo off
title LowKeySigns - WebSocket Bridge Server
cd /d "%~dp0\backend\inference"
echo ========================================================
echo  Starting LowKeySigns WebSocket ML Bridge on port 8000
echo ========================================================
python websocket_server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying with active virtualenv if python is not on path...
    ..\..\..\lowkeysigns-data\lowkeysigns\venv\Scripts\python.exe websocket_server.py
)
pause
