Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  LowKeySigns - Accessibility Communication Bridge" -ForegroundColor Cyan
Write-Host "  Launch All Services (Backend + Frontend)" -ForegroundColor Cyan
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

Write-Host "`n[1/3] Verifying environment & ML model weights..." -ForegroundColor Yellow
& $pythonExe "$scriptDir\scripts\setup\verify_env.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Environment verification failed. Please check missing files above." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n[2/3] Starting Backend API in separate window..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k `"$scriptDir\run_server.bat`""

Write-Host "`n[3/3] Starting Frontend UI in separate window..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process cmd -ArgumentList "/k `"$scriptDir\run_frontend.bat`""

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  LowKeySigns System Successfully Dispatched!" -ForegroundColor Green
Write-Host "  * Backend:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "  * Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  * Swagger:  http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Green
