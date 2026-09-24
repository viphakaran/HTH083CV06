@echo off
title LowKeySigns - Standalone OpenCV HUD & Speech Demo
cd /d "%~dp0"
echo ============================================================
echo   Starting LowKeySigns Standalone OpenCV Engine (With Audio)
echo ============================================================
echo.
.venv\Scripts\python.exe main_cv.py
pause
