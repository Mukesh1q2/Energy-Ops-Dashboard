# Dashboard API Endpoints & Excel Data Mapping

This document describes how dashboard charts fetch data from uploaded Excel files and the mapping between API endpoints and chart components.

## Overview

The dashboard system now supports **two data sources**:
1. **Predefined Prisma tables** (DMOGeneratorScheduling, DMOContractScheduling, etc.)
2. **Uploaded Excel files** stored in dynamic tables (ds_xxxxx)

When you upload an Excel file through the Sandbox, the system:
- Creates a data source record
- Stores data in a dynamic table named `ds_{unique_id}`
- Registers column metadata
- Makes data available to charts through API endpoints

## Updated API Endpoints

### 1. `/api/rmo/data` - RMO Optimization Charts ✅ **UPDATED**

**Used by:**
- `RmoPriceChart` - DAM, GDAM, RTM price trends
- `RmoScheduleChart` - Scheduled vs Actual MW
- `RmoOptimizationChart` - Price optimization analysis

**Excel Requirements:**
| Column Name (case-insensitive) | Purpose |
|--------------------------------|---------|
| `DAMPrice` | Day-Ahead Market price |
| `GDAMPrice` | Green DAM price |
| `RTMPrice` | Real-Time Market price |
| `ScheduledMW` | Scheduled megawatts |
| `ModelResultsMW` | Model optimization results |
| `TimePeriod` | Timestamp for data point |
| `TechnologyType` | Technology (Solar, Wind, etc.) |
| `Region` | Geographic region |

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "TechnologyType": "Solar",
      "Region": "Northern",
      "DAMPrice": 3500.5,
      "GDAMPrice": 3600.0,
      "RTMPrice": 3450.0,
      "ScheduledMW": 150.0,
      "ModelResultsMW": 145.5,
      "TimePeriod": "2024-01-01T00:00:00Z"
    }
  ],
  "recordCount": 192
}
```

---

### 2. `/api/dashboard/kpi` - Main Dashboard KPIs ✅ **UPDATED**

**Used by:**
- `KpiGrid` - Top-level KPI cards
- Main dashboard homepage

**Data Sources:**
- Aggregates from DMOGeneratorScheduling table
- **NOW ALSO**: Aggregates from uploaded Excel with scheduling columns

**Excel Requirements:**
| Column Name | Purpose |
|-------------|---------|
| `ScheduledMW` | Scheduled capacity |
| `ActualMW` or `ModelResultsMW` | Actual generation |
| `TechnologyType` | For technology mix calculation |
| `Region` | For regional performance |
| `TimePeriod` | For trend analysis |

**KPI Calculations:**
- `totalCapacity`: Sum of all scheduled MW
- `totalGeneration`: Sum of all actual MW
- `technologyMix`: Percentage breakdown by technology
- `regionalPerformance`: Availability by region
- `recentTrend`: Last 30 days scheduled vs actual

**Response shows:**
- Data from **both** Prisma tables AND uploaded Excel
- `dataCounts.uploadedRecords` shows how many rows came from Excel

---

### 3. `/api/dmo/generator-scheduling` - Generator Scheduling Chart

**Used by:**
- `GeneratorSchedulingChart` - Generator scheduling vs actual

**Current Status:** ⚠️ **NEEDS UPDATE**
- Currently queries only `DMOGeneratorScheduling` table
- **TODO**: Update to also fetch from uploaded Excel

**Excel Requirements:**
| Column Name | Purpose |
|-------------|---------|
| `ScheduledMW` | Scheduled generation |
| `ActualMW` | Actual generation |
| `TechnologyType` | Generator technology |
| `PlantName` | Generator name |
| `TimePeriod` | Timestamp |

**Fallback:** Uses simulated data if no real data found

---

### 4. `/api/dmo/contract-scheduling` - Contract Scheduling Chart

**Used by:**
- `ContractSchedulingChart` - Contract performance

**Current Status:** ⚠️ **NEEDS UPDATE**
- Currently queries only `DMOContractScheduling` table

**Excel Requirements:**
| Column Name | Purpose |
|-------------|---------|
| `ScheduledMW` | Scheduled delivery |
| `ActualMW` | Actual delivery |
| `ContractType` | Contract classification |
| `ContractName` | Contract identifier |
| `TimePeriod` | Timestamp |

---

### 5. `/api/dmo/market-bidding` - Market Bidding Chart

**Used by:**
- `MarketBiddingChart` - Market bid analysis

**Current Status:** ⚠️ **NEEDS UPDATE**
- Currently queries only `DMOMarketBidding` table

**Excel Requirements:**
| Column Name | Purpose |
|-------------|---------|
| `DAMPrice` | Day-ahead bid price |
| `ScheduledMW` | Bid volume |
| `GDAMPrice` | Clearing price (optional) |
| `ModelResultsMW` | Cleared volume (optional) |
| `TimePeriod` | Timestamp |

---

## Helper Utility: `excel-data-helper.ts`

Location: `src/lib/excel-data-helper.ts`

### Key Functions:

1. **`findExcelDataSources(requiredColumns: string[])`**
   - Finds uploaded Excel files matching required columns
   - Returns table names and column lists

2. **`fetchRMOData(limit?: number)`**
   - Fetches and transforms RMO optimization data
   - Used by `/api/rmo/data`

3. **`fetchDMOGeneratorData(limit?: number)`**
   - Fetches generator scheduling data
   - Ready for use in DMO endpoints

4. **`fetchDMOContractData(limit?: number)`**
   - Fetches contract scheduling data

5. **`fetchMarketBiddingData(limit?: number)`**
   - Fetches market bidding data

### Usage Example:

```typescript
import { fetchRMOData } from '@/lib/excel-data-helper'

export async function GET(request: NextRequest) {
  const data = await fetchRMOData(1000)
  
  if (data.length === 0) {
    // No Excel data found, use fallback
  }
  
  return NextResponse.json({ success: true, data })
}
```

---

## Chart Components & Their APIs

| Chart Component | API Endpoint | Status |
|-----------------|--------------|--------|
| `RmoPriceChart` | `/api/rmo/data` | ✅ Uses Excel |
| `RmoScheduleChart` | `/api/rmo/data` | ✅ Uses Excel |
| `RmoOptimizationChart` | `/api/rmo/data` | ✅ Uses Excel |
| `KpiGrid` | `/api/dashboard/kpi` | ✅ Uses Excel |
| `GeneratorSchedulingChart` | `/api/dmo/generator-scheduling` | ⚠️ Needs update |
| `ContractSchedulingChart` | `/api/dmo/contract-scheduling` | ⚠️ Needs update |
| `MarketBiddingChart` | `/api/dmo/market-bidding` | ⚠️ Needs update |
| `StorageCapacityChart` | `/api/storage/data` | ⚠️ Needs update |
| `InstalledCapacityCharts` | `/api/capacity/states` | ⚠️ Needs update |

---

## Excel File Column Mapping

Your uploaded file `all_generator_all_demand.xlsx` has these columns:

```
- TechnologyType
- Region
- State
- ContractType
- PlantName
- ContractName
- TimePeriod
- TimeBlock
- DAMPrice         → Used for price charts
- GDAMPrice        → Used for clearing price
- RTMPrice         → Used for real-time price
- ScheduledMW      → Used for scheduling charts
- ModelResultsMW   → Used as actual/optimized MW
- ModelID
- ModelTriggerTime
```

**Perfect for:**
- ✅ RMO optimization charts
- ✅ Dashboard KPI calculations
- ✅ Generator scheduling (ScheduledMW, ModelResultsMW)
- ✅ Market bidding analysis (DAMPrice, RTMPrice)
- ✅ Technology mix breakdown

---

## Next Steps to Complete Integration

### Priority 1: DMO Chart APIs
1. Update `/api/dmo/generator-scheduling` to use `fetchDMOGeneratorData()`
2. Update `/api/dmo/contract-scheduling` to use `fetchDMOContractData()`
3. Update `/api/dmo/market-bidding` to use `fetchMarketBiddingData()`

### Priority 2: Storage & Capacity APIs
1. Create helper functions for storage data
2. Create helper functions for capacity data
3. Update corresponding API endpoints

### Priority 3: Testing
1. Verify all charts display uploaded data
2. Confirm fallback to mock data works when no Excel uploaded
3. Test with multiple uploaded files

---

## How to Test

1. **Upload Excel file** through Sandbox (`http://localhost:3000/sandbox`)
2. **Navigate to RMO module** - should show your data ✅
3. **Check Dashboard KPIs** - should aggregate your data ✅
4. **Check DMO charts** - currently showing mock data (needs update)

---

## Troubleshooting

### Charts showing mock/fallback data?
- Check if Excel file uploaded successfully in Sandbox
- Verify column names match requirements (case-insensitive)
- Check browser console for API errors
- Inspect API response in Network tab

### API returning 500 error?
- Check server terminal for error details
- Verify table name format: `ds_xxxxx`
- Check column name mapping in helper functions

### No data in charts?
- Verify data source status is 'active' in Prisma Studio
- Check `config.tableName` exists in data source record
- Ensure uploaded data has required columns

---

## Database Schema

**DataSource table:**
```prisma
model DataSource {
  id           String   @id
  name         String
  type         String   // 'excel'
  status       String   // 'active'
  config       Json     // { tableName: 'ds_xxxxx', ... }
  record_count Int?
  created_at   DateTime
}
```

**Dynamic data tables:** `ds_{cuid}`
- Created automatically on Excel upload
- Column names normalized to lowercase
- All columns stored as TEXT (converted at query time)

---

## Summary

**Completed:**
✅ RMO charts fully integrated with uploaded Excel data
✅ Dashboard KPI aggregates from both Prisma tables and Excel
✅ Helper utility created for reusable Excel data fetching

**In Progress:**
⚠️ DMO chart APIs need Excel integration

**Your Excel file is ready to use for:**
- ✅ RMO optimization analysis
- ✅ Dashboard KPIs
- ⚠️ DMO scheduling (APIs need update)
- ⚠️ Market bidding analysis (APIs need update)
