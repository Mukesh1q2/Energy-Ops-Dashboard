# Manual Testing Guide - Browser Validation

## Quick Start

**Server URL**: http://localhost:3000  
**Server Status**: ✅ Running (check task manager for node.exe process)

---

## 🎨 Test 1: Dark Theme Verification (2 min)

### Steps:
1. Open browser to `http://localhost:3000`
2. Observe the page appearance

### Expected Results:
- ✅ **Background**: Deep navy blue (not white)
- ✅ **Text**: Bright white (high contrast)
- ✅ **Cards**: Slightly lighter than background
- ✅ **Primary buttons**: Electric blue color
- ✅ **Charts**: Colorful energy-themed palette

### Visual Checklist:
```
[ ] Page loads with dark background
[ ] Text is readable and high contrast
[ ] Sidebar is darker than main area
[ ] Buttons have blue/cyan colors
[ ] No white flash on load
[ ] All text is visible (no black on black)
```

### Screenshot Locations:
Take screenshots of:
- Home page
- Analytics page
- Any chart with multiple colors

---

## 🧭 Test 2: Navigation & Disabled Pages (3 min)

### Steps:
1. Look at the left sidebar navigation
2. Count the visible menu items
3. Try clicking each menu item

### Expected Results:
- ✅ **Transmission** is NOT visible in menu
- ✅ Total menu items: ~15 (one less than before)
- ✅ All other items navigate correctly

### Navigation Checklist:
```
[ ] Home - Loads dashboard with KPIs
[ ] DMO - Shows Day-Ahead Market charts
[ ] RMO - Shows Real-Time Market charts  
[ ] Storage Operations - Shows battery charts
[ ] Archives - Shows optimization history
[ ] Analytics - Shows ENHANCED page (new!)
[ ] Sandbox - Shows data upload interface
[ ] Installed Capacity - Shows capacity charts
[ ] Generation - Shows generation data
[ ] Supply Status - Shows supply metrics
[ ] NO Transmission option visible ✓
```

---

## 📊 Test 3: Enhanced Analytics & Forecasting (5 min)

### Steps:
1. Click **"Analytics"** in the sidebar
2. Wait for page to load
3. Explore all tabs and controls

### Expected Results:
- ✅ **4 Insight Cards** at top with icons
- ✅ **Large forecast chart** with predicted vs actual
- ✅ **4 Tabs**: Distribution, Correlation, Performance, Anomalies
- ✅ **Dropdowns**: Metric selector, Time horizon selector
- ✅ **Export button**: Visible at top right

### Feature Checklist:
```
[ ] Page header shows "Analytics & Forecasting"
[ ] 4 insight cards with colored icons display
[ ] Main chart shows line graph with forecast
[ ] Tabs at bottom are clickable
[ ] Distribution tab shows bar chart
[ ] Correlation tab shows progress bars
[ ] Performance tab shows radar chart + metrics
[ ] Anomalies tab shows table with status badges
[ ] Dropdown menus work (Price/Demand/Generation)
[ ] Time horizon changes (7/30/90 days)
```

### What's New:
This page is **completely redesigned** with:
- ML-powered forecasting
- Confidence intervals (shaded area)
- Factor correlation analysis
- Model performance metrics (MAPE, R², RMSE)
- Anomaly detection log

---

## 📤 Test 4: Excel Upload System (10 min)

### Prerequisites:
- Close `RMO_sample.xlsx` if it's open in Excel
- File must not be locked

### Steps:
1. Navigate to **Sandbox** page
2. Click **"Upload File"** or similar button
3. Select `RMO_sample.xlsx` from project folder
4. Wait for upload to complete
5. Observe the response

### Expected Results:
- ✅ **Upload succeeds** with success message
- ✅ **Data Source ID** is shown
- ✅ **Sheet name(s)** are displayed
- ✅ Option to **process sheet** appears

### Post-Upload Checks:
```
[ ] Success message appears
[ ] File name is displayed
[ ] Sheet count shows (usually 1)
[ ] "Process Sheet" button is clickable
```

### Processing Results:
After clicking "Process Sheet":
```
[ ] Column mappings are shown
[ ] Each Excel column → database column mapping
[ ] Data types are detected (float, string, datetime, etc.)
[ ] Record count shows how many rows inserted
[ ] No error messages
```

### Column Mapping Verification:
Your Excel headers should map like this:
```
TechnologyType    → technology_type (category)
Region            → region (category)
State             → state (category)
PlantName         → plant_name (string)
TimePeriod        → time_period (datetime)
DAMPrice          → dam_price (float)
RTMPrice          → rtm_price (float)
ScheduledMW       → scheduled_mw (float)
ModelResultsMW    → model_results_mw (float)
```

---

## 🎯 Test 5: One-Click Plot & Chart Suggestions (5 min)

### Prerequisites:
- Excel file must be uploaded AND processed first

### Steps:
1. After processing, look for **"One-Click Plot"** or **"Auto Plot"** button
2. Click it
3. Wait for chart suggestions to appear

### Expected Results:
- ✅ **Multiple chart suggestions** appear
- ✅ Each suggestion shows:
  - Chart type (Line, Bar, Scatter, Pie)
  - Recommended axes
  - Confidence score
  - Preview option

### Suggestion Types You Should See:
```
[ ] Time Series (Line Chart)
    - TimePeriod vs DAMPrice
    - TimePeriod vs RTMPrice
    - TimePeriod vs ScheduledMW

[ ] Bar Charts
    - Region vs Total Generation
    - TechnologyType vs Capacity

[ ] Scatter Plot (if 2+ numeric columns)
    - DAMPrice vs RTMPrice
    - ScheduledMW vs ModelResultsMW
```

---

## 📈 Test 6: Data Visualization & Chart Accuracy (8 min)

### Steps:
1. Navigate to **RMO** page
2. Navigate to **DMO** page
3. Navigate back to **Home** page

### RMO Page Checks:
```
[ ] RMO Price Chart displays
    - Shows DAM, GDAM, RTM prices over time
    - Line chart with 3 lines
    - Legend identifies each price type
    
[ ] RMO Schedule Chart displays
    - Bar chart comparing Scheduled vs Actual MW
    - Two bars per time period
    
[ ] RMO Optimization Chart displays
    - Shows optimization results
    - Multiple data series
```

### DMO Page Checks:
```
[ ] Generator Scheduling Chart loads
[ ] Contract Scheduling Chart loads
[ ] Market Bidding Chart loads
[ ] All charts have data (not empty)
[ ] Axes are labeled correctly
[ ] Tooltips work on hover
```

### Home Page KPIs:
```
[ ] Total Generation MW is displayed
[ ] Total Capacity MW is displayed
[ ] Total Demand MW is displayed
[ ] Additional KPIs show realistic numbers
[ ] No NaN or undefined values
[ ] Numbers update when data changes
```

---

## 🔘 Test 7: All Buttons & Interactions (10 min)

### Top Bar / Header:
```
[ ] Notification bell icon (if present)
[ ] Settings/config icon
[ ] User profile/avatar
[ ] Search functionality (if present)
```

### Sidebar:
```
[ ] All navigation items clickable
[ ] Active state highlights current page
[ ] Smooth transitions between pages
[ ] No 404 errors
```

### Dashboard Controls:
```
[ ] Filter dropdown opens
[ ] Date range picker works
[ ] Region selector updates data
[ ] Technology type filter applies
[ ] Clear filters button works
```

### Data Upload:
```
[ ] Upload button opens file dialog
[ ] Cancel button works
[ ] Process button triggers processing
[ ] Download/Export buttons generate files
```

### Chart Interactions:
```
[ ] Hover tooltips appear on charts
[ ] Chart legends are clickable (toggle series)
[ ] Zoom/pan works (if applicable)
[ ] Export chart button (if present)
```

### Optimization:
```
[ ] "Trigger Optimization" button
[ ] "Run Model" button
[ ] "View Archives" link/button
[ ] All optimization controls respond
```

---

## 🔗 Test 8: Python Optimization Model Integration (15 min)

### Prerequisites:
- Python 3.x installed
- `requests` library: `pip install requests`

### Steps:
1. Open PowerShell in project directory
2. Run: `python optimization_model.py`
3. Observe console output
4. Check generated files

### Expected Output:
```
============================================================
Starting Optimization Model Execution
============================================================
Initialized Optimization Model: RMO_20251001_XXXXXX
Connected to database: ./prisma/dev.db
Fetched X records from database
Running optimization algorithm...
Optimization complete. Generated X results
Calculating accuracy metrics...
Saving results to database...
Logging to dashboard system...
============================================================
EXECUTION SUMMARY
============================================================
Model ID: RMO_20251001_XXXXXX
Records Processed: X
Average Accuracy: XX.X%
Total Revenue Impact: ₹X,XXX,XXX.XX
Average Improvement: XX.X MW
============================================================
```

### Verification Checklist:
```
[ ] Script runs without errors
[ ] Database connection succeeds
[ ] Market data is fetched (count > 0)
[ ] Optimization completes
[ ] Results are saved to database
[ ] JSON summary file is created
[ ] Log file is created (optimization_model.log)
[ ] Accuracy metrics are calculated
[ ] API logging attempt is made (check server logs)
```

### Files Generated:
```
[ ] optimization_model.log - Execution log
[ ] optimization_summary_RMO_XXXXXX.json - Results summary
```

### Database Verification:
Run this query to check results:
```sql
SELECT * FROM OptimizationResults 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🔍 Test 9: Archives & Historical Data (5 min)

### Steps:
1. Navigate to **Archives** page
2. Look for optimization run history
3. Check if Python model runs appear

### Expected Results:
```
[ ] Archives page loads
[ ] Table/list of optimization runs
[ ] Each run shows:
    - Model ID
    - Timestamp
    - Records processed
    - Accuracy score
    - Status (Complete/Running/Failed)
[ ] Recent runs appear at top
[ ] Can click to view details
```

---

## 📱 Test 10: Responsive Design (Optional, 5 min)

### Steps:
1. Press F12 to open DevTools
2. Click responsive design mode (Ctrl+Shift+M)
3. Test different screen sizes

### Screen Sizes to Test:
```
[ ] Desktop (1920x1080) - Full layout
[ ] Laptop (1366x768) - Compact layout
[ ] Tablet (768x1024) - Sidebar collapses
[ ] Mobile (375x667) - Mobile menu
```

---

## ⚡ Quick Issue Resolution

### Issue: Server not responding
```bash
# Check if server is running
Get-Process node

# If not running, restart
npx tsx server.ts
```

### Issue: Excel upload fails
```
1. Close RMO_sample.xlsx in Excel
2. Make sure file is not corrupted
3. Try uploading a CSV instead
4. Check browser console for errors (F12)
```

### Issue: Charts not loading
```
1. Refresh page (Ctrl+F5)
2. Check browser console for errors
3. Verify data was uploaded successfully
4. Check if API endpoints are responding
```

### Issue: Dark theme not visible
```
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Check if CSS file loaded (Network tab in DevTools)
4. Verify `className="dark"` in HTML element
```

---

## 📊 Performance Benchmarks

### Load Times (Target):
- Initial page load: < 5 seconds
- Page navigation: < 500ms
- Chart rendering: < 1 second
- API calls: < 200ms
- File upload: < 3 seconds (for small files)

### Browser Support:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (MacOS)
- ⚠️ IE11 (Not supported)

---

## ✅ Final Checklist

### Critical Features:
```
[ ] Dashboard loads successfully
[ ] Dark theme is visible throughout
[ ] Transmission page is NOT in menu
[ ] Enhanced Analytics page has 4 tabs
[ ] Excel upload works
[ ] Column mapping is intelligent
[ ] One-click plot generates suggestions
[ ] Charts display data correctly
[ ] Python model runs successfully
[ ] All navigation items work
```

### Nice-to-Have Features:
```
[ ] Smooth animations
[ ] Hover effects work
[ ] Responsive on mobile
[ ] Export functions work
[ ] Filters apply correctly
[ ] Real-time updates (if implemented)
```

---

## 🎯 Success Criteria

**✅ PASS** if:
- 90%+ of critical features work
- Dark theme is fully visible
- Excel upload completes successfully
- Charts render with data
- No critical errors in console

**⚠️ REVIEW** if:
- 70-89% of features work
- Minor visual issues
- Some charts don't load
- Performance is slow

**❌ FAIL** if:
- < 70% of features work
- Page doesn't load
- Dark theme not visible
- Excel upload completely fails
- Critical console errors

---

## 📞 Support & Documentation

- **Excel Upload Guide**: `EXCEL_UPLOAD_GUIDE.md`
- **Test Results**: `TEST_RESULTS.md`
- **Optimization Model**: `optimization_model.py`
- **API Testing**: `test-e2e.ps1`

---

**Testing Duration**: ~60 minutes for complete validation  
**Recommended Frequency**: Before each deployment  
**Last Updated**: October 1, 2025
