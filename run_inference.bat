@echo off
setlocal enabledelayedexpansion
title LowKeySigns - Real-Time ASL Inference
cd /d "%~dp0\backend"

echo ========================================================
echo  Starting LowKeySigns Real-Time ASL Interpreter
echo  Dual Mode: Showcase (8 words) and Research (20 words)
echo ========================================================

:: Check for Python interpreter
set "PY_BIN="

if exist "venv\Scripts\python.exe" (
    set "PY_BIN=venv\Scripts\python.exe"
) else if exist "..\..\lowkeysigns-data\lowkeysigns\venv\Scripts\python.exe" (
    set "PY_BIN=..\..\lowkeysigns-data\lowkeysigns\venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        set "PY_BIN=python"
    ) else (
        where py >nul 2>nul
        if !ERRORLEVEL! EQU 0 (
            set "PY_BIN=py -3"
        )
    )
)

if "!PY_BIN!"=="" (
    echo [ERROR] Python not found. Please install Python 3.10+ or set up a virtualenv.
    pause
    exit /b 1
)

echo Using Python: !PY_BIN!
!PY_BIN! inference\realtime_inference.py %*

pause
