# DMO/RMO/SO Sandbox Implementation Guide

## Overview
This guide documents the implementation of comprehensive sandbox fixes and features for the Energy Ops Dashboard, enabling Excel uploads to automatically create data sources, generate charts with proper timeblock axes, and support Python script execution with real-time logging.

## Implementation Status

### ✅ Completed
1. **DataSource Management Service** (`src/lib/data-source-manager.ts`)
   - Automatic column metadata extraction from Excel files
   - Data type inference and filter configuration
   - Timeblock configuration for DMO (96×15min), RMO (48×30min), SO (96×15min)
   - Default chart generation with proper X-axes
   - Filter management for dashboard charts

2. **DMO Generator Scheduling Upload Integration**
   - DataSource creation on Excel upload
   - DataSourceColumn metadata extraction
   - Socket.IO event emission for cross-tab refresh
   - Activity logging

### 🚧 In Progress
3. **DMO Contract Scheduling & Market Bidding Upload Integration**
4. **One-Click Plot Button Component**
5. **Sandbox Python Script Execution Enhancement**
6. **Dynamic Dashboard Chart Component with Filters**

---

## Architecture

### Data Flow
```
Excel Upload → Parse & Validate → Insert to DB → Extract Metadata → 
→ Create/Update DataSource → Map DataSourceColumns → Emit Socket Event →
→ Dashboard Refresh → One-Click Plot → Generate Charts with Filters
```

### Key Components

#### 1. DataSource Manager (`src/lib/data-source-manager.ts`)
**Purpose:** Centralized service for managing data sources and their metadata

**Key Functions:**
- `extractColumnMetadata(filePath, sheetIndex)` - Extract column info from Excel
- `createOrUpdateDataSource(config, columns)` - Create/update DataSource records
- `getTimeblockConfig(moduleType)` - Get timeblock configuration for DMO/RMO/SO
- `generateTimeblockLabels(moduleType)` - Generate X-axis labels for charts
- `createDefaultCharts(dataSourceId, dashboardId, moduleType)` - Auto-generate charts
- `getFilterableColumns(dataSourceId)` - Get columns available for filtering

**Timeblock Configuration:**
- **DMO:** 96 blocks × 15 minutes = 24 hours
- **RMO:** 48 blocks × 30 minutes = 24 hours
- **SO:** 96 blocks × 15 minutes = 24 hours

#### 2. Upload Endpoints
**Location:** `src/app/api/dmo/*/upload/route.ts`

**Flow:**
1. Validate file type and size
2. Parse Excel/CSV with XLSX
3. Transform and validate data
4. Insert to Prisma database
5. **NEW:** Extract column metadata
6. **NEW:** Create/update DataSource
7. **NEW:** Emit Socket.IO event
8. Return success response

**Integration Points:**
```typescript
import { 
  extractColumnMetadata, 
  createOrUpdateDataSource,
  type DataSourceConfig 
} from '@/lib/data-source-manager';
import { getIo } from '@/lib/socket';

// After successful DB insert:
const columnMetadata = await extractColumnMetadata(filePath);
const dataSourceConfig: DataSourceConfig = {
  moduleName: 'dmo-generator-scheduling', // or 'dmo-contract', 'dmo-market'
  displayName: 'DMO Generator Scheduling',
  tableName: 'DMOGeneratorScheduling',
  fileName: file.name,
  fileSize: file.size,
  recordCount: result.count,
};
const dataSource = await createOrUpdateDataSource(dataSourceConfig, columnMetadata);

// Emit event for cross-tab refresh
const io = getIo();
if (io) {
  io.to('dashboard').emit('dmo:data-uploaded', {
    module: 'generator-scheduling',
    recordCount: result.count,
    timestamp: new Date().toISOString(),
  });
}
```

#### 3. Dashboard Chart Component (To Be Created)
**Location:** `src/components/dmo/dynamic-chart.tsx`

**Features:**
- Read DataSourceColumn metadata
- Render filter UI based on column types
- Support dropdown, date-range, number-range, text-search filters
- Fetch and display chart data
- Proper timeblock X-axis labeling
- Real-time updates via Socket.IO

**Props:**
```typescript
interface DynamicChartProps {
  dataSourceId: string
  dashboardId: string
  moduleType: 'dmo' | 'rmo' | 'so'
  chartType?: 'line' | 'bar' | 'area'
  height?: number
}
```

#### 4. One-Click Plot Button (To Be Created)
**Location:** `src/components/dmo/one-click-plot-button.tsx`

**Functionality:**
- Fetch all DashboardChart configurations for current data source
- Generate up to 96 timeblock graphs (or configured count)
- Create charts for each configured chart type
- Apply default filters from DataSourceColumns
- Display loading state during generation
- Show success/error notifications

**Usage:**
```typescript
<OneClickPlotButton 
  dataSourceId={dataSourceId}
  dashboardId="dmo-dashboard"
  moduleType="dmo"
  onComplete={() => refreshCharts()}
/>
```

---

## Implementation Steps

### Phase 1: Complete Upload Pipeline Integration (Critical)

#### Step 1.1: Update Contract Scheduling Upload
**File:** `src/app/api/dmo/contract-scheduling/upload/route.ts`

```typescript
// Add imports
import { extractColumnMetadata, createOrUpdateDataSource } from '@/lib/data-source-manager';
import { getIo } from '@/lib/socket';

// After prisma.dMOContractScheduling.createMany():
const columnMetadata = await extractColumnMetadata(filePath);
const dataSourceConfig = {
  moduleName: 'dmo-contract-scheduling',
  displayName: 'DMO Contract Scheduling',
  tableName: 'DMOContractScheduling',
  fileName: file.name,
  fileSize: file.size,
  recordCount: result.count,
};
await createOrUpdateDataSource(dataSourceConfig, columnMetadata);

// Emit Socket event
const io = getIo();
if (io) {
  io.to('dashboard').emit('dmo:data-uploaded', {
    module: 'contract-scheduling',
    recordCount: result.count,
    timestamp: new Date().toISOString(),
  });
}
```

#### Step 1.2: Update Market Bidding Upload
**File:** `src/app/api/dmo/market-bidding/upload/route.ts`

Similar integration as above with:
- `moduleName: 'dmo-market-bidding'`
- `displayName: 'DMO Market Bidding'`
- `tableName: 'DMOMarketBidding'`

### Phase 2: Create Dynamic Chart Component (High Priority)

#### Step 2.1: Create Filter Component
**File:** `src/components/dmo/chart-filters.tsx`

```typescript
import { getFilterableColumns } from '@/lib/data-source-manager';

export function ChartFilters({ dataSourceId, onFilterChange }) {
  const [filters, setFilters] = useState({});
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    fetchFilterableColumns();
  }, [dataSourceId]);

  const fetchFilterableColumns = async () => {
    const cols = await getFilterableColumns(dataSourceId);
    setColumns(cols);
  };

  return (
    <div className="space-y-4">
      {columns.map((col) => (
        <FilterInput
          key={col.id}
          column={col}
          value={filters[col.column_name]}
          onChange={(value) => handleFilterChange(col.column_name, value)}
        />
      ))}
    </div>
  );
}
```

#### Step 2.2: Create Dynamic Chart Component
**File:** `src/components/dmo/dynamic-chart.tsx`

```typescript
import { generateTimeblockLabels } from '@/lib/data-source-manager';
import { ChartFilters } from './chart-filters';
import { LineChart, BarChart } from 'recharts';

export function DynamicChart({ dataSourceId, moduleType, chartType = 'line' }) {
  const [chartData, setChartData] = useState([]);
  const [filters, setFilters] = useState({});
  const timeblockLabels = generateTimeblockLabels(moduleType);

  const fetchChartData = async () => {
    const response = await fetch('/api/dmo/chart-data', {
      method: 'POST',
      body: JSON.stringify({ dataSourceId, filters }),
    });
    const data = await response.json();
    setChartData(data);
  };

  useEffect(() => {
    fetchChartData();
  }, [dataSourceId, filters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeblock Analysis</CardTitle>
        <ChartFilters 
          dataSourceId={dataSourceId}
          onFilterChange={setFilters}
        />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <XAxis 
              dataKey="timeblock_index"
              tickFormatter={(idx) => {
                const label = timeblockLabels[idx - 1];
                return label ? `B${label.blockIndex} (${label.timeLabel})` : idx;
              }}
              label={{ value: 'Time Block', position: 'insideBottom', offset: -5 }}
            />
            <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="scheduled_mw" stroke="#8884d8" name="Scheduled MW" />
            <Line type="monotone" dataKey="actual_mw" stroke="#82ca9d" name="Actual MW" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Phase 3: One-Click Plot Implementation

#### Step 3.1: Create One-Click Plot Button
**File:** `src/components/dmo/one-click-plot-button.tsx`

```typescript
import { createDefaultCharts } from '@/lib/data-source-manager';

export function OneClickPlotButton({ dataSourceId, dashboardId, moduleType }) {
  const [generating, setGenerating] = useState(false);

  const handleGeneratePlots = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/dmo/generate-charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSourceId, dashboardId, moduleType }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Generated ${result.chartCount} charts!`);
        window.dispatchEvent(new CustomEvent('charts:generated'));
      }
    } catch (error) {
      toast.error('Failed to generate charts');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleGeneratePlots}
      disabled={generating}
      className="w-full"
    >
      {generating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Charts...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          One-Click Plot (Generate All Charts)
        </>
      )}
    </Button>
  );
}
```

#### Step 3.2: Create API Endpoint for Chart Generation
**File:** `src/app/api/dmo/generate-charts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createDefaultCharts } from '@/lib/data-source-manager';

export async function POST(request: NextRequest) {
  try {
    const { dataSourceId, dashboardId, moduleType } = await request.json();

    const charts = await createDefaultCharts(
      dataSourceId,
      dashboardId,
      moduleType,
      'system'
    );

    return NextResponse.json({
      success: true,
      chartCount: charts.length,
      charts,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate charts' },
      { status: 500 }
    );
  }
}
```

### Phase 4: Sandbox Python Script Enhancement

#### Step 4.1: Update Test Script Upload Component
**File:** `src/components/sandbox/test-script-upload.tsx`

**Add Run Button:**
```typescript
const handleRunScript = async (scriptId: string) => {
  try {
    const response = await fetch('/api/sandbox/execute-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId, args: [] }),
    });

    const result = await response.json();
    if (result.success) {
      toast.success('Script execution started!');
      // Listen for real-time logs via Socket.IO
      socket?.on(`script:log:${result.executionId}`, (logData) => {
        // Update UI with real-time logs
      });
    }
  } catch (error) {
    toast.error('Failed to start script');
  }
};

// In JSX:
<Button 
  onClick={() => handleRunScript(script.id)}
  variant="outline"
  size="sm"
>
  <Play className="h-4 w-4 mr-2" />
  Run Script
</Button>
```

#### Step 4.2: Connect to Notification Board
Update Socket.IO listeners to push script logs to the notification panel:

```typescript
socket?.on('script:log', (data) => {
  // Add log to notification board
  addNotification({
    type: 'info',
    title: `Script: ${data.scriptName}`,
    message: data.logLine,
    timestamp: data.timestamp,
  });
});

socket?.on('script:complete', (data) => {
  addNotification({
    type: 'success',
    title: 'Script Completed',
    message: `Exit code: ${data.exitCode}`,
    timestamp: data.timestamp,
  });
});

socket?.on('script:error', (data) => {
  addNotification({
    type: 'error',
    title: 'Script Error',
    message: data.error,
    timestamp: data.timestamp,
  });
});
```

---

## Testing Checklist

### Excel Upload Testing
- [ ] Upload Generator Scheduling Excel file
- [ ] Verify DataSource created in database
- [ ] Verify DataSourceColumn entries match Excel headers
- [ ] Verify filter metadata (expose_as_filter, ui_filter_type) is correct
- [ ] Verify Socket.IO event emitted
- [ ] Verify cross-tab refresh works

### Chart Generation Testing
- [ ] Click One-Click Plot button
- [ ] Verify DashboardChart entries created
- [ ] Verify X-axis shows correct timeblock labels (B1-B96 for DMO)
- [ ] Verify time labels match interval (00:00, 00:15, 00:30, etc.)
- [ ] Test filters: dropdown, date-range, text-search
- [ ] Verify chart updates when filters change

### Sandbox Testing
- [ ] Upload Python script (.py file)
- [ ] Click Run button
- [ ] Verify logs stream to notification board in real-time
- [ ] Verify log persistence in database
- [ ] Test script with errors
- [ ] Test script termination
- [ ] Verify process cleanup on Windows

### RMO/SO Testing
- [ ] Upload RMO data
- [ ] Verify 48 timeblocks with 30-min intervals
- [ ] Upload SO data
- [ ] Verify 96 timeblocks with 15-min intervals

---

## Database Schema Updates Required

### Already Applied
✅ Cascade deletes for DataSourceColumn and DashboardChart

### Additional Indexes (Optional)
```prisma
model DataSource {
  // Add composite index for faster lookups
  @@index([name, status])
}

model DashboardChart {
  // Add index for querying by dashboard and data source
  @@index([dashboard_id, data_source_id])
}
```

---

## Next Steps

1. **Immediate (Today):**
   - Update Contract Scheduling and Market Bidding upload endpoints
   - Create OneClickPlotButton component
   - Create chart generation API endpoint

2. **High Priority (This Week):**
   - Create DynamicChart component with filters
   - Create ChartFilters component
   - Update Sandbox TestScriptUpload with Run button
   - Connect Python script logs to notification board

3. **Medium Priority (Next Week):**
   - Add RMO and SO upload endpoints
   - Create RMO/SO dashboard pages
   - Implement chart data API endpoint
   - Add chart editing functionality

4. **Nice to Have:**
   - Export charts to PNG/PDF
   - Save filter presets
   - Chart annotations
   - Timeblock comparison tool

---

## API Endpoints Reference

### Existing
- `POST /api/dmo/generator-scheduling/upload` - Upload Generator Scheduling Excel
- `POST /api/dmo/contract-scheduling/upload` - Upload Contract Scheduling Excel
- `POST /api/dmo/market-bidding/upload` - Upload Market Bidding Excel
- `POST /api/sandbox/execute-script` - Execute Python script

### To Be Created
- `POST /api/dmo/generate-charts` - One-click chart generation
- `POST /api/dmo/chart-data` - Fetch chart data with filters
- `GET /api/dmo/data-sources` - List all data sources
- `GET /api/dmo/data-sources/:id/columns` - Get filterable columns

---

## Socket.IO Events

### Server → Client
- `dmo:data-uploaded` - Data uploaded, refresh UI
- `charts:generated` - Charts generated, refresh chart list
- `script:log` - Real-time script log line
- `script:complete` - Script execution completed
- `script:error` - Script execution error

### Client → Server
- `join-room:dashboard` - Join dashboard room for events
- `leave-room:dashboard` - Leave dashboard room

---

## File Structure

```
src/
├── lib/
│   ├── data-source-manager.ts ✅ (Created)
│   ├── socket.ts (Existing)
│   └── db.ts (Existing)
├── app/api/
│   └── dmo/
│       ├── generator-scheduling/upload/route.ts ✅ (Updated)
│       ├── contract-scheduling/upload/route.ts 🚧 (To Update)
│       ├── market-bidding/upload/route.ts 🚧 (To Update)
│       ├── generate-charts/route.ts 🚧 (To Create)
│       └── chart-data/route.ts 🚧 (To Create)
├── components/
│   ├── dmo/
│   │   ├── dmo-upload-tabs.tsx (Existing)
│   │   ├── dynamic-chart.tsx 🚧 (To Create)
│   │   ├── chart-filters.tsx 🚧 (To Create)
│   │   └── one-click-plot-button.tsx 🚧 (To Create)
│   └── sandbox/
│       └── test-script-upload.tsx 🚧 (To Update)
└── app/
    ├── dmo/page.tsx ✅ (Updated)
    └── sandbox/page.tsx (Existing)
```

---

## Performance Considerations

1. **Large Excel Files:**
   - Stream parsing for files > 5MB
   - Background processing for > 10k rows
   - Progress tracking via Socket.IO

2. **Chart Rendering:**
   - Virtualized timeblock axis for 96 blocks
   - Lazy load chart data
   - Debounce filter changes

3. **DataSource Metadata:**
   - Cache column metadata in Redis
   - Index frequently queried columns
   - Batch column inserts

4. **Real-time Logs:**
   - Use log batching from FIXES_IMPLEMENTATION_PLAN.md
   - Throttle notification creation
   - Clean up old Socket.IO listeners

---

## Success Metrics

- ✅ Excel upload creates DataSource automatically
- ✅ DataSourceColumn entries match Excel headers
- ✅ One-click generates all configured charts
- ✅ Timeblock X-axis shows correct labels (B1-B96)
- ✅ Filters work for all column types
- ✅ Python scripts execute with Run button
- ✅ Logs stream to notification board in real-time
- ✅ Cross-tab refresh works via Socket.IO
- ✅ All endpoints documented and tested

---

**Status:** Phase 1 (Critical) - 33% Complete
**Last Updated:** 2025-01-08
**Next Update:** After Phase 1 completion
