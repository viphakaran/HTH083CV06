@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   LowKeySigns - Accessibility Communication Bridge
echo   Starting Frontend UI (Vite + React + TypeScript)
echo ========================================================

cd /d "%~dp0frontend"

if not exist "node_modules\" (
    echo [INFO] Installing frontend dependencies...
    call npm install
)

echo Starting Vite development server on port 5173...
echo UI will be accessible at: http://localhost:5173
echo.

call npm run dev -- --host 127.0.0.1 --port 5173

pause
