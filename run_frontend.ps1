Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  LowKeySigns - Accessibility Communication Bridge" -ForegroundColor Cyan
Write-Host "  Starting Frontend UI (Vite + React + TypeScript)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptDir\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting Vite development server on port 5173..."
Write-Host "UI will be accessible at: http://localhost:5173`n"

npm run dev -- --host 127.0.0.1 --port 5173
