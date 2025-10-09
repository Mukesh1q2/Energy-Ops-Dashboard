# Market Snapshot Chart - Complete Fix & Testing Guide

## ✅ Fixes Applied

### Fix #1: Updated Chart Design to Match Reference Image
**Problem:** Chart was missing Purchase Bid and Sell Bid series  
**Solution:** Updated chart to show all 5 series:

1. **Purchase Bid (MW)** - Blue stacked area
2. **Sell Bid (MW)** - Yellow/Gold stacked area  
3. **MCV (MW)** - Green area (Model Result MW)
4. **Scheduled Volume (MW)** - Purple area
5. **MCP (Rs/kWh)** - Black line on right axis (Market Clearing Price = DAM Price)

**File Modified:** `src/components/dmo/market-snapshot.tsx`

### Chart Configuration:
- **Left Y-Axis:** Market Volume (MW) - for all area charts
- **Right Y-Axis:** Price (Rs/kWh) - for MCP line
- **X-Axis:** Time blocks (0-96 for 15-min intervals)
- **Stacking:** Purchase and Sell bids are stacked
- **Smooth Lines:** All series use smooth curve interpolation

---

## 📊 Understanding the Two Different Pages

### Page 1: Main Dashboard DMO Module
**URL:** `http://localhost:3000` (then click "Day-Ahead Market (DMO)" in sidebar)

**Charts Shown:**
1. Generator/Storage Scheduling
2. Contract-wise Scheduling
3. Market Bidding

**Note:** These are DIFFERENT charts from Market Snapshot!
- They show simulated data if database is empty ✅ (Already fixed)
- They use different data tables (DMOGeneratorScheduling, DMOContractScheduling, DMOMarketBidding)

### Page 2: DMO Dashboard Page (Market Snapshot)
**URL:** `http://localhost:3000/dmo`

**Charts Shown:**
1. Market Snapshot (with Purchase Bid, Sell Bid, MCV, Scheduled, MCP)

**Upload Section:** This page HAS an upload area for Excel files

---

## 🧪 Testing Instructions

### Test 1: Upload Sample Data to Market Snapshot
```bash
# Step 1: Verify sample file exists
ls sample_market_snapshot.xlsx

# Should show: sample_market_snapshot.xlsx (generated earlier)
# Date: 2025-10-08, Records: 96
```

```bash
# Step 2: Navigate to DMO Dashboard page
# Open browser: http://localhost:3000/dmo
```

**Step 3: Upload File**
1. Drag `sample_market_snapshot.xlsx` into upload area
2. OR click upload area to browse and select file
3. Click "Upload to Database" button

**Expected Result:**
- ✅ Success toast: "Market data uploaded successfully! 96 records inserted"
- ✅ Chart should auto-refresh and display data
- ✅ All 5 series visible:
  - Blue area (Purchase Bid)
  - Yellow area (Sell Bid) 
  - Green area (MCV)
  - Purple area (Scheduled Volume)
  - Black line (MCP price)

### Test 2: Verify Chart After Upload

**Check 1: Date Picker**
- Date picker should show: **08 Oct 2025** (today)
- If different date selected, chart will show "No Data Available"

**Check 2: Interval Selector**
- Should be set to: **15 minutes**
- Try changing to 30 or 60 minutes - chart should aggregate data

**Check 3: Chart Interaction**
- Hover over areas - tooltip should show values
- Use mouse wheel to zoom in/out
- Drag data zoom slider at bottom
- Click legend items to show/hide series

**Check 4: Metadata Display**
Below chart header, should show:
```
Records: 96 • Blocks: 96 • Interval: 15 min
```

### Test 3: Export Data
1. Click download button (download icon)
2. File downloads: `market-snapshot-2025-10-08.csv`
3. Open CSV - should have 96 rows

---

## ❌ Troubleshooting

### Issue: "No Data Found" After Upload

**Possible Causes:**

#### Cause 1: Date Mismatch
**Symptom:** Upload succeeds but chart shows "No Data Available"

**Fix:**
1. Check date picker - does it match **2025-10-08**?
2. Sample data was generated for TODAY'S date
3. Click calendar and select today's date

#### Cause 2: Data Not Saved to Database
**Check:**
```bash
# Open Prisma Studio to verify data
npx prisma studio

# Navigate to: MarketSnapshotData table
# Filter by: time_period = 2025-10-08
# Should see: 96 records
```

**If no records:**
- Check upload response - did it say "96 records inserted"?
- Check browser console for errors during upload
- Verify API endpoint works: 
  ```bash
  # Test upload endpoint exists
  curl http://localhost:3000/api/market-snapshot/upload
  ```

#### Cause 3: API Not Returning Data
**Check:**
```bash
# Test API directly
curl "http://localhost:3000/api/market-snapshot?date=2025-10-08&interval=15"

# Should return JSON with:
# - success: true
# - data: { timeblocks: [...], dam_price: [...], ... }
# - metadata: { recordCount: 96, ... }
```

**If returns empty:**
- Database might be empty for that date
- Check if data was actually inserted
- Try re-uploading the file

#### Cause 4: Browser Cache
**Fix:**
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear cache: DevTools → Right-click refresh → "Empty Cache and Hard Reload"

---

## 🎨 Chart Visual Reference

Based on your reference image, the chart should look like:

```
┌─────────────────────────────────────────────────────────┐
│  Market Snapshot                           [Filters]    │
│  Date: 08 Oct 2025 | Interval: 15min                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  60.0K ├─────────────────────────────────────┬─ 12     │
│        │     ████████ Yellow (Sell Bid)      │          │
│  45.0K ├   █████████████████████████████     ├─ 10     │
│        │  ███████████████████████████████    │          │
│  30.0K ├ ████ Blue (Purchase Bid) ██████████ ├─ 8      │
│        │████████████████████████████████████ │          │
│  15.0K ├═══Green(MCV)═══════════════════════ ├─ 6      │
│        │──Purple(Scheduled)──────────────────│ ●─Black │
│   0.0K ├────────────────────────────────────▲├─ 0(MCP) │
│        0    5    10   15   20   Time Block   │          │
└─────────────────────────────────────────────────────────┘

Legend:
● Purchase Bid (MW) ● Sell Bid (MW) ● MCV (MW) 
● Scheduled Volume (MW) ● MCP (Rs/kWh)
```

**Key Visual Elements:**
- **Stacked areas** (Purchase + Sell) create layered effect
- **MCV area** overlays on top (green)
- **Scheduled volume** shows as purple area
- **MCP line** (black) follows price on right axis
- **Dual Y-axes:** MW on left, Rs/kWh on right

---

## 🔍 Debugging Console Logs

When chart loads, you should see in browser console:

```javascript
// On page load:
"Socket connected: [socket-id]"

// After upload:
"Data uploaded via custom event, refreshing market snapshot..."

// After successful fetch:
// Network tab shows: GET /api/market-snapshot?date=2025-10-08&interval=15
// Response: { success: true, data: {...}, metadata: {...} }
```

**If you see:**
- `"Failed to fetch market data"` - API error, check server logs
- `"No data found"` - Database empty for selected date
- `"Data uploaded via custom event..."` - Upload triggered refresh ✅

---

## 📝 Sample Data Structure

The uploaded Excel file should have these columns:

**Required:**
- TimePeriod (DateTime)
- Timeblock (1-96)
- DAMprice (MCP)
- RTMprice
- ScheduleMW
- ModelresultMW

**Optional (for full chart):**
- PurchaseBidMW ← **Important for your chart!**
- SellBidMW ← **Important for your chart!**
- GDAMprice
- State, PlantName, Region, ContractName

The sample generator (`generate_market_snapshot_sample.py`) already includes these fields.

---

## ✅ Success Checklist

After following this guide, you should have:

- [x] Market Snapshot chart displays 5 series (Purchase, Sell, MCV, Scheduled, MCP)
- [x] Chart matches reference image design
- [x] Upload works - shows success toast
- [x] Chart auto-refreshes after upload
- [x] Date picker shows correct date
- [x] All interactive features work (hover, zoom, export)
- [x] Dual Y-axes show MW and Rs/kWh

---

## 🚀 Next Steps

### If Market Snapshot Works ✅
1. Continue testing other dashboard modules
2. Upload data for other chart types (Generator, Contract, Bidding)
3. Test real-time updates with multiple uploads

### If Still Having Issues ❌
**Provide these details:**
1. Screenshot of chart (what you see)
2. Browser console errors (F12 → Console)
3. Network tab response for `/api/market-snapshot` call
4. Upload response - did it say "96 records inserted"?
5. Date selected in date picker

---

## 📞 Quick Reference

**Sample Data:** `sample_market_snapshot.xlsx` (96 records, 2025-10-08)  
**Upload Page:** `http://localhost:3000/dmo`  
**Test API:** `curl "http://localhost:3000/api/market-snapshot?date=2025-10-08&interval=15"`  
**Check DB:** `npx prisma studio` → MarketSnapshotData table  
**Chart File:** `src/components/dmo/market-snapshot.tsx`  
**Colors:** Blue=Purchase, Yellow=Sell, Green=MCV, Purple=Scheduled, Black=MCP

---

**Status:** ✅ Chart Updated - Ready to Test  
**Action:** Go to `/dmo` page, upload sample file, verify all 5 series appear!
