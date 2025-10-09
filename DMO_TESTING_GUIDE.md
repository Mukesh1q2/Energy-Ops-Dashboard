# DMO Dashboard - Testing Guide & Recent Fixes

## 🔧 Recent Fixes Applied

### 1. **Chart Auto-Refresh Fixed** ✅
**Problem:** Charts weren't updating after Excel file upload.

**Root Cause:** The MarketSnapshot component was only listening for Socket.IO events, but the DMO page was emitting browser custom events after upload.

**Solution Applied:**
- Added a second `useEffect` hook in `MarketSnapshot.tsx` that listens for browser's custom `data:uploaded` event
- This complements the existing Socket.IO event listener
- Now the component refreshes data through both channels:
  - Socket.IO events: `data:uploaded` and `market-snapshot:updated`
  - Browser custom events: `data:uploaded`

**Code Changed:**
```typescript
// File: src/components/dmo/market-snapshot.tsx
// Added at line 92-106

// Also listen for custom browser events (from upload page)
useEffect(() => {
  if (!autoRefresh) return

  const handleCustomDataUpload = () => {
    console.log('Data uploaded via custom event, refreshing market snapshot...')
    fetchData()
  }

  window.addEventListener('data:uploaded', handleCustomDataUpload)

  return () => {
    window.removeEventListener('data:uploaded', handleCustomDataUpload)
  }
}, [autoRefresh, fetchData])
```

### 2. **Sample Data Generator Updated** ✅
**Status:** Already uses current date (`datetime.now()`) for easier testing.

**File:** `generate_market_snapshot_sample.py`
- Generates 96 timeblocks (15-minute intervals for 24 hours)
- Uses today's date automatically
- Creates realistic market data with peak hour patterns
- Includes all required and optional fields

## 📋 Testing Checklist

### Prerequisites
✅ Python packages installed: `pandas`, `numpy`, `openpyxl`
✅ Development server running (Node processes detected)
✅ Sample data file generated with today's date

### Test Steps

#### **Step 1: Generate Sample Data**
```bash
python generate_market_snapshot_sample.py
```

Expected output:
- File created: `sample_market_snapshot.xlsx`
- 96 records
- Date: **2025-10-08** (today)
- All required columns present

#### **Step 2: Access DMO Dashboard**
1. Open browser to: `http://localhost:3000`
2. Click on **"Day-Ahead Market (DMO)"** in the left sidebar
3. Verify the DMO Dashboard page loads with:
   - Header: "DMO Dashboard"
   - Upload area
   - Empty chart (no data initially)
   - 4 stat cards showing "-" or "0"

#### **Step 3: Upload Sample Data**
1. Drag and drop `sample_market_snapshot.xlsx` into the upload area
   - OR click the upload area to browse and select the file
2. Verify file preview shows:
   - File name badge
   - File size (should be a few KB)
   - "Remove" button
3. Click **"Upload to Database"** button
4. Wait for upload to complete

**Expected Results:**
✅ Success toast: "Market data uploaded successfully!"
✅ Shows record count (should be 96)
✅ File name displayed
✅ Any errors/warnings shown if rows were skipped

#### **Step 4: Verify Chart Auto-Refresh** ⚠️ CRITICAL TEST
This is the main fix - charts should update automatically after upload.

**Expected Behavior:**
1. **Immediately after successful upload:**
   - Chart should automatically refresh
   - Console should show: `"Data uploaded via custom event, refreshing market snapshot..."`
   - Chart displays data for **2025-10-08** (today's date)
   - Loading spinner appears briefly, then chart renders

2. **Check console logs:**
   ```
   Data uploaded via custom event, refreshing market snapshot...
   ```

3. **Verify chart data:**
   - X-axis: Time blocks 1-96
   - Y-axis left: Volume (MW) - shows scheduled and model result volumes
   - Y-axis right: Price (Rs/kWh) - shows DAM, RTM, GDAM prices
   - Lines/areas visible with different colors
   - Tooltip works when hovering
   - Data zoom slider at bottom

#### **Step 5: Test Date Picker**
**IMPORTANT:** The default date picker should match today's date.

1. Check the date picker control (top right of chart)
   - Should show: **"08 Oct 2025"**
2. Click the calendar icon to open date picker
3. Verify today's date is selected
4. Try selecting different dates:
   - Past dates: Chart should show "No Data Available"
   - Future dates: Chart should show "No Data Available"
   - Today's date: Chart should show the uploaded data

#### **Step 6: Test Interval Selector**
1. Click the interval dropdown (default is "15 minutes")
2. Select "30 minutes"
   - Chart should aggregate 2 timeblocks into 1
   - X-axis should show 48 points instead of 96
3. Select "60 minutes"
   - Chart should aggregate 4 timeblocks into 1
   - X-axis should show 24 points
4. Select "15 minutes" again
   - Chart should show all 96 timeblocks

#### **Step 7: Test Download Functionality**
1. Click the download button (download icon, top right)
2. Verify CSV file downloads: `market-snapshot-2025-10-08.csv`
3. Open CSV and verify:
   - Headers: Timeblock, DAM Price, RTM Price, GDAM Price, Scheduled MW, Model Result MW
   - 96 rows of data
   - Values match what's shown in the chart

#### **Step 8: Test Refresh Button**
1. Click the refresh button (circular arrow icon)
2. Chart should reload data from API
3. Loading spinner should appear briefly

#### **Step 9: Test Live Connection Indicator**
Check the badge next to controls:
- **"● Live"** (green) = Socket.IO connected
- **"○ Offline"** (red) = Socket.IO disconnected

#### **Step 10: Verify Database Records**
Open database and check:
```sql
SELECT COUNT(*) FROM "MarketSnapshotData" 
WHERE DATE(time_period) = '2025-10-08';
```
Should return: **96**

Or use Prisma Studio:
```bash
npx prisma studio
```
Navigate to MarketSnapshotData table and filter by today's date.

### **Step 11: Test Multiple Uploads**
1. Generate another sample file (different date if possible)
2. Upload the new file
3. Verify:
   - Chart refreshes automatically
   - Date picker can switch between dates
   - Both dates show correct data

## 🐛 Common Issues & Solutions

### Issue 1: Chart Doesn't Appear After Upload
**Symptoms:** Upload succeeds but chart shows "No Data Available"

**Diagnosis:**
1. Check browser console for errors
2. Check date picker - does it match the upload date?
3. Open Network tab, look for API call to `/api/market-snapshot?date=...`
4. Check response - does it have data?

**Solutions:**
- ✅ **Fixed:** Custom event listener now triggers chart refresh
- If still not working: Check that `fetchData()` is being called in console logs
- Manually click the refresh button
- Try changing the interval selector to force a refresh

### Issue 2: Upload Fails
**Symptoms:** Error toast or upload hangs

**Check:**
1. File format (must be .xlsx, .xls, or .csv)
2. File size (max 10MB)
3. Required columns present: `TimePeriod`, `Timeblock`, `DAMprice`, `RTMprice`, `ScheduleMW`, `ModelresultMW`
4. Server logs for detailed error messages

### Issue 3: Wrong Date Displayed
**Symptoms:** Chart shows data but for a different date

**Solution:**
1. Check the date picker - it should auto-select today's date
2. Use the calendar to manually select the correct date
3. Verify sample data was generated with today's date:
   ```python
   # In generate_market_snapshot_sample.py, line 12:
   START_DATE = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
   ```

### Issue 4: Chart Shows Partial Data
**Symptoms:** Only some data points visible

**Check:**
1. Interval setting - 30 or 60 min will show fewer points
2. Data zoom slider - might be zoomed in, drag to show all data
3. Database records - should have 96 records for full day

### Issue 5: Socket.IO Disconnected
**Symptoms:** Badge shows "○ Offline" in red

**Not Critical:** The custom event listener will still trigger chart refresh after upload.

**To Fix:**
1. Check that Socket.IO server is running
2. Verify `/api/socketio` route exists
3. Check browser console for connection errors
4. Refresh the page

## 🎯 Next Steps After Testing

### If All Tests Pass:
✅ Mark the following todos as complete:
- [x] Fix chart visibility after Excel upload
- [x] Fix Socket.IO event emission after upload

### Remaining Tasks:
- [ ] Verify all existing chart components are working
- [ ] Add navigation quick links to DMO Dashboard
- [ ] Test end-to-end upload and chart flow (this guide covers it)
- [ ] Fix autoplot modal chart rendering

### Additional Enhancements (Optional):
1. **Navigation:** Add a quick access card on the home page for DMO Dashboard
2. **Stats Cards:** Populate the 4 stat cards with real-time data from uploaded records
3. **Filters:** Add state/plant filters to the Market Snapshot chart
4. **Alerts:** Add notification when upload completes (in addition to toast)
5. **History:** Show list of uploaded files with dates

## 📊 Expected Chart Appearance

When working correctly, the Market Snapshot chart should display:

### Visual Elements:
- **Title:** "Day-Ahead Market Snapshot"
- **Subtitle:** "Date: 08 Oct 2025 | Interval: 15min"
- **Legend:** Shows all 5 series with colors:
  - 🟡 Scheduled Volume (MW) - Yellow/Gold area
  - 🟢 Model Result MW (MCV) - Green area
  - ⚫ DAM Price - Black solid line
  - ⚪ RTM Price - Gray dashed line
  - 🔵 GDAM Price - Blue dotted line

### Interactive Features:
- Hover tooltip showing values for all series
- Data zoom slider at bottom
- Toolbox buttons (zoom, reset, save as image)
- Smooth line interpolation
- Proper axis labels and units

### Metadata Display:
Below the chart title, you should see:
```
Records: 96 • Blocks: 96 • Interval: 15 min
```

## 🔍 Debugging Tips

### Enable Verbose Logging:
1. Open browser console
2. Look for these log messages:
   - `"Data uploaded via custom event, refreshing market snapshot..."`
   - `"Data uploaded via Socket.IO, refreshing market snapshot..."` (if Socket.IO connected)
   - `"📊 KPI update received:"` (if KPI updates work)

### API Testing:
Test the API directly:
```bash
# Get data for today
curl "http://localhost:3000/api/market-snapshot?date=2025-10-08&interval=15"

# Should return JSON with data arrays
```

### Network Tab:
1. Open browser DevTools > Network
2. Filter by "Fetch/XHR"
3. After upload, look for:
   - POST to `/api/market-snapshot/upload` (should return 200)
   - GET to `/api/market-snapshot?date=...` (should return data)

## 📝 Summary

**Key Fix:** Added browser custom event listener to MarketSnapshot component to complement Socket.IO events. This ensures charts refresh after upload regardless of Socket.IO connection status.

**Testing Focus:** Verify that charts update automatically and immediately after successful file upload, without requiring manual refresh.

**Success Criteria:**
1. ✅ Upload completes successfully
2. ✅ Chart appears without manual refresh
3. ✅ Data matches uploaded date
4. ✅ All 96 timeblocks visible
5. ✅ Interactive features work (zoom, tooltip, download)

---

**Generated:** 2025-10-08
**Version:** 1.0
**Status:** Ready for Testing
