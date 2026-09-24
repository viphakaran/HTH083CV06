@echo off
title LowKeySigns - Real-Time ASL Inference
cd /d "%~dp0\backend"
echo ========================================================
echo  Starting LowKeySigns Real-Time ASL Interpreter
echo  Dual Mode: Showcase (8 words) and Research (20 words)
echo ========================================================
python inference\realtime_inference.py %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying with active virtualenv if python is not on path...
    ..\..\lowkeysigns-data\lowkeysigns\venv\Scripts\python.exe inference\realtime_inference.py %*
)
pause
