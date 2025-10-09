# Energy Ops Dashboard - Complete Implementation Guide

## 🎯 Overview

This guide documents the complete implementation of the **Energy Operations Dashboard** featuring integrated Sandbox-backed analytics platform. The system now supports:

### Core Features
- ✅ Excel file upload with dynamic data source management
- ✅ Python-based optimization using PuLP solver
- ✅ Real-time optimization results visualization
- ✅ Comprehensive chart analysis for RMO data
- ✅ Fixed Next.js 15 compatibility issues
- ✅ Fixed SQLite query issues

### High-Priority Features (Recently Implemented)
- ✅ Login page title updated to "OptiBid"
- ✅ One-click plot from Sandbox to all dashboards (DMO, RMO, SO)
- ✅ All dashboards connected to Sandbox data sources
- ⚠️ Dynamic filters based on Excel headers (API complete, UI integration pending)
- ❌ Python script upload and live execution (planned)
- ⚠️ Dashboard refresh to sync with Sandbox (needs enhancement)

---

## 📁 Project Structure

```
Energy-Ops-Dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── optimize/
│   │   │   │   ├── run/route.ts          # Triggers Python optimization
│   │   │   │   └── results/route.ts      # Fetches optimization results
│   │   │   ├── data-sources/             # Data source management APIs
│   │   │   └── ...
│   │   └── page.tsx                      # Main dashboard (Sandbox renamed)
│   └── components/
│       ├── rmo-optimization-charts.tsx   # RMO-specific charts
│       ├── data-source-manager.tsx       # File upload & DB connection
│       └── ...
├── prisma/
│   └── schema.prisma                     # Database schema with OptimizationResult model
├── optimization_runner.py                # Python optimization script
├── requirements.txt                      # Python dependencies
└── IMPLEMENTATION_GUIDE.md               # This file
```

---

## 🔧 Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Required packages:**
- pandas >= 2.0.0
- numpy >= 1.24.0
- PuLP >= 2.7.0

### 2. Verify Installation

Check if optimization is ready:
```bash
GET http://localhost:3000/api/optimize/run
```

Response will indicate:
- Python availability
- PuLP availability
- Optimization readiness

### 3. Database Migration

The Prisma schema has been updated. If you need to reset:

```bash
npm run db:push
```

---

## 📊 Data Structure

### Required Excel Columns

Your Excel file must contain these columns (case-insensitive):

| Column Name | Type | Description |
|------------|------|-------------|
| `TechnologyType` | String | Technology (e.g., "Thermal", "Solar") |
| `Region` | String | Geographic region |
| `State` | String | State name |
| `ContractType` | String | Contract type |
| `PlantName` | String | Power plant identifier |
| `ContractName` | String | Contract identifier |
| `TimePeriod` | DateTime/Number | Excel serial date or timestamp |
| `TimeBlock` | Integer | Time block number (1-96) |
| `DAMPrice` | Float | Day-Ahead Market price (₹/MWh) |
| `GDAMPrice` | Float | Green DAM price (₹/MWh) |
| `RTMPrice` | Float | Real-Time Market price (₹/MWh) |
| `ScheduledMW` | Float | Scheduled generation (MW) |
| `ModelResultsMW` | Float | Previous model results (MW) |
| `ModelID` | String | Model run identifier |
| `ModelTriggerTime` | DateTime/Number | When model was triggered |

### Sample Data

See `RMO_sample.xlsx` for a complete example with 192 rows of thermal generation data.

---

## 🚀 Usage Workflow

### Step 1: Upload Data to Sandbox

1. Navigate to **Sandbox** module (previously "Data Sources")
2. Click **Upload File** or drag-and-drop Excel file
3. Select the sheet containing your data
4. Map columns using the **Header Mapper**
5. Confirm the data source is "ready"

### Step 2: Run Optimization

1. After upload, click **Run Optimization** button
2. System will:
   - Read data from SQLite table
   - Convert to pandas DataFrame
   - Build optimization model using PuLP
   - Solve using CBC solver
   - Save results to `OptimizationResult` table
3. Wait for completion (typically < 5 seconds for 192 rows)

### Step 3: View Results

The RMO Optimization Charts component displays:

#### **Metrics Summary**
- Total Results count
- Total Scheduled MW
- Total Optimized MW
- Average Solve Time
- Success Rate

#### **Price Comparison Chart**
- Line chart showing DAM, GDAM, RTM prices across time blocks
- Identifies price arbitrage opportunities

#### **Schedule vs Optimized Chart**
- Bar chart comparing scheduled vs optimized generation
- Line overlay showing the difference

#### **Technology Mix Chart**
- Horizontal bar chart of generation by technology type
- Based on optimized results

#### **Regional Distribution Chart**
- Compares scheduled vs optimized by region
- Identifies regional optimization patterns

---

## 🔬 Optimization Model Details

### Objective Function

```python
Minimize: Σ (DAMPrice[plant, timeblock] * Generation[plant, timeblock])
```

The model minimizes total generation cost based on DAM prices.

### Decision Variables

```python
Generation[plant, timeblock] >= 0  # MW for each plant at each time block
```

### Constraints

1. **Capacity Constraints**
   ```python
   Generation[plant, timeblock] <= ScheduledMW[plant, timeblock] * 1.2
   ```
   - Allows up to 20% over-scheduling

2. **Demand Constraints**
   ```python
   Σ Generation[plant, timeblock] >= TotalDemand[timeblock] * 0.8
   ```
   - Ensures at least 80% of total demand is met

### Solver

- **Default**: CBC (Coin-or Branch and Cut)
- **Commercial alternatives**: Gurobi, CPLEX (requires license)
- **Timeout**: 5 minutes max

---

## 📡 API Endpoints

### POST /api/optimize/run

Triggers optimization for a data source.

**Request:**
```json
{
  "data_source_id": "cmg6zrneq0000to1o95mlh78g"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model_id": "RMO_20250930_202648",
    "status": "success",
    "objective_value": 1245678.45,
    "solve_time_ms": 1234,
    "results_count": 192
  }
}
```

### GET /api/optimize/results

Fetches optimization results with optional filters.

**Query Parameters:**
- `data_source_id`: Filter by data source
- `model_id`: Filter by specific model run
- `plant_name`: Filter by plant
- `region`: Filter by region
- `state`: Filter by state
- `technology_type`: Filter by technology
- `time_block`: Filter by time block
- `status`: Filter by optimization status
- `limit`: Max results (default: 1000)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "filterOptions": {
      "modelIds": ["RMO_20250930_202648"],
      "plantNames": ["thermal_unit_1", ...],
      "regions": ["Western", ...],
      ...
    },
    "metrics": {
      "totalResults": 192,
      "totalScheduledMW": 12345.67,
      "totalOptimizedMW": 12456.78,
      "averageObjectiveValue": 1245678.45,
      "averageSolveTime": 1234,
      "successRate": 100
    },
    "count": 192
  }
}
```

### DELETE /api/optimize/results

Deletes optimization results.

**Request:**
```json
{
  "model_id": "RMO_20250930_202648"  // or "data_source_id"
}
```

---

## 🐛 Bug Fixes Implemented

### 1. Next.js 15 API Route Parameters

**Issue:** Routes using `params.id` without awaiting caused errors.

**Fixed in:**
- `src/app/api/data-sources/[id]/select-sheet/route.ts`
- `src/app/api/data-sources/[id]/schema/route.ts`

**Solution:**
```typescript
// Before
const dataSourceId = params.id

// After
const { id: dataSourceId } = await params
```

### 2. SQLite Case-Insensitive Queries

**Issue:** SQLite doesn't support `mode: 'insensitive'` parameter.

**Fixed in:**
- `src/app/api/storage/data/route.ts`
- `src/app/api/filters/dynamic/route.ts`

**Solution:**
```typescript
// Before
{ technology_type: { contains: 'storage', mode: 'insensitive' } }

// After
OR: [
  { technology_type: { contains: 'Storage' } },
  { technology_type: { contains: 'storage' } }
]
```

---

## 📈 Performance Considerations

### Optimization Speed

- **Small datasets (< 500 rows)**: < 1 second
- **Medium datasets (500-2000 rows)**: 1-5 seconds
- **Large datasets (2000-10000 rows)**: 5-60 seconds
- **Very large datasets (> 10000 rows)**: May hit 5-minute timeout

### Recommendations

1. **Batch processing**: For very large datasets, split into multiple runs
2. **Indexing**: Database indexes are already configured for optimal query performance
3. **Caching**: Consider caching recent optimization results
4. **Async processing**: For production, implement job queue (Bull, BullMQ)

---

## 🔐 Security Considerations

1. **SQL Injection**: All queries use Prisma ORM (parameterized)
2. **File Upload**: Validate file type and size (already implemented)
3. **Python Execution**: Runs in isolated process with timeout
4. **API Authentication**: Consider adding JWT/API key auth for production

---

## 🔥 HIGH-PRIORITY FEATURES STATUS

### ✅ 1. Login Page Title Fix
**Status**: COMPLETE  
**File**: `src/app/auth/signin/page.tsx`  
**Change**: Updated from "OptiBid Dashboard" to "OptiBid"

### ✅ 2. One-Click Plot from Sandbox to All Dashboards
**Status**: COMPLETE  
**Files**:
- `src/app/api/sandbox/generate-all-charts/route.ts` (NEW)
- `src/components/sandbox-enhanced.tsx` (MODIFIED)

**How It Works**:
1. User uploads Excel file in Sandbox
2. User selects the uploaded data source
3. User clicks "One-Click Plot for All Dashboards"
4. System analyzes columns and automatically creates:
   - **DMO Charts**: Generation by Technology, Generation Over Time
   - **RMO Charts**: Market Prices, Revenue by Plant
   - **SO Charts**: Generation by Region, Regional Comparison
5. Auto-redirects to DMO dashboard to view charts

**Testing**:
```bash
# Navigate to http://localhost:3000/sandbox
# Upload results_long_df.xlsx or similar
# Click "One-Click Plot for All Dashboards"
# Verify charts appear on /dmo, /rmo, /so pages
```

### ✅ 3. All Dashboards Connected to Sandbox Data
**Status**: COMPLETE  
**Implementation**: All dashboard APIs use dynamic data source queries:
- `fetchDMOGeneratorData()` - DMO dashboard data
- `fetchMarketBiddingData()` - RMO dashboard data
- Charts reference uploaded Excel data sources

### ⚠️ 4. Dynamic Filters from Excel Headers
**Status**: PARTIALLY COMPLETE  
**What's Done**:
- `/api/dmo/filters` endpoint exists and returns unique column values
- Backend properly extracts filters from uploaded data

**What's Remaining**:
- Connect filter UI to the API
- Dynamically render filter dropdowns on DMO/RMO/SO pages
- Apply filter values to chart queries

**Implementation Steps**:
```typescript
// In src/app/dmo/page.tsx or similar dashboard pages

// 1. Fetch filters on component mount
const [filters, setFilters] = useState({});
const [availableFilters, setAvailableFilters] = useState(null);

useEffect(() => {
  fetch('/api/dmo/filters?type=all')
    .then(res => res.json())
    .then(data => {
      setAvailableFilters(data.filters);
      // Example response:
      // {
      //   technologyTypes: ['Solar', 'Thermal', 'Hydro'],
      //   regions: ['North', 'South', 'East', 'West'],
      //   plantNames: ['Plant A', 'Plant B']
      // }
    });
}, []);

// 2. Render filter UI
{availableFilters?.technologyTypes && (
  <Select 
    onValueChange={(value) => {
      setFilters(prev => ({ ...prev, technologyType: value }));
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select Technology" />
    </SelectTrigger>
    <SelectContent>
      {availableFilters.technologyTypes.map(tech => (
        <SelectItem key={tech} value={tech}>{tech}</SelectItem>
      ))}
    </SelectContent>
  </Select>
)}

// 3. Apply filters to chart data fetching
const fetchChartData = () => {
  const params = new URLSearchParams(filters);
  fetch(`/api/dmo/generator-scheduling?${params}`)
    .then(res => res.json())
    .then(data => updateCharts(data));
};

useEffect(() => {
  fetchChartData();
}, [filters]);
```

### ❌ 5. Python Script Upload and Live Execution
**Status**: NOT STARTED (HIGH PRIORITY)  

**Requirements**:
- Upload `.py` files in Sandbox
- "Run Script" button to execute Python code
- Live streaming of stdout/stderr (console logs)
- Persist execution logs to database
- View run history via notifications panel

**Proposed Database Schema**:
```prisma
model ScriptRun {
  id            String   @id @default(cuid())
  file_name     String
  file_path     String
  status        String   // 'running', 'completed', 'failed', 'timeout'
  stdout        String   @default("")
  stderr        String   @default("")
  exit_code     Int?
  started_at    DateTime @default(now())
  completed_at  DateTime?
  created_by    String?  // User ID if auth is implemented
  
  @@index([status])
  @@index([started_at])
  @@map("ScriptRun")
}
```

**API Endpoints to Create**:

#### POST /api/sandbox/upload-script
```typescript
// Upload .py file and save to uploads/scripts/ directory
// Return { success, script_id, file_name }
```

#### POST /api/sandbox/run-script
```typescript
import { spawn } from 'child_process';
import { NextRequest } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  const { script_id, file_path } = await req.json();
  
  // Create script run record
  const run = await db.scriptRun.create({
    data: {
      file_name: path.basename(file_path),
      file_path,
      status: 'running'
    }
  });
  
  // Execute Python script
  const python = spawn('python', [file_path]);
  
  let stdoutData = '';
  let stderrData = '';
  
  python.stdout.on('data', async (data) => {
    const output = data.toString();
    stdoutData += output;
    
    // Update database
    await db.scriptRun.update({
      where: { id: run.id },
      data: { stdout: stdoutData }
    });
    
    // Emit via WebSocket for live streaming
    io.emit('script:output', {
      run_id: run.id,
      type: 'stdout',
      output
    });
  });
  
  python.stderr.on('data', async (data) => {
    const output = data.toString();
    stderrData += output;
    
    await db.scriptRun.update({
      where: { id: run.id },
      data: { stderr: stderrData }
    });
    
    io.emit('script:output', {
      run_id: run.id,
      type: 'stderr',
      output
    });
  });
  
  python.on('close', async (code) => {
    await db.scriptRun.update({
      where: { id: run.id },
      data: {
        status: code === 0 ? 'completed' : 'failed',
        exit_code: code,
        completed_at: new Date()
      }
    });
    
    io.emit('script:complete', {
      run_id: run.id,
      exit_code: code
    });
  });
  
  return Response.json({ success: true, run_id: run.id });
}
```

#### GET /api/sandbox/script-runs
```typescript
// List all script runs with pagination
// Query params: limit, offset, status
// Return: { runs: [...], total, page }
```

#### GET /api/sandbox/script-runs/[id]/logs
```typescript
// Get full logs for a specific run
// Return: { run_id, stdout, stderr, status, timestamps }
```

**Frontend Components**:

**Script Upload Section** (add to `sandbox-enhanced.tsx`):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Python Script Execution</CardTitle>
    <CardDescription>
      Upload and execute Python scripts with live output streaming
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <Input 
        type="file" 
        accept=".py" 
        onChange={handleScriptUpload}
        disabled={isUploading}
      />
      {uploadedScript && (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm">{uploadedScript.name}</span>
          <Button 
            onClick={handleRunScript}
            disabled={isRunning}
          >
            <Play className="h-4 w-4 mr-2" />
            Run Script
          </Button>
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

**Live Log Modal**:
```tsx
<Dialog open={showLogs} onOpenChange={setShowLogs}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>
        Script Execution - {scriptName}
        <Badge variant={status === 'running' ? 'default' : 'success'}>
          {status}
        </Badge>
      </DialogTitle>
    </DialogHeader>
    <div className="bg-black text-green-400 p-4 font-mono text-sm overflow-auto max-h-96 rounded">
      {logs.map((line, i) => (
        <div key={i} className={line.type === 'stderr' ? 'text-red-400' : ''}>
          {line.output}
        </div>
      ))}
      {isRunning && (
        <div className="animate-pulse">▶ Running...</div>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowLogs(false)}>
        Close
      </Button>
      <Button onClick={downloadLogs}>
        <Download className="h-4 w-4 mr-2" />
        Download Logs
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**WebSocket Client** (add to frontend):
```typescript
import { io } from 'socket.io-client';

const socket = io();

socket.on('script:output', (data) => {
  setLogs(prev => [...prev, { type: data.type, output: data.output }]);
});

socket.on('script:complete', (data) => {
  setIsRunning(false);
  setStatus(data.exit_code === 0 ? 'completed' : 'failed');
  toast.success('Script execution completed');
});
```

### ⚠️ 6. Dashboard Refresh to Sync with Sandbox
**Status**: NEEDS ENHANCEMENT  

**Current State**:
- Dashboards have refresh buttons
- Need to explicitly re-fetch from uploaded Excel data

**Enhancement Needed**:
```typescript
// In dashboard pages (DMO, RMO, SO)

const handleRefresh = async () => {
  setIsRefreshing(true);
  
  try {
    // Clear any cached data
    localStorage.removeItem('dashboard_cache');
    
    // Re-fetch filters
    await refetchFilters();
    
    // Re-fetch all chart data
    await Promise.all([
      refetchGeneratorData(),
      refetchMarketData(),
      refetchOptimizationResults()
    ]);
    
    toast.success('Dashboard refreshed with latest Sandbox data');
  } catch (error) {
    toast.error('Failed to refresh dashboard');
  } finally {
    setIsRefreshing(false);
  }
};

// Optional: Auto-refresh polling
useEffect(() => {
  const interval = setInterval(() => {
    // Check if data source was updated
    fetch('/api/data-sources/latest-update')
      .then(res => res.json())
      .then(data => {
        if (data.updated_at > lastRefreshTime) {
          toast.info('New data available. Refreshing...');
          handleRefresh();
        }
      });
  }, 30000); // Check every 30 seconds
  
  return () => clearInterval(interval);
}, [lastRefreshTime]);
```

---

## 🎯 TESTING ACCEPTANCE CRITERIA

### ✅ Criterion 1: One-Click Plot
- [x] Upload Excel file in Sandbox
- [x] Select uploaded data source from dropdown
- [x] Click "One-Click Plot for All Dashboards" button
- [x] DMO/RMO/SO pages automatically populate with charts
- [x] No "No Data Available" messages on dashboards
- [x] Auto-redirect to DMO dashboard after chart creation

### ⚠️ Criterion 2: Dynamic Filters
- [x] API `/api/dmo/filters` returns unique values from uploaded data
- [ ] Filter dropdowns display on DMO/RMO/SO dashboards
- [ ] Filters dynamically populate based on Excel column headers
- [ ] Applying filters updates charts in real-time
- [ ] Filter state persists across page refreshes
**Action Required**: Connect filter UI to API

### ❌ Criterion 3: Python Script Execution
- [ ] Upload .py file via Sandbox interface
- [ ] Click "Run Script" button
- [ ] Live log modal opens showing stdout/stderr
- [ ] Logs stream in real-time during execution
- [ ] Execution status updates (running → completed/failed)
- [ ] Logs saved to database and accessible via API
- [ ] Run history visible in notifications panel
**Action Required**: Full feature implementation

### ✅ Criterion 4: Login Title
- [x] Login page displays "OptiBid" (not "OptiBid Dashboard")
- [x] Title styling matches design requirements

### ⚠️ Criterion 5: Dashboard Refresh
- [x] Refresh button present on all dashboards
- [ ] Clicking refresh re-reads latest Sandbox data
- [ ] Charts update immediately after refresh
- [ ] Loading state displays during refresh
- [ ] Success/error notifications appear
**Action Required**: Enhance refresh logic

---

## 📄 QUICK START FOR REMAINING FEATURES

### To Implement Dynamic Filters:
1. Open dashboard pages: `src/app/dmo/page.tsx`, `src/app/rmo/page.tsx`, `src/app/so/page.tsx`
2. Add filter state management (useState, useEffect)
3. Fetch filters from `/api/dmo/filters?type=all`
4. Render `<Select>` components for each filter category
5. Apply filter values to chart data API calls
6. Test with uploaded Excel file containing multiple technologies/regions

### To Implement Python Script Execution:
1. Add `ScriptRun` model to `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Create `/api/sandbox/upload-script` endpoint
4. Create `/api/sandbox/run-script` endpoint with `child_process.spawn`
5. Add WebSocket event handlers for live log streaming
6. Build frontend components:
   - Script upload input
   - Run button
   - Live log modal
7. Connect Socket.IO for real-time updates
8. Test with sample Python scripts

### To Enhance Dashboard Refresh:
1. Locate refresh handlers in dashboard pages
2. Add logic to clear caches and re-fetch from Sandbox data
3. Add loading states with skeleton loaders
4. Implement success/error notifications
5. Optionally add auto-refresh polling
6. Test refresh after uploading new Excel files

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Upload RMO_sample.xlsx to Sandbox
- [ ] Select sheet "all_generator_all_demand"
- [ ] Verify 192 rows imported
- [ ] Run optimization
- [ ] Check optimization completes successfully
- [ ] Verify charts display correctly
- [ ] Filter by plant name
- [ ] Filter by model run
- [ ] Export results (if implemented)

### API Testing

```bash
# Check optimization availability
curl http://localhost:3000/api/optimize/run

# Run optimization
curl -X POST http://localhost:3000/api/optimize/run \
  -H "Content-Type: application/json" \
  -d '{"data_source_id":"YOUR_DATA_SOURCE_ID"}'

# Get results
curl "http://localhost:3000/api/optimize/results?data_source_id=YOUR_DATA_SOURCE_ID"
```

---

## 📝 Database Schema

### OptimizationResult Model

```prisma
model OptimizationResult {
  id                  String   @id @default(cuid())
  data_source_id      String
  model_id            String
  model_trigger_time  DateTime
  time_period         DateTime
  time_block          Int
  technology_type     String
  region              String
  state               String
  contract_type       String?
  plant_name          String
  contract_name       String?
  dam_price           Float?
  gdam_price          Float?
  rtm_price           Float?
  scheduled_mw        Float?
  model_results_mw    Float?
  optimization_status String
  solver_time_ms      Int?
  objective_value     Float?
  created_at          DateTime @default(now())
  
  @@index([data_source_id])
  @@index([model_id])
  @@index([time_period])
  @@index([plant_name])
  @@index([optimization_status])
}
```

---

## 🚧 Future Enhancements

1. **Advanced Solvers**
   - Integrate Gurobi for faster solving
   - Add support for CPLEX
   - Implement custom heuristics

2. **Multi-objective Optimization**
   - Cost minimization
   - Emission reduction
   - Reliability maximization

3. **Constraints**
   - Ramping constraints
   - Minimum up/down time
   - Unit commitment

4. **Forecasting Integration**
   - Price forecasting
   - Demand forecasting
   - Renewable generation forecasting

5. **Real-time Updates**
   - WebSocket integration for live optimization status
   - Progress bars during solving
   - Live chart updates

6. **Export Capabilities**
   - Export results to Excel/CSV
   - Generate PDF reports
   - Schedule automated reports

---

## 🤝 Support

For issues or questions:
1. Check this guide first
2. Review console logs for errors
3. Verify Python and dependencies are installed
4. Check database connectivity

---

## 📄 License

[Your License Here]

---

**Last Updated:** September 30, 2025
**Version:** 1.0.0
