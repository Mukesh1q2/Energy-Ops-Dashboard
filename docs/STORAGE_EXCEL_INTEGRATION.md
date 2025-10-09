# Storage Operations Excel Integration

## Overview
This document describes the integration of uploaded Excel data into the Storage Operations dashboard, allowing the system to display real storage data from uploaded Excel files.

## Date: ${new Date().toISOString().split('T')[0]}

---

## Changes Made

### 1. Storage Data Helper Function
**File:** `src/lib/excel-data-helper.ts`

Added a new `fetchStorageData()` helper function that:
- Searches for Excel data sources containing storage-related columns
- Supports multiple column naming patterns:
  - Primary: `capacity`, `charge`, `discharge`
  - Secondary: `storage`, `capacity`
  - Tertiary: `storagetype`, `battery`
- Maps Excel columns to standardized storage data format
- Returns structured data including:
  - `id`: Unique identifier
  - `time_period`: Timestamp of the data point
  - `region`: Geographic region
  - `state`: State/province
  - `storage_type`: Type of storage (Battery, Pumped Hydro, etc.)
  - `capacity_mw`: Storage capacity in MW
  - `charge_mw`: Charging power in MW
  - `discharge_mw`: Discharging power in MW
  - `state_of_charge_percent`: Current state of charge (0-100%)
  - `efficiency_percent`: Round-trip efficiency
  - `cycles`: Number of charge/discharge cycles

**Supported Column Names** (case-insensitive):
- **Capacity:** `capacitymw`, `CapacityMW`, `capacity_mw`, `capacity`
- **Charge:** `chargemw`, `ChargeMW`, `charge_mw`, `charge`
- **Discharge:** `dischargemw`, `DischargeMW`, `discharge_mw`, `discharge`
- **Storage Type:** `storagetype`, `StorageType`, `storage_type`, `technologytype`, `TechnologyType`
- **State of Charge:** `stateofcharge`, `StateOfCharge`, `state_of_charge`, `soc`
- **Efficiency:** `efficiency`, `Efficiency`, `efficiency_percent`
- **Cycles:** `cycles`, `Cycles`, `cycle_count`
- **Time Period:** `timeperiod`, `TimePeriod`, `time_period`, `timestamp`
- **Region:** `region`, `Region`
- **State:** `state`, `State`

---

### 2. Storage Data API Endpoint
**File:** `src/app/api/storage/data/route.ts`

Updated the storage API endpoint to:
1. **Import the new helper:** Changed from `fetchDMOGeneratorData` to `fetchStorageData`
2. **Fetch Excel storage data:** Calls `fetchStorageData(1000)` to retrieve up to 1000 rows
3. **Apply filters:** Filters by region and storage type based on query parameters
4. **Merge data sources:** Combines Prisma database data with Excel data
5. **Transform data:** Maps Excel data to the expected chart format with proper field mapping
6. **Use pre-calculated values:** Utilizes efficiency, SOC, and cycles from Excel when available
7. **Fallback calculations:** Calculates missing metrics if not provided in Excel

**API Parameters:**
- `region`: Filter by region (e.g., "Northern", "Western")
- `storageType`: Filter by storage type (e.g., "Battery", "Pumped Hydro")
- `timeframe`: Time range filter ("1h", "24h", "7d", "30d")
- `dataSource`: Filter by specific data source ID

**Response Format:**
```json
{
  "success": true,
  "data": {
    "storageData": [
      {
        "id": "storage-123",
        "time_period": "2024-01-15T12:00:00Z",
        "region": "Northern",
        "state": "Delhi",
        "storage_type": "Battery",
        "capacity_mw": 500,
        "charge_mw": 200,
        "discharge_mw": 180,
        "state_of_charge_percent": 75.0,
        "efficiency_percent": 95.0,
        "cycles": 2
      }
    ],
    "filterOptions": {
      "regions": ["Northern", "Western", "Southern"],
      "storageTypes": ["Battery", "Pumped Hydro"]
    }
  }
}
```

---

### 3. Dynamic Filters Enhancement
**File:** `src/app/api/filters/dynamic/route.ts`

Enhanced the dynamic filters API to:
1. **Import storage helper:** Added `fetchStorageData` import
2. **Fetch Excel storage data:** Retrieves storage data from Excel files
3. **Merge filter options:** Combines distinct values from both Prisma and Excel
4. **Provide defaults:** Falls back to standard storage types if no data found

**Storage Operations Module Filters:**
- **regions**: Unique regions from both database and Excel
- **states**: Unique states from both database and Excel
- **storageTypes**: Unique storage types from both sources
- **dataSources**: List of all uploaded Excel/CSV files

**Default Storage Types** (if no data available):
- Battery
- Pumped Hydro
- Compressed Air
- Flywheel
- Thermal

---

## How It Works

### Data Flow

1. **Upload Excel File:**
   - User uploads Excel file via Data Source Manager
   - File is processed and stored in dynamic table (`ds_xxxxx`)
   - Columns are registered in `DataSourceColumn` table

2. **Excel Data Discovery:**
   - `fetchStorageData()` searches for data sources with storage columns
   - Matches are found based on column name patterns
   - Table name is validated for security

3. **Data Retrieval:**
   - Raw data is fetched from dynamic table using `$queryRawUnsafe`
   - Column names are normalized (case-insensitive mapping)
   - Data is transformed to standard format

4. **API Response:**
   - Storage API merges Prisma and Excel data
   - Filters are applied (region, storage type, timeframe)
   - Data is transformed for chart consumption
   - Pre-calculated metrics from Excel are preserved

5. **Chart Display:**
   - Storage charts call `/api/storage/data` endpoint
   - Charts receive merged data from all sources
   - Dynamic filters reflect actual data values
   - Charts update based on filter selections

---

## Excel File Requirements

### Required Columns (at least one set):

**Option 1: Detailed Storage Data**
- Capacity column (MW)
- Charge column (MW)
- Discharge column (MW)

**Option 2: Storage with Capacity**
- Storage type column
- Capacity column

**Option 3: Technology-based**
- Storage type or Technology type column
- Battery-related column

### Recommended Columns:

| Column Purpose | Accepted Names |
|----------------|----------------|
| Time Period | TimePeriod, time_period, timestamp |
| Region | Region, region |
| State | State, state |
| Storage Type | StorageType, TechnologyType, storage_type |
| Capacity (MW) | CapacityMW, capacity_mw, capacity |
| Charge (MW) | ChargeMW, charge_mw, charge |
| Discharge (MW) | DischargeMW, discharge_mw, discharge |
| State of Charge (%) | StateOfCharge, state_of_charge, soc |
| Efficiency (%) | Efficiency, efficiency_percent |
| Cycles | Cycles, cycle_count |

### Example Excel Structure:

| TimePeriod | Region | State | StorageType | CapacityMW | ChargeMW | DischargeMW | StateOfCharge | Efficiency | Cycles |
|------------|--------|-------|-------------|------------|----------|-------------|---------------|------------|--------|
| 2024-01-15 12:00 | Northern | Delhi | Battery | 500 | 200 | 180 | 75 | 95 | 2 |
| 2024-01-15 13:00 | Western | Maharashtra | Pumped Hydro | 1000 | 400 | 350 | 60 | 85 | 1 |
| 2024-01-15 14:00 | Southern | Tamil Nadu | Battery | 300 | 150 | 120 | 80 | 92 | 3 |

---

## Testing the Integration

### 1. Verify Excel Data Upload
```bash
# Check if data sources are registered
curl http://localhost:3000/api/filters/dynamic?module=storage-operations
```

Expected response should include uploaded file in `dataSources` array.

### 2. Test Storage Data Retrieval
```bash
# Fetch all storage data
curl http://localhost:3000/api/storage/data

# Filter by region
curl "http://localhost:3000/api/storage/data?region=Northern"

# Filter by storage type
curl "http://localhost:3000/api/storage/data?storageType=Battery"

# Filter by timeframe
curl "http://localhost:3000/api/storage/data?timeframe=24h"
```

### 3. Check Filter Options
```bash
# Get filter options for storage module
curl "http://localhost:3000/api/filters/dynamic?module=storage-operations"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "filterOptions": {
      "regions": ["Northern", "Western", ...],
      "states": ["Delhi", "Maharashtra", ...],
      "storageTypes": ["Battery", "Pumped Hydro", ...],
      "dataSources": [...]
    }
  }
}
```

### 4. Verify Charts Display Data

1. Navigate to Storage Operations dashboard
2. Check that `StorageCapacityChart` displays data
3. Check that `StoragePerformanceChart` displays data
4. Apply filters and verify data updates
5. Select different data sources from dropdown

---

## Troubleshooting

### Charts Show "No Data"

**Possible Causes:**
1. Excel file not uploaded or processed
2. Column names don't match patterns
3. Data source status is not 'active'
4. No data matches current filters

**Solutions:**
1. Check data source status: `SELECT * FROM "DataSource" WHERE type='excel'`
2. Verify columns: `SELECT * FROM "DataSourceColumn" WHERE data_source_id='...'`
3. Check table name in config: Should match pattern `ds_[a-zA-Z0-9_]+`
4. Try "All Sources" and "All Regions" filters

### Filter Dropdowns Empty

**Possible Causes:**
1. No Excel data found
2. fetchStorageData() returning empty array
3. Column patterns not matching

**Solutions:**
1. Add console logging to `fetchStorageData()`
2. Check browser DevTools Network tab for API responses
3. Verify Excel file has storage-related columns
4. Check that columns are lowercase in pattern matching

### Data Not Updating After Upload

**Possible Causes:**
1. Data cached in browser
2. API not fetching new Excel data
3. Upload process incomplete

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check API endpoint response for new data
3. Verify upload status in database
4. Restart development server

---

## Future Enhancements

### Planned Features:
1. **Advanced Filtering:**
   - Date range picker for time period filtering
   - Multi-select for regions and storage types
   - Custom filter builder for Excel columns

2. **Data Aggregation:**
   - Hourly, daily, weekly, monthly rollups
   - Aggregate metrics (avg, min, max, sum)
   - Trend analysis and forecasting

3. **Performance Metrics:**
   - Cycle life tracking
   - Degradation analysis
   - Efficiency trends over time
   - Cost per cycle calculations

4. **Real-time Updates:**
   - WebSocket integration for live data
   - Auto-refresh on data changes
   - Notification system for anomalies

5. **Export Features:**
   - Export filtered data to Excel
   - Generate PDF reports
   - Schedule automated reports

---

## Related Documentation

- [Dashboard APIs Overview](./DASHBOARD_APIS.md)
- [Filter Integration Guide](./FILTER_INTEGRATION.md)
- [Excel Data Helper Usage](./EXCEL_DATA_HELPER.md)
- [RMO Dashboard Integration](./RMO_DASHBOARD_UPDATES.md)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs in browser DevTools
3. Check server logs for API errors
4. Verify Excel file format matches requirements

---

## Changelog

### 2024-01-XX - Initial Storage Integration
- Added `fetchStorageData()` helper function
- Updated `/api/storage/data` endpoint
- Enhanced dynamic filters for storage module
- Created comprehensive documentation

---

## Technical Notes

### Security Considerations:
- Table name validation using regex pattern
- SQL injection prevention via `$queryRawUnsafe` with validation
- Input sanitization for filter parameters
- Type coercion for numeric values

### Performance Optimizations:
- Limit of 1000 rows per query
- Indexed lookups on data_source_id
- Efficient column pattern matching
- Caching of filter options (future)

### Data Quality:
- Fallback values for missing data
- Type conversion with defaults
- Null/undefined handling
- Case-insensitive column matching

---

**End of Documentation**
