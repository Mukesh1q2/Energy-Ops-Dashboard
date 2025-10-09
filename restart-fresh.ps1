# Restart Fresh - Clear Next.js cache and restart server

Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Yellow

# Stop any running processes on port 3000
Write-Host "Stopping server on port 3000..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.MainModule.FileName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Next.js cache
Write-Host "Removing .next folder..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "✅ .next folder removed" -ForegroundColor Green
}

# Clear uploads folder (optional - comment out if you want to keep uploaded files)
# Write-Host "Clearing uploads folder..." -ForegroundColor Cyan
# if (Test-Path "uploads") {
#     Get-ChildItem -Path "uploads" -File | Remove-Item -Force
#     Write-Host "✅ uploads folder cleared" -ForegroundColor Green
# }

Write-Host ""
Write-Host "✨ Cache cleared! Now starting server..." -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting server with nodemon..." -ForegroundColor Cyan
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Magenta
Write-Host ""
Write-Host "After server starts:" -ForegroundColor Yellow
Write-Host "1. Hard refresh browser: Ctrl+Shift+R (or Ctrl+F5)" -ForegroundColor Yellow
Write-Host "2. Open Dev Tools and check 'Disable cache'" -ForegroundColor Yellow
Write-Host "3. Try uploading a file again" -ForegroundColor Yellow
Write-Host ""

# Start server
npx nodemon --exec "npx tsx server.ts" --watch server.ts --watch "src/**/*"
