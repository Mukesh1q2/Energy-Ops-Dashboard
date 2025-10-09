# Batch Export Feature Documentation

## Overview

The Batch Export feature allows users to export multiple datasets simultaneously as a single ZIP archive. This is perfect for downloading comprehensive reports that include data from multiple charts and sources.

## Features

✅ **Multiple Dataset Selection** - Choose which datasets to include  
✅ **ZIP Bundling** - All files packaged in one convenient download  
✅ **Progress Tracking** - Visual progress bar during export  
✅ **Metadata Included** - Export information and statistics  
✅ **Smart Data Loading** - Fetches data on-demand  
✅ **Error Handling** - Graceful handling of failed datasets  
✅ **Toast Notifications** - User feedback at every step  

---

## User Guide

### Accessing Batch Export

1. **Location**: Top-right corner of dashboard header
2. **Icon**: 📦 File Archive icon
3. **Button Text**: "Batch Export"

### Using Batch Export

#### Step 1: Open Dialog
Click the "Batch Export" button in the header. A dialog will open showing available datasets for the current module.

#### Step 2: Select Datasets
- Click on individual datasets to select/deselect
- Use "Select All" button to choose all datasets
- Use "Deselect All" button to clear selection
- Selected datasets are highlighted in blue with a checkmark

#### Step 3: Review Summary
The blue summary box shows:
- Number of datasets selected
- Total record count
- Export format information

#### Step 4: Export
- Click the "Export" button
- Progress bar shows export status
- Toast notification confirms success
- ZIP file downloads automatically

### What Gets Exported

The ZIP file contains:
- **CSV/Excel files** - One file per selected dataset
- **export_metadata.json** - Information about the export

### Metadata File Contents

```json
{
  "exportDate": "2025-10-03T17:00:00.000Z",
  "exportTimestamp": 1709481600000,
  "totalDatasets": 3,
  "datasets": [
    {
      "name": "generator_scheduling",
      "format": "csv",
      "recordCount": 192,
      "columnCount": 8,
      "columns": ["Time Period", "Technology", "Plant Name", ...]
    }
  ],
  "generatedBy": "Energy-Ops Dashboard",
  "version": "1.0.0"
}
```

---

## Available Datasets by Module

### Day-Ahead Market (DMO)
- **Generator Scheduling** (192 records) - Scheduled vs actual generation
- **Contract Scheduling** (120 records) - Contract-wise scheduling data
- **Market Bidding** (96 records) - Bid prices and clearing prices

### Installed Capacity
- **State-wise Capacity** (18 records) - Capacity distribution across states

### Home Dashboard
- **KPI Summary** (8 records) - Key performance indicators

### Other Modules
- Module-specific datasets will be added as they become available

---

## Developer Guide

### Architecture

```
┌─────────────────────────────────────┐
│  BatchExportDialog                  │
│  (UI Component)                     │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  batch-export-utils.ts              │
│  (Core Logic)                       │
├─────────────────────────────────────┤
│  • batchExportAsZip()               │
│  • generateCSV()                    │
│  • generateExcel()                  │
│  • generateMetadata()               │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  JSZip Library                      │
│  (ZIP Creation)                     │
└─────────────────────────────────────┘
```

### Key Files

1. **`src/lib/batch-export-utils.ts`**
   - Core batch export functionality
   - ZIP file generation
   - CSV/Excel formatting
   - Metadata generation

2. **`src/components/batch-export-dialog.tsx`**
   - User interface component
   - Dataset selection
   - Progress tracking
   - Toast integration

3. **`src/app/page.tsx`**
   - Integration into dashboard
   - Dataset configuration
   - Data providers

### Adding New Datasets

To add a new dataset to batch export:

```typescript
// In src/app/page.tsx, inside getBatchExportDatasets()

case 'your-module':
  return [
    {
      id: 'your-dataset-id',
      name: 'Your Dataset Name',
      description: 'Description of the dataset',
      recordCount: 100, // Estimated number of records
      dataProvider: async (): Promise<ExportDataset> => {
        // Fetch data from API
        const response = await fetch('/api/your-endpoint')
        const result = await response.json()
        
        return {
          name: 'your_dataset_filename',
          data: result.success ? result.data : [],
          columns: [
            { key: 'column1', label: 'Column 1' },
            { key: 'column2', label: 'Column 2', format: (v) => formatNumber(v, 2) }
          ],
          format: 'csv' // or 'excel'
        }
      }
    }
  ]
```

### Column Formatting

Use the `format` function to customize column output:

```typescript
const columns = [
  // Plain text
  { key: 'name', label: 'Name' },
  
  // Number formatting
  { 
    key: 'capacity', 
    label: 'Capacity (MW)', 
    format: (v) => formatNumber(v, 2) 
  },
  
  // Date/time formatting
  { 
    key: 'timestamp', 
    label: 'Timestamp', 
    format: (v) => formatDateTime(v) 
  },
  
  // Custom formatting
  { 
    key: 'status', 
    label: 'Status', 
    format: (v) => v ? 'Active' : 'Inactive' 
  }
]
```

### Data Provider Pattern

#### Async Data Provider (API Fetch)
```typescript
dataProvider: async (): Promise<ExportDataset> => {
  const response = await fetch('/api/endpoint')
  const result = await response.json()
  return {
    name: 'dataset_name',
    data: result.data,
    columns: [...],
    format: 'csv'
  }
}
```

#### Sync Data Provider (Local Data)
```typescript
dataProvider: (): ExportDataset => {
  return {
    name: 'dataset_name',
    data: localData,
    columns: [...],
    format: 'csv'
  }
}
```

---

## API Reference

### `batchExportAsZip()`

Main function to create and download a ZIP file.

```typescript
async function batchExportAsZip(options: BatchExportOptions): Promise<void>

interface BatchExportOptions {
  datasets: ExportDataset[]
  zipFileName: string
  includeMetadata?: boolean // Default: true
}
```

**Example**:
```typescript
await batchExportAsZip({
  datasets: [
    {
      name: 'capacity_data',
      data: capacityRecords,
      columns: capacityColumns,
      format: 'csv'
    },
    {
      name: 'generation_data',
      data: generationRecords,
      columns: generationColumns,
      format: 'excel'
    }
  ],
  zipFileName: 'dashboard_export_2025-10-03',
  includeMetadata: true
})
```

### `estimateZipSize()`

Calculate approximate ZIP file size.

```typescript
function estimateZipSize(datasets: ExportDataset[]): number
```

**Returns**: Estimated size in bytes

**Example**:
```typescript
const sizeBytes = estimateZipSize(datasets)
const sizeFormatted = formatFileSize(sizeBytes) // "2.5 MB"
```

### `formatFileSize()`

Format bytes to human-readable string.

```typescript
function formatFileSize(bytes: number): string
```

**Examples**:
- `formatFileSize(1024)` → "1 KB"
- `formatFileSize(2621440)` → "2.5 MB"

---

## TypeScript Types

### `ExportDataset`

```typescript
interface ExportDataset {
  name: string              // Filename (without extension)
  data: any[]              // Array of records
  columns: ExportColumn[]  // Column definitions
  format: 'csv' | 'excel'  // File format
}
```

### `ExportColumn`

```typescript
interface ExportColumn {
  key: string                           // Data property key
  label: string                         // Column header
  format?: (value: any) => string | number  // Optional formatter
}
```

### `BatchExportOptions`

```typescript
interface BatchExportOptions {
  datasets: ExportDataset[]     // Datasets to export
  zipFileName: string           // ZIP filename (without .zip)
  includeMetadata?: boolean     // Include metadata.json
}
```

---

## Error Handling

### Failed Dataset Loading

If a dataset fails to load:
- Warning toast is shown
- Dataset is skipped
- Export continues with remaining datasets
- User is notified which datasets were skipped

### No Datasets Available

If no datasets are selected:
- Warning toast appears
- Export is prevented
- User prompted to select at least one dataset

### Network Errors

If API fetch fails:
- Error is caught and logged
- Toast notification shows error message
- Export can be retried

---

## Performance Considerations

### Large Datasets

- **Progress Tracking**: Shows progress during multi-dataset exports
- **Async Loading**: Datasets loaded one at a time
- **Compression**: ZIP uses DEFLATE compression (level 6)
- **Memory**: Large exports handled efficiently by streaming

### Recommended Limits

- **Records per Dataset**: < 100,000 rows
- **Total Datasets**: < 20 files
- **File Size**: < 50 MB uncompressed

For larger exports, consider:
- Filtering data by date range
- Exporting datasets individually
- Using server-side export API

---

## Testing

### Manual Testing Checklist

- [ ] Open batch export dialog
- [ ] Select single dataset and export
- [ ] Select multiple datasets and export
- [ ] Select all datasets and export
- [ ] Try exporting with no selection (should warn)
- [ ] Verify ZIP file downloads
- [ ] Extract ZIP and verify CSV files
- [ ] Check metadata.json is included
- [ ] Verify data integrity in CSV files
- [ ] Test in different modules (DMO, Home, etc.)
- [ ] Test error handling (simulate API failure)
- [ ] Verify toast notifications appear

### Unit Test Example

```typescript
describe('batchExportAsZip', () => {
  it('should create ZIP with multiple CSV files', async () => {
    const datasets = [
      {
        name: 'test1',
        data: [{ id: 1, value: 'A' }],
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'value', label: 'Value' }
        ],
        format: 'csv'
      }
    ]
    
    await batchExportAsZip({
      datasets,
      zipFileName: 'test_export'
    })
    
    // Verify download was triggered
    // Verify ZIP contents
  })
})
```

---

## Troubleshooting

### Issue: ZIP doesn't download

**Solution**:
- Check browser popup blocker
- Ensure browser allows downloads
- Check console for errors

### Issue: Empty CSV files

**Solution**:
- Verify API returns data
- Check dataProvider implementation
- Ensure columns match data keys

### Issue: Export takes too long

**Solution**:
- Reduce number of selected datasets
- Filter data to smaller date range
- Check network connection

### Issue: Corrupted ZIP file

**Solution**:
- Clear browser cache
- Try different browser
- Check server logs for errors

---

## Future Enhancements

### Planned Features
- [ ] Excel format with proper xlsx files (using exceljs)
- [ ] Custom column selection per dataset
- [ ] Date range filtering in dialog
- [ ] Schedule exports (recurring)
- [ ] Email export option
- [ ] Cloud storage integration (S3, GCS)
- [ ] Export templates (predefined configurations)
- [ ] Compression level selection
- [ ] Password-protected ZIPs

### Potential Improvements
- Add export history tracking
- Implement export queue for large jobs
- Add preview before export
- Support for JSON and XML formats
- Internationalization of column headers
- Custom branding (add logo to PDF exports)

---

## Related Documentation

- **Error Handling**: `docs/ERROR_HANDLING.md`
- **Export Utils**: `docs/EXPORT_UTILS.md` (to be created)
- **API Documentation**: `docs/API_NOTES.md`

---

## Support

For issues or questions:
1. Check console logs for errors
2. Verify API endpoints are responding
3. Review this documentation
4. Check browser compatibility

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: ✅ Production Ready
