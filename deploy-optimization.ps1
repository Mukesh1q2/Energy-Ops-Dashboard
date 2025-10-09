# Sandbox Optimization System - Deployment Script
# This script sets up the complete optimization infrastructure

Write-Host "🚀 Deploying Sandbox Optimization System..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Update Database Schema
Write-Host "📊 Step 1: Updating database schema..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database schema update failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database schema updated successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Create required directories
Write-Host "📁 Step 2: Creating directories..." -ForegroundColor Yellow
$directories = @(
    "server\models\optimization",
    "logs\optimization",
    "src\components\optimization",
    "src\hooks"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $PWD $dir
    if (!(Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  Exists: $dir" -ForegroundColor Gray
    }
}
Write-Host "✅ Directories ready" -ForegroundColor Green
Write-Host ""

# Step 3: Check Python installation
Write-Host "🐍 Step 3: Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  $pythonVersion" -ForegroundColor Gray
    Write-Host "✅ Python is installed and accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python and add it to PATH" -ForegroundColor Red
    Write-Host "  Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 4: Verify sample model
Write-Host "📝 Step 4: Verifying sample model..." -ForegroundColor Yellow
$sampleModel = "sample_dmo_model.py"
if (Test-Path $sampleModel) {
    Write-Host "  Found: $sampleModel" -ForegroundColor Gray
    
    # Validate Python syntax
    python -m py_compile $sampleModel 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Sample model syntax is valid" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: Sample model has syntax errors" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Sample model not found (optional)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Installation summary
Write-Host "📋 Step 5: Implementation Status" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Backend Components (Complete):" -ForegroundColor Green
Write-Host "  - Database schema updated with OptimizationModel table"
Write-Host "  - Python execution service (src/lib/optimization-executor.ts)"
Write-Host "  - Socket.IO integration extended"
Write-Host "  - API endpoints: upload, execute, models"
Write-Host ""

Write-Host "📝 Frontend Components (To Implement):" -ForegroundColor Yellow
Write-Host "  See SANDBOX_OPTIMIZATION_GUIDE.md for React component code:"
Write-Host "  1. src/components/optimization/model-upload-card.tsx"
Write-Host "  2. src/components/optimization/control-panel.tsx"
Write-Host "  3. src/components/optimization/log-notification-panel.tsx"
Write-Host "  4. src/hooks/use-socket.ts"
Write-Host "  5. Update src/app/sandbox/page.tsx to import these components"
Write-Host ""

# Step 6: Next steps
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy frontend component code from SANDBOX_OPTIMIZATION_GUIDE.md"
Write-Host "2. Create the 4 React components listed above"
Write-Host "3. Run: npm run dev"
Write-Host "4. Navigate to http://localhost:3000/sandbox"
Write-Host "5. Upload sample_dmo_model.py"
Write-Host "6. Run the model and watch live logs!"
Write-Host ""

Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "  - Full guide: SANDBOX_OPTIMIZATION_GUIDE.md"
Write-Host "  - API reference included in guide"
Write-Host "  - Socket.IO events documented"
Write-Host ""

Write-Host "✨ Deployment preparation complete!" -ForegroundColor Green
Write-Host "🚀 Ready to implement frontend components!" -ForegroundColor Cyan
