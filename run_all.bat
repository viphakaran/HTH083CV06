@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   LowKeySigns - Accessibility Communication Bridge
echo   Launch All Services (Backend + Frontend)
echo ========================================================

cd /d "%~dp0"

echo [1/3] Verifying environment and ML model weights...
set "PYTHON_EXE=C:\A_Hackathon_HackTheHorizon\LowKeySigns\service_engine\.venv\Scripts\python.exe"
if not exist "!PYTHON_EXE!" (
    if exist "backend\.venv\Scripts\python.exe" (
        set "PYTHON_EXE=backend\.venv\Scripts\python.exe"
    ) else if exist "backend\venv\Scripts\python.exe" (
        set "PYTHON_EXE=backend\venv\Scripts\python.exe"
    ) else if exist ".venv\Scripts\python.exe" (
        set "PYTHON_EXE=.venv\Scripts\python.exe"
    ) else (
        set "PYTHON_EXE=python"
    )
)

"!PYTHON_EXE!" scripts\setup\verify_env.py
if errorlevel 1 (
    echo [ERROR] Environment verification failed. Please check missing files above.
    pause
    exit /b 1
)

echo.
echo [2/3] Starting Backend API in separate window...
start "LowKeySigns Backend API" cmd /k "run_server.bat"

echo.
echo [3/3] Starting Frontend UI in separate window...
timeout /t 3 /nobreak >nul
start "LowKeySigns Frontend UI" cmd /k "run_frontend.bat"

echo.
echo ========================================================
echo   LowKeySigns System Successfully Dispatched!
echo   * Backend:  http://127.0.0.1:8000
echo   * Frontend: http://localhost:5173
echo   * Swagger:  http://127.0.0.1:8000/docs
echo ========================================================
echo.
