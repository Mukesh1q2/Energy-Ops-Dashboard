# Chart Visibility Troubleshooting Guide

## Issue 1: Charts Don't Appear After Excel Upload

### Root Causes & Solutions

#### ✅ **Solution 1: Generate and Upload Sample Data**

The DMO Market Snapshot chart requires data in the database to display. Follow these steps:

**Step 1: Generate Sample Data**
```powershell
# Install pandas and openpyxl if not already installed
pip install pandas openpyxl numpy

# Run the sample data generator
python generate_market_snapshot_sample.py
```

This creates `sample_market_snapshot.xlsx` with 96 records (one full day of 15-minute interval data).

**Step 2: Upload to DMO Dashboard**
1. Navigate to `http://localhost:3000/dmo`
2. Drag and drop `sample_market_snapshot.xlsx` to the upload area
3. Click "Upload to Database"
4. Wait for success message: "Market data uploaded successfully!"

**Step 3: Verify Chart Displays**
- Scroll down to "Market Snapshot" section
- Chart should automatically load with today's date
- You should see 5 series:
  - Yellow area: Scheduled Volume
  - Green area: Model Result MW
  - Black line: DAM Price
  - Gray dashed line: RTM Price
  - Blue dotted line: GDAM Price

---

#### ✅ **Solution 2: Check Date Selection**

**Problem:** Chart shows "No Data Available" even after upload

**Fix:**
1. Look at the date picker in the Market Snapshot card
2. Ensure the date matches your uploaded data (default: today)
3. The sample generator creates data for **January 8, 2025**
4. Click the calendar icon and select **January 8, 2025**
5. Chart should now display data

---

#### ✅ **Solution 3: Verify Data in Database**

**Check if data was actually inserted:**

```powershell
# Open Prisma Studio to view database
npx prisma studio
```

1. Open in browser: `http://localhost:5555`
2. Click on `MarketSnapshotData` table
3. Verify records exist with:
   - `time_period` = 2025-01-08
   - `timeblock` = 1 to 96
   - `dam_price`, `scheduled_mw`, etc. have values

**If no records:**
- Check upload API logs in terminal
- Look for error messages
- Verify Excel file has required columns

---

#### ✅ **Solution 4: Check API Response**

**Test the API directly:**

```powershell
# Test with PowerShell
$date = "2025-01-08"
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/market-snapshot?date=$date&interval=15" -Method GET
$response | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "timeblocks": [1, 2, 3, ...],
    "dam_price": [3.5, 3.7, ...],
    "scheduled_mw": [120, 125, ...]
  },
  "metadata": {
    "recordCount": 96
  }
}
```

**If recordCount is 0:**
- Data not in database
- Check date filter matches uploaded data
- Re-upload the Excel file

---

#### ✅ **Solution 5: Check Browser Console**

**Open Developer Tools (F12) and check for errors:**

1. Go to Console tab
2. Look for errors like:
   - "Failed to fetch market data"
   - "Network error"
   - "MarketSnapshot component error"

**Common Errors:**
- **404 Error:** API route not found → Restart dev server
- **500 Error:** Server error → Check terminal logs
- **CORS Error:** Unlikely in Next.js, but check headers

---

## Issue 2: Check All Charts Are Working

### Chart Component Inventory

#### ✅ **DMO Dashboard Charts**
- **Location:** `http://localhost:3000/dmo`
- **Chart:** Market Snapshot (ECharts)
- **Status:** ✅ Implemented
- **Test:**
  1. Upload sample data
  2. Verify chart loads
  3. Test date picker
  4. Test interval selector (15/30/60 min)
  5. Test download button

#### ✅ **Main Dashboard Charts** (`/`)
**DMO Charts:**
- Generator Scheduling Chart
- Contract Scheduling Chart
- Market Bidding Chart

**Status:** Need to verify data sources exist

**RMO Charts:**
- Price Chart
- Schedule Chart
- Optimization Chart

**Analytics Charts:**
- Price Trends
- Volume Analysis
- Performance Metrics

**Storage Charts:**
- Storage Capacity
- Storage Performance

**Transmission Charts:**
- Transmission Flow
- Transmission Losses

**Consumption Charts:**
- Consumption by Sector
- Demand Pattern

### Testing Each Chart

**Method 1: Visual Inspection**
1. Navigate to main dashboard (`/`)
2. Scroll through page
3. Check if each chart renders
4. Look for error messages or "No Data"

**Method 2: Check Component Imports**
```typescript
// In src/app/page.tsx, verify all imports:
import { GeneratorSchedulingChart } from "@/components/dmo-charts"
import { StorageCapacityChart } from "@/components/storage-charts"
// etc.
```

---

## Issue 3: One-Click Plot Modal Issues

### Problem: Charts Don't Render in Autoplot Modal

**Root Cause:** One-click plot feature requires:
1. Data source to be connected
2. AutoPlot API to analyze columns
3. Chart configuration to be generated

**Fix:**

**Step 1: Verify Data Source**
```typescript
// Check in Sandbox page
console.log(selectedDataSource) // Should not be empty
```

**Step 2: Test AutoPlot API**
```powershell
# Test API directly
$body = @{
    data_source_id = "your-data-source-id"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/autoplot" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json
```

**Expected:** Array of chart suggestions

**Step 3: Check Chart Rendering**
- Ensure ReactECharts component loads
- Check ECharts configuration is valid
- Verify chart dimensions are set

---

## Common Issues & Quick Fixes

### Issue: "Module not found: echarts-for-react"

**Fix:**
```powershell
npm install echarts echarts-for-react --legacy-peer-deps
```

### Issue: Database connection error

**Fix:**
```powershell
npx prisma generate
npx prisma db push
```

### Issue: API returns 404

**Fix:**
1. Restart dev server: `Ctrl+C`, then `npm run dev`
2. Clear `.next` folder: `Remove-Item -Recurse -Force .next`
3. Rebuild: `npm run dev`

### Issue: Socket.IO not connecting

**Fix:**
1. Check `server.ts` is running (not `next dev`)
2. Verify port 3000 is not blocked
3. Check browser console for WebSocket errors

### Issue: Excel upload fails

**Fix:**
1. Verify file has required columns
2. Check file size < 10MB
3. Ensure date format: `YYYY-MM-DD HH:MM:SS`
4. Timeblock must be 1-96

---

## Debug Checklist

### Before Uploading Data
- [ ] Server is running (`npm run dev`)
- [ ] Database is accessible (`npx prisma studio`)
- [ ] Sample data is generated (`generate_market_snapshot_sample.py`)
- [ ] Excel file has all required columns

### During Upload
- [ ] Upload success message appears
- [ ] Check terminal for API logs
- [ ] Verify record count in response
- [ ] Check for error toasts

### After Upload
- [ ] Navigate to DMO dashboard (`/dmo`)
- [ ] Select correct date in calendar
- [ ] Verify chart loads (may take 1-2 seconds)
- [ ] Check browser console for errors
- [ ] Test chart interactions (zoom, tooltip, download)

### If Still Not Working
- [ ] Open Prisma Studio, check `MarketSnapshotData` table
- [ ] Test API directly with Postman/curl
- [ ] Check server terminal for errors
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Try different browser
- [ ] Restart dev server

---

## Performance Considerations

### Large Datasets
- Market Snapshot supports 96 timeblocks (one day)
- For multiple days, upload multiple files
- Use interval selector (30/60 min) for better performance

### Chart Rendering
- Initial load: ~500ms
- Data fetch: ~200ms
- Chart render: ~300ms
- Total: ~1 second is normal

### Optimization
- Enable data aggregation (30/60 min intervals)
- Limit date range to single day initially
- Use download feature for offline analysis

---

## Next Steps

1. **Generate sample data:**
   ```powershell
   python generate_market_snapshot_sample.py
   ```

2. **Upload to DMO Dashboard:**
   - Go to http://localhost:3000/dmo
   - Upload `sample_market_snapshot.xlsx`

3. **Verify chart appears:**
   - Select date: January 8, 2025
   - Interval: 15 minutes
   - Chart should display immediately

4. **Test interactivity:**
   - Hover over data points
   - Click legend to toggle series
   - Use zoom controls
   - Download CSV

5. **Report issues:**
   - Check all items in Debug Checklist
   - Note exact error messages
   - Check browser and server logs

---

## Quick Reference

### URLs
- DMO Dashboard: `http://localhost:3000/dmo`
- Main Dashboard: `http://localhost:3000/`
- Sandbox: `http://localhost:3000/sandbox`
- Prisma Studio: `http://localhost:5555`

### Commands
```powershell
# Generate sample data
python generate_market_snapshot_sample.py

# Start server
npm run dev

# View database
npx prisma studio

# Reset database
npx prisma migrate reset

# Check logs
# (View terminal where npm run dev is running)
```

### File Paths
- Sample generator: `generate_market_snapshot_sample.py`
- DMO Dashboard: `src/app/dmo/page.tsx`
- Market Snapshot Chart: `src/components/dmo/market-snapshot.tsx`
- Upload API: `src/app/api/market-snapshot/upload/route.ts`
- Main API: `src/app/api/market-snapshot/route.ts`

---

**Status:** Troubleshooting guide complete  
**Last Updated:** 2025-01-08  
**Next:** Run through Quick Reference steps to verify functionality
