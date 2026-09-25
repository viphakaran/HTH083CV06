Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  LowKeySigns - Comprehensive Test Suite" -ForegroundColor Cyan
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

Write-Host "Running Smoke Test..." -ForegroundColor Yellow
& $pythonExe "$scriptDir\scripts\test\smoke_test.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Smoke test failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning REST API Integration Test..." -ForegroundColor Yellow
& $pythonExe "$scriptDir\scripts\test\test_api.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] API integration test failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning Inference, Stabilizer, and Phrase Unit Tests..." -ForegroundColor Yellow
& $pythonExe -c "import tests.test_inference as t1, tests.test_stabilizer as t2, tests.test_phrase_builder as t3; t1.test_model_initialization(); t1.test_forward_pass_shape(); t1.test_label_map_contents(); t2.test_confidence_threshold_gating(); t2.test_consecutive_agreement_requirement(); t2.test_cooldown_debounce(); t3.test_phrase_matching(); t3.test_phrase_single_token(); t3.test_phrase_fallback(); print('ALL UNIT TESTS PASSED SUCCESSFULLY!')"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
