Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  LowKeySigns - Accessibility Communication Bridge" -ForegroundColor Cyan
Write-Host "  Starting Backend API Service (FastAPI + Uvicorn)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$pythonExe = "C:\A_Hackathon_HackTheHorizon\LowKeySigns\service_engine\.venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    if (Test-Path "$scriptDir\backend\.venv\Scripts\python.exe") {
        $pythonExe = "$scriptDir\backend\.venv\Scripts\python.exe"
    } else {
        $pythonExe = "python"
    }
}

Write-Host "Using Python: $pythonExe"
Write-Host "Server running at: http://127.0.0.1:8000"
Write-Host "WebSocket endpoint: ws://127.0.0.1:8000/ws"
Write-Host "API Documentation: http://127.0.0.1:8000/docs`n"

$env:PYTHONPATH = "$scriptDir\backend;$env:PYTHONPATH"
$env:TF_ENABLE_ONEDNN_OPTS = "0"

& $pythonExe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
