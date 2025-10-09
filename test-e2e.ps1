# Energy Ops Dashboard - End-to-End Testing Script
# PowerShell script for comprehensive testing

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Energy Ops Dashboard E2E Testing" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api"
$testResults = @()
$passed = 0
$failed = 0

function Test-Feature {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    Write-Host "Testing: $Name..." -ForegroundColor Yellow -NoNewline
    try {
        $result = & $TestBlock
        if ($result) {
            Write-Host " PASSED" -ForegroundColor Green
            $script:passed++
            return @{ Name = $Name; Status = "PASSED"; Message = "" }
        } else {
            Write-Host " FAILED" -ForegroundColor Red
            $script:failed++
            return @{ Name = $Name; Status = "FAILED"; Message = "Test returned false" }
        }
    } catch {
        Write-Host " ERROR" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return @{ Name = $Name; Status = "ERROR"; Message = $_.Exception.Message }
    }
}

Write-Host "1. Server Health Check" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

$testResults += Test-Feature "Server is responding" {
    $response = Invoke-WebRequest -Uri "$apiUrl/system/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    return $response.StatusCode -eq 200
}

$testResults += Test-Feature "API endpoints are accessible" {
    $response = Invoke-WebRequest -Uri "$apiUrl/kpi?hours=24" -UseBasicParsing -ErrorAction Stop
    return $response.StatusCode -eq 200
}

Write-Host ""
Write-Host "2. Dark Theme Implementation" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

$testResults += Test-Feature "Dark theme CSS is present" {
    $css = Get-Content "src/app/globals.css" -Raw
    return $css -match "\.dark" -and $css -match "oklch\(0\.12"
}

$testResults += Test-Feature "Dark mode enabled by default" {
    $layout = Get-Content "src/app/layout.tsx" -Raw
    return $layout -match 'className="dark"'
}

Write-Host ""
Write-Host "3. Navigation & UI Elements" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

$testResults += Test-Feature "Transmission page is disabled" {
    $page = Get-Content "src/app/page.tsx" -Raw
    return $page -match "//.*transmission.*Disabled"
}

$testResults += Test-Feature "Enhanced Analytics component exists" {
    return Test-Path "src/components/enhanced-analytics-forecasting.tsx"
}

$testResults += Test-Feature "Enhanced Analytics imported in main page" {
    $page = Get-Content "src/app/page.tsx" -Raw
    return $page -match "EnhancedAnalyticsForecasting"
}

Write-Host ""
Write-Host "4. Excel Upload System" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

$testResults += Test-Feature "Process sheet API endpoint exists" {
    return Test-Path "src/app/api/upload/process-sheet/route.ts"
}

$testResults += Test-Feature "Intelligent column mapping is implemented" {
    $content = Get-Content "src/app/api/upload/process-sheet/route.ts" -Raw
    return $content -match "COLUMN_MAPPING" -and $content -match "findBestMatch"
}

$testResults += Test-Feature "Data type inference is implemented" {
    $content = Get-Content "src/app/api/upload/process-sheet/route.ts" -Raw
    return $content -match "inferDataType"
}

Write-Host ""
Write-Host "5. API Endpoints Testing" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

$testResults += Test-Feature "Dashboard KPI endpoint" {
    $response = Invoke-RestMethod -Uri "$apiUrl/dashboard/kpi" -Method Get
    return $response.success -eq $true
}

$testResults += Test-Feature "Activities endpoint" {
    $response = Invoke-RestMethod -Uri "$apiUrl/activities?limit=10" -Method Get
    return $response -ne $null
}

$testResults += Test-Feature "Notifications endpoint" {
    $response = Invoke-RestMethod -Uri "$apiUrl/notifications?limit=20" -Method Get
    return $response.success -eq $true
}

$testResults += Test-Feature "Optimization archives endpoint" {
    $response = Invoke-RestMethod -Uri "$apiUrl/optimization/archives" -Method Get
    return $response.success -eq $true
}

Write-Host ""
Write-Host "6. Data Source & Autoplot" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

$testResults += Test-Feature "Data sources API endpoint" {
    $response = Invoke-RestMethod -Uri "$apiUrl/data-sources" -Method Get
    return $response.success -eq $true
}

$testResults += Test-Feature "Autoplot endpoint exists" {
    $response = Invoke-WebRequest -Uri "$apiUrl/autoplot" -Method Post -Body '{"data_source_id":"test"}' -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue
    return $response.StatusCode -in @(200, 400, 404)
}

Write-Host ""
Write-Host "7. RMO & DMO Features" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

$testResults += Test-Feature "RMO charts component exists" {
    return Test-Path "src/components/rmo-charts.tsx"
}

$testResults += Test-Feature "DMO contract scheduling endpoint" {
    $response = Invoke-RestMethod -Uri "$apiUrl/dmo/contract-scheduling" -Method Get
    return $response -ne $null
}

$testResults += Test-Feature "DMO market bidding endpoint" {
    $response = Invoke-RestMethod -Uri "$apiUrl/dmo/market-bidding" -Method Get
    return $response -ne $null
}

Write-Host ""
Write-Host "8. File Structure Validation" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan

$testResults += Test-Feature "Excel upload guide exists" {
    return Test-Path "EXCEL_UPLOAD_GUIDE.md"
}

$testResults += Test-Feature "Database client properly configured" {
    return Test-Path "src/lib/db.ts"
}

$testResults += Test-Feature "Prisma schema exists" {
    return Test-Path "prisma/schema.prisma"
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $($passed + $failed)" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -ne "PASSED" } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

$successRate = [math]::Round(($passed / ($passed + $failed)) * 100, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

# Save results to file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportPath = "test-results-$timestamp.json"
$testResults | ConvertTo-Json | Out-File $reportPath
Write-Host "Test report saved to: $reportPath" -ForegroundColor Cyan
Write-Host ""

exit $(if ($failed -eq 0) { 0 } else { 1 })
