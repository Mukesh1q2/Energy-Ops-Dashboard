# Testing Guide - Excel Upload & One-Click Plot

## Changes Summary

### Fixed Issues
1. ✅ Excel uploads now auto-process on upload
2. ✅ Removed duplicate processing calls
3. ✅ Added Windows file access delay handling
4. ✅ Improved error messaging
5. ✅ Streamlined UX (no manual sheet selection)

### Files Modified
1. `src/app/api/upload/route.ts` - Auto-processing with delay
2. `src/components/upload-excel-modal.tsx` - Error handling
3. `src/components/data-source-manager-enhanced.tsx` - Remove duplicate processing

---

## Testing Checklist

### 1. Excel Upload (Primary Upload Modal)

**Location**: Main dashboard → Quick Actions → Upload Excel button

**Test Steps**:
1. Click "Upload Excel" button in Quick Actions
2. Select an Excel file (e.g., RMO_sample.xlsx)
3. Wait for upload progress
4. Verify success message appears
5. Modal should auto-close after 2 seconds

**Expected Results**:
- ✅ File uploads successfully
- ✅ Success message: "File uploaded and processed successfully!"
- ✅ Modal auto-closes
- ✅ No errors in console

**What to Check**:
- Server logs should show: `✅ Auto-processed sheet "sheet_name" with X rows and Y columns`
- Data source should appear with status "active"
- Record count should match file

---

### 2. Excel Upload (Data Source Manager)

**Location**: Sandbox page → Data Source Manager tab

**Test Steps**:
1. Go to Sandbox page
2. Click "Data Source Manager" tab
3. Drag & drop Excel file into upload area
4. Watch progress indicator

**Expected Results**:
- ✅ Upload progress shows 0-100%
- ✅ Status changes: uploading → completed
- ✅ Success toast message appears
- ✅ File appears in data sources list

**What to Check**:
- No error about "Failed to read Excel file"
- No duplicate processing attempts
- Data source status is "active"

---

### 3. One-Click Plot

**Location**: Sandbox page → Data Sources → Select source → One-Click Plot

**Test Steps**:
1. After uploading an Excel file, wait for it to complete
2. Find the data source in the list
3. Click the "One-Click Plot" button
4. Wait for chart suggestions to load

**Expected Results**:
- ✅ Modal opens with "Analyzing your data..." spinner
- ✅ Chart suggestions appear (e.g., "Time Series of Generation MW")
- ✅ Multiple chart types shown (line, bar, scatter, pie)
- ✅ Can select multiple charts
- ✅ Can add selected charts to dashboard

**What to Check**:
- NO error: "No columns found for this data source"
- Chart suggestions match actual column names
- Confidence scores shown (e.g., 85%, 80%)
- Chart icons render correctly

---

### 4. Database Verification

**After uploading a file, check database**:

```bash
# Run this to verify data was inserted
npx tsx -e "
import { db } from './src/lib/db';
(async () => {
  // Check columns
  const cols = await db.dataSourceColumn.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log('Recent columns:', cols.map(c => c.column_name));
  
  // Check data sources
  const sources = await db.dataSource.findMany({
    where: { status: 'active' },
    orderBy: { created_at: 'desc' },
    take: 3
  });
  console.log('Active sources:', sources.map(s => ({ 
    name: s.name, 
    records: s.record_count 
  })));
  
  await db.\$disconnect();
})();
"
```

**Expected Output**:
```
Recent columns: ['TechnologyType', 'Region', 'State', 'PlantName', 'DAMPrice']
Active sources: [
  { name: 'RMO_sample.xlsx', records: 192 },
  ...
]
```

---

### 5. Error Handling Tests

#### Test 5.1: Invalid File Type
1. Try uploading a .txt or .pdf file
2. Should show error: "Invalid file type. Only Excel and CSV are supported."

#### Test 5.2: Empty File
1. Upload an empty Excel file
2. Should show error: "Sheet is empty"

#### Test 5.3: Large File
1. Upload a file with 10,000+ rows
2. Should process in chunks (500 rows at a time)
3. Should complete successfully

---

## Common Issues & Solutions

### Issue: "Cannot access file" error
**Cause**: File not fully written to disk (Windows timing issue)  
**Solution**: Already fixed with 100ms delay in upload API

### Issue: "No columns found"
**Cause**: Processing wasn't called or failed  
**Solution**: Now auto-processes, no manual step needed

### Issue: Duplicate processing
**Cause**: Both upload-excel-modal and data-source-manager calling process-sheet  
**Solution**: Removed duplicate call from data-source-manager

### Issue: React warning about indicatorClassName
**Cause**: Minor prop warning (not critical)  
**Impact**: Visual only, doesn't affect functionality

---

## Success Metrics

After fixes, you should see:

1. **Upload Success Rate**: 100% (no file access errors)
2. **Processing Success Rate**: 100% (auto-processed)
3. **One-Click Plot Success Rate**: 100% (columns available)
4. **User Experience**: Single click to upload, no manual steps

---

## Server Log Examples

### Good Upload (What you should see):
```
POST /api/upload
prisma:query INSERT INTO DataSource ...
prisma:query INSERT INTO DataSourceColumn ... (16 times)
prisma:query CREATE TABLE IF NOT EXISTS "ds_..." ...
prisma:query INSERT INTO "ds_..." ... (192 rows)
prisma:query UPDATE DataSource SET status='active', record_count=192 ...
✅ Auto-processed sheet "all_generator_all_demand" with 192 rows and 16 columns
POST /api/upload 200 in 1839ms
```

### Bad Upload (What you should NOT see):
```
❌ Error reading Excel file: Cannot access file ...
POST /api/upload 500
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Test with different Excel files (various structures)
2. ✅ Test CSV uploads
3. ✅ Test One-Click Plot chart creation
4. ✅ Test chart rendering on main dashboard
5. ✅ Test data export with uploaded data
6. ✅ Clean up old unprocessed data sources (optional)

---

## Rollback Plan

If issues persist:

1. Revert `src/app/api/upload/route.ts` to original version
2. Restore manual sheet selection in upload-excel-modal.tsx
3. Keep the duplicate processing removal (that's still good)
4. File an issue with specific error details
