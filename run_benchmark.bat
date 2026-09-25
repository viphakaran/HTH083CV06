@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   LowKeySigns - Pipeline Benchmark and Robustness Audit
echo ========================================================

cd /d "%~dp0"

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

set PYTHONPATH=%~dp0;%~dp0backend;%PYTHONPATH%
set TF_ENABLE_ONEDNN_OPTS=0

echo [1/2] Running Real-Time Inference Benchmark...
"!PYTHON_EXE!" scripts\benchmark\benchmark_pipeline.py

echo.
echo [2/2] Running Multi-Condition Environmental Robustness Audit...
"!PYTHON_EXE!" scripts\test\test_robustness.py

echo.
echo Benchmark reports generated in docs\
if not "%1"=="--no-pause" pause
