@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   LowKeySigns - Comprehensive Test Suite
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

echo Running Smoke Test...
"!PYTHON_EXE!" scripts\test\smoke_test.py
if errorlevel 1 (
    echo [FAIL] Smoke test failed!
    if not "%1"=="--no-pause" pause
    exit /b 1
)

echo.
echo Running REST API Integration Test...
"!PYTHON_EXE!" scripts\test\test_api.py
if errorlevel 1 (
    echo [FAIL] API integration test failed!
    if not "%1"=="--no-pause" pause
    exit /b 1
)

echo.
echo Running Inference, Stabilizer, and Phrase Unit Tests...
"!PYTHON_EXE!" -c "import tests.test_inference as t1, tests.test_stabilizer as t2, tests.test_phrase_builder as t3; t1.test_model_initialization(); t1.test_forward_pass_shape(); t1.test_label_map_contents(); t2.test_confidence_threshold_gating(); t2.test_consecutive_agreement_requirement(); t2.test_cooldown_debounce(); t3.test_phrase_matching(); t3.test_phrase_single_token(); t3.test_phrase_fallback(); print('ALL UNIT TESTS PASSED SUCCESSFULLY!')"

echo.
echo ========================================================
echo   ALL TESTS PASSED!
echo ========================================================
if not "%1"=="--no-pause" pause
