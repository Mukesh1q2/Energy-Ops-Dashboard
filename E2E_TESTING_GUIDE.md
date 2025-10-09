# End-to-End Testing Guide

## 🎯 Overview
This guide walks through complete end-to-end testing of the DMO Dashboard, from data upload to chart visualization.

## ✅ Pre-Test Checklist

### 1. **Verify Environment**
```bash
# Check Node.js is running
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Check dev server is running on port 3000
Test-NetConnection -ComputerName localhost -Port 3000

# Or simply open browser to:
# http://localhost:3000
```

### 2. **Verify Sample Data Files**
```bash
# Run verification script
.\verify_charts.ps1

# Should show:
# ✓ sample_market_snapshot.xlsx (11.39 KB)
# ✓ sample_dmo_generator_scheduling.xlsx (12.12 KB)
```

### 3. **Check Database Connection**
```bash
# Open Prisma Studio
npx prisma studio

# Should open at: http://localhost:5555
# Verify tables exist:
# - MarketSnapshotData
# - DMOGeneratorScheduling
# - DMOContractScheduling
# - DMOMarketBidding
```

---

## 🧪 Test Suite 1: Market Snapshot Chart

### Test 1.1: Navigate to DMO Page
**Steps:**
1. Open: `http://localhost:3000`
2. Look for "DMO Dashboard" in Quick Actions panel (home page)
3. Click "DMO Dashboard" button
4. URL should change to: `http://localhost:3000/dmo`

**Expected Result:**
- ✅ Page loads successfully
- ✅ Upload area visible
- ✅ Chart shows "No Data Available" (empty state)
- ✅ 4 stat cards show "-" or "0"

---

### Test 1.2: Upload Market Snapshot Data
**Steps:**
1. Locate `sample_market_snapshot.xlsx` file
2. Drag file into upload dropzone
3. Verify file preview shows:
   - File name: `sample_market_snapshot.xlsx`
   - File size: ~11 KB
4. Click "Upload to Database" button
5. Wait for upload to complete (2-5 seconds)

**Expected Result:**
- ✅ Success toast appears: "Market data uploaded successfully!"
- ✅ Toast shows: "96 records inserted"
- ✅ No error messages
- ✅ Upload button returns to normal state

---

### Test 1.3: Verify Chart Auto-Refresh
**Steps:**
1. Immediately after upload completes
2. Watch the Market Snapshot chart area
3. Open browser console (F12)
4. Look for console log

**Expected Result:**
- ✅ Chart area shows loading spinner briefly
- ✅ Console shows: `"Data uploaded via custom event, refreshing market snapshot..."`
- ✅ Chart renders automatically (no manual refresh needed)
- ✅ All 5 series visible:
  - Blue area (Purchase Bid MW)
  - Yellow area (Sell Bid MW)
  - Green area (MCV MW)
  - Purple area (Scheduled Volume MW)
  - Black line (MCP Rs/kWh)

---

### Test 1.4: Verify Chart Data
**Steps:**
1. Check metadata below chart header
2. Hover over chart areas
3. Check date picker
4. Try interval selector

**Expected Result:**
- ✅ Metadata shows: "Records: 96 • Blocks: 96 • Interval: 15 min"
- ✅ Tooltip appears on hover showing values
- ✅ Date picker shows today's date (2025-10-08)
- ✅ Interval selector has options: 15, 30, 60 minutes

---

### Test 1.5: Verify Database Persistence
**Steps:**
1. Open new tab: `http://localhost:5555` (Prisma Studio)
2. Navigate to: MarketSnapshotData table
3. Click table to view records
4. Filter by: `time_period` contains `2025-10-08`

**Expected Result:**
- ✅ 96 records visible
- ✅ Each record has:
  - time_period (DateTime)
  - timeblock (1-96)
  - dam_price (number)
  - scheduled_mw (number)
  - modelresult_mw (number)
  - purchase_bid_mw (number)
  - sell_bid_mw (number)

---

### Test 1.6: Test Chart Export
**Steps:**
1. Return to DMO page
2. Click download button (download icon, top right of chart)
3. Wait for file to download

**Expected Result:**
- ✅ File downloads: `market-snapshot-2025-10-08.csv`
- ✅ Open CSV in Excel/text editor
- ✅ CSV has 97 rows (1 header + 96 data)
- ✅ Columns: Timeblock, DAM Price, RTM Price, GDAM Price, Scheduled MW, Model Result MW

---

## 🧪 Test Suite 2: Main Dashboard DMO Charts

### Test 2.1: Navigate to Main DMO Module
**Steps:**
1. Go to: `http://localhost:3000`
2. Click "Day-Ahead Market (DMO)" in left sidebar
3. Wait for charts to load

**Expected Result:**
- ✅ Page shows 3 charts:
  - Generator/Storage Scheduling (area chart)
  - Contract-wise Scheduling (bar chart)
  - Market Bidding (scatter + line charts)
- ✅ All charts show simulated data (not blank!)
- ✅ Toast appears: "No data found - Showing simulated data"

---

### Test 2.2: Verify Simulated Data Display
**Steps:**
1. Check each chart
2. Hover over chart elements
3. Click filter dropdowns

**Expected Result:**
- ✅ **Generator Chart:**
  - Shows 8 technologies (Coal, Gas, Hydro, Nuclear, Solar, Wind, etc.)
  - Scheduled MW and Actual MW lines visible
  - Tooltips work
  - Filters have options: Technology, Unit, Contract
  
- ✅ **Contract Chart:**
  - Shows 5 contract types (PPA, Tender, Merchant, REC, Banking)
  - Bar chart with Scheduled, Actual, Cumulative MW
  - Filters work
  
- ✅ **Bidding Chart:**
  - Two sub-charts: Scatter (bid distribution) + Line (clearing price)
  - Multiple market types visible
  - Colors distinct

---

### Test 2.3: Test Chart Interactions
**Steps:**
1. Click on filter dropdowns
2. Select different options
3. Click refresh button
4. Click export buttons (CSV/Excel)

**Expected Result:**
- ✅ Filters change displayed data
- ✅ Refresh button shows spinner, then reloads
- ✅ Export buttons download files
- ✅ No console errors

---

## 🧪 Test Suite 3: API Endpoints

### Test 3.1: Test Market Snapshot API
```bash
# Test GET endpoint
curl "http://localhost:3000/api/market-snapshot?date=2025-10-08&interval=15"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "timeblocks": [1, 2, 3, ..., 96],
#     "dam_price": [...],
#     "rtm_price": [...],
#     "gdam_price": [...],
#     "scheduled_mw": [...],
#     "modelresult_mw": [...],
#     "purchase_bid_mw": [...],
#     "sell_bid_mw": [...]
#   },
#   "metadata": {
#     "date": "2025-10-08",
#     "interval": 15,
#     "recordCount": 96,
#     "aggregatedBlocks": 96
#   }
# }
```

### Test 3.2: Test DMO Generator API
```bash
curl "http://localhost:3000/api/dmo/generator-scheduling"

# Expected: JSON with data array (may be empty)
# {
#   "success": true,
#   "data": [...],
#   "total": 0
# }
```

### Test 3.3: Test DMO Filters API
```bash
curl "http://localhost:3000/api/dmo/filters?type=generator"

# Expected: Filter options
# {
#   "success": true,
#   "data": {
#     "technologyTypes": [...],
#     "unitNames": [...],
#     "contractNames": [...]
#   }
# }
```

---

## 🧪 Test Suite 4: Error Handling

### Test 4.1: Upload Invalid File
**Steps:**
1. Go to `/dmo` page
2. Try uploading a text file (.txt) or image (.jpg)

**Expected Result:**
- ✅ Error toast: "Invalid file type"
- ✅ Message: "Please upload an Excel (.xlsx, .xls) or CSV file"
- ✅ Upload doesn't proceed

---

### Test 4.2: Upload Empty File
**Steps:**
1. Create an empty Excel file
2. Try uploading it

**Expected Result:**
- ✅ Error toast: "No data found in the file"
- ✅ Upload fails gracefully
- ✅ Charts remain in current state

---

### Test 4.3: Select Wrong Date
**Steps:**
1. After uploading data for 2025-10-08
2. Change date picker to: 2025-10-07
3. Click calendar, select a past date

**Expected Result:**
- ✅ Chart shows "No Data Available"
- ✅ Metadata shows: "Records: 0"
- ✅ No error messages
- ✅ Changing back to 2025-10-08 shows data again

---

## 🧪 Test Suite 5: Performance & UX

### Test 5.1: Loading States
**Steps:**
1. Refresh DMO page
2. Watch chart area during load

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Spinner centered in chart area
- ✅ Message: "Loading data..."
- ✅ Transition to chart is smooth

---

### Test 5.2: Responsive Design
**Steps:**
1. Resize browser window to mobile size (< 768px)
2. Check layout
3. Try interactions

**Expected Result:**
- ✅ Charts remain visible
- ✅ Controls stack vertically
- ✅ Touch interactions work
- ✅ No horizontal scroll

---

### Test 5.3: Multiple Uploads
**Steps:**
1. Upload sample file
2. Wait for chart to render
3. Upload same file again
4. Check database

**Expected Result:**
- ✅ Second upload succeeds
- ✅ Toast shows: "96 records inserted" (or less due to skipDuplicates)
- ✅ No duplicate records in database
- ✅ Chart shows same data

---

## 📋 Test Results Template

### Copy and fill this out after testing:

```markdown
## Test Results - [Date]

### Environment:
- Node Version: ______
- Browser: ______
- Date/Time: ______

### Test Suite 1: Market Snapshot Chart
- [ ] 1.1 Navigation ✅/❌
- [ ] 1.2 Upload ✅/❌
- [ ] 1.3 Auto-refresh ✅/❌
- [ ] 1.4 Chart data ✅/❌
- [ ] 1.5 Database ✅/❌
- [ ] 1.6 Export ✅/❌

### Test Suite 2: Main DMO Charts
- [ ] 2.1 Navigation ✅/❌
- [ ] 2.2 Simulated data ✅/❌
- [ ] 2.3 Interactions ✅/❌

### Test Suite 3: API Endpoints
- [ ] 3.1 Market Snapshot API ✅/❌
- [ ] 3.2 DMO Generator API ✅/❌
- [ ] 3.3 Filters API ✅/❌

### Test Suite 4: Error Handling
- [ ] 4.1 Invalid file ✅/❌
- [ ] 4.2 Empty file ✅/❌
- [ ] 4.3 Wrong date ✅/❌

### Test Suite 5: Performance & UX
- [ ] 5.1 Loading states ✅/❌
- [ ] 5.2 Responsive design ✅/❌
- [ ] 5.3 Multiple uploads ✅/❌

### Issues Found:
1. ___________
2. ___________
3. ___________

### Overall Status: PASS / FAIL / PARTIAL
```

---

## 🚀 Quick Automated Test Script

Save this as `quick_test.ps1`:

```powershell
Write-Host "Running Quick E2E Test..." -ForegroundColor Cyan

# Test 1: Check files exist
Write-Host "`n1. Checking sample files..." -ForegroundColor Yellow
$files = @("sample_market_snapshot.xlsx", "sample_dmo_generator_scheduling.xlsx")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file missing" -ForegroundColor Red
    }
}

# Test 2: Check server is running
Write-Host "`n2. Checking dev server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✓ Server is running (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Server not running or not accessible" -ForegroundColor Red
}

# Test 3: Check API endpoints
Write-Host "`n3. Checking API endpoints..." -ForegroundColor Yellow
$endpoints = @(
    "http://localhost:3000/api/market-snapshot?date=2025-10-08&interval=15",
    "http://localhost:3000/api/dmo/generator-scheduling",
    "http://localhost:3000/api/dmo/filters?type=generator"
)
foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint -TimeoutSec 5
        if ($response.success) {
            Write-Host "  ✓ $($endpoint.Split('/')[-2..-1] -join '/') working" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠ $($endpoint.Split('/')[-2..-1] -join '/') error" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Quick test complete!" -ForegroundColor Cyan
Write-Host "For full testing, follow E2E_TESTING_GUIDE.md`n" -ForegroundColor White
```

---

## 🎯 Success Criteria

All tests should pass with these criteria:
- ✅ **Upload:** Files upload without errors
- ✅ **Database:** Data persists correctly
- ✅ **Charts:** Auto-refresh and display data
- ✅ **Interactions:** All controls work
- ✅ **Errors:** Handled gracefully
- ✅ **Performance:** < 3s load time

---

**Status:** Ready for Testing  
**Time Required:** 30-45 minutes for full suite  
**Priority:** High - Validates entire data flow
