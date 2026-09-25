Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  LowKeySigns - Pipeline Benchmark & Robustness Audit" -ForegroundColor Cyan
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

$env:PYTHONPATH = "$scriptDir;$scriptDir\backend;$env:PYTHONPATH"
$env:TF_ENABLE_ONEDNN_OPTS = "0"

Write-Host "`n[1/2] Running Real-Time Inference Benchmark..." -ForegroundColor Yellow
& $pythonExe "$scriptDir\scripts\benchmark\benchmark_pipeline.py"

Write-Host "`n[2/2] Running Multi-Condition Environmental Robustness Audit..." -ForegroundColor Yellow
& $pythonExe "$scriptDir\scripts\test\test_robustness.py"

Write-Host "`nBenchmark reports generated in docs\`n" -ForegroundColor Green
