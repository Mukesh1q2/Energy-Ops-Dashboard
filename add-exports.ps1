# PowerShell script to add export buttons to all chart components
# This script adds the import statement for export utilities to all chart files

$files = @(
    "src\components\rmo-charts.tsx",
    "src\components\storage-charts.tsx",
    "src\components\analytics-charts.tsx",
    "src\components\consumption-charts.tsx",
    "src\components\transmission-charts.tsx",
    "src\components\generation-charts.tsx"
)

$importStatement = 'import { Download, FileSpreadsheet } from "lucide-react"
import { downloadCSV, downloadExcel, formatNumber, formatDateTime } from "@/lib/export-utils"'

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file"
        $content = Get-Content $fullPath -Raw
        
        # Check if import already exists
        if ($content -notmatch "downloadCSV") {
            Write-Host "  - Adding export utility imports"
        } else {
            Write-Host "  - Export utilities already imported, skipping"
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nNote: This is a dry-run script. Manual edits are recommended for complex components." -ForegroundColor Cyan
