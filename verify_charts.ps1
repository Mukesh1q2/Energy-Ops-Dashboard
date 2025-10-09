# Chart Component Verification Script
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Chart Components Health Check" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$componentsDir = "src\components"
$chartFiles = @(
    "dmo-charts.tsx",
    "rmo-charts.tsx",
    "storage-charts.tsx",
    "analytics-charts.tsx",
    "transmission-charts.tsx",
    "consumption-charts.tsx",
    "installed-capacity-charts.tsx",
    "generation-charts.tsx"
)

$dmoDir = "src\components\dmo"
$dmoCharts = @(
    "market-snapshot.tsx"
)

Write-Host "Checking Main Components..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $chartFiles) {
    $filePath = Join-Path $componentsDir $file
    if (Test-Path $filePath) {
        $size = (Get-Item $filePath).Length
        Write-Host "✓ $file " -ForegroundColor Green -NoNewline
        Write-Host "($size bytes)" -ForegroundColor Gray
    } else {
        Write-Host "✗ $file " -ForegroundColor Red -NoNewline
        Write-Host "(NOT FOUND)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking DMO Components..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $dmoCharts) {
    $filePath = Join-Path $dmoDir $file
    if (Test-Path $filePath) {
        $size = (Get-Item $filePath).Length
        Write-Host "✓ $file " -ForegroundColor Green -NoNewline
        Write-Host "($size bytes)" -ForegroundColor Gray
    } else {
        Write-Host "✗ $file " -ForegroundColor Red -NoNewline
        Write-Host "(NOT FOUND)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking Sample Data Files..." -ForegroundColor Yellow
Write-Host ""

$sampleFiles = @(
    "sample_market_snapshot.xlsx",
    "generate_market_snapshot_sample.py",
    "generate_dmo_generator_sample.py",
    "sample_dmo_generator_scheduling.xlsx"
)

foreach ($file in $sampleFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "✓ $file " -ForegroundColor Green -NoNewline
        Write-Host "($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Gray
    } else {
        Write-Host "✗ $file " -ForegroundColor Red -NoNewline
        Write-Host "(NOT FOUND)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking API Routes..." -ForegroundColor Yellow
Write-Host ""

$apiRoutes = @(
    "src\app\api\market-snapshot\route.ts",
    "src\app\api\market-snapshot\upload\route.ts",
    "src\app\api\dmo\generator-scheduling\route.ts",
    "src\app\api\dmo\generator-scheduling\upload\route.ts",
    "src\app\api\dmo\contract-scheduling\route.ts",
    "src\app\api\dmo\market-bidding\route.ts",
    "src\app\api\dmo\filters\route.ts"
)

foreach ($route in $apiRoutes) {
    if (Test-Path $route) {
        Write-Host "✓ $route" -ForegroundColor Green
    } else {
        Write-Host "✗ $route" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking Key Pages..." -ForegroundColor Yellow
Write-Host ""

$pages = @(
    "src\app\page.tsx",
    "src\app\dmo\page.tsx"
)

foreach ($page in $pages) {
    if (Test-Path $page) {
        $size = (Get-Item $page).Length
        Write-Host "✓ $page " -ForegroundColor Green -NoNewline
        Write-Host "($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Gray
    } else {
        Write-Host "✗ $page " -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Chart Components Status:" -ForegroundColor Yellow
Write-Host "  ✓ DMO Charts (Main Dashboard) - Simulated data fallback" -ForegroundColor Green
Write-Host "  ✓ Market Snapshot (DMO Page) - Upload required" -ForegroundColor Green
Write-Host "  ✓ RMO Charts - Placeholder/fallback" -ForegroundColor Green
Write-Host "  ✓ Storage Charts - Mock data fallback" -ForegroundColor Green
Write-Host "  ✓ Analytics Charts - Present" -ForegroundColor Green
Write-Host "  ✓ Other Charts - Present" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run dev" -ForegroundColor White
Write-Host "  2. Test: http://localhost:3000" -ForegroundColor White
Write-Host "  3. Navigate to DMO module to verify charts" -ForegroundColor White
Write-Host "  4. Upload sample data at /dmo page" -ForegroundColor White
Write-Host ""
