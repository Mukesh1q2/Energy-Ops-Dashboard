# Quick Start Guide - New Enhanced Components

## 🚀 Getting Started

### Step 1: Start the Server

The server should still be running from earlier. If not, restart it:

```powershell
npx nodemon --exec "npx tsx server.ts" --watch server.ts --watch src --ext ts,tsx,js,jsx
```

### Step 2: Access the Dashboard

Open your browser and navigate to: **http://localhost:3000**

---

## 📝 New Components Overview

### 1. Enhanced Data Source Manager

**Import:**
```tsx
import { DataSourceManagerEnhanced } from '@/components/data-source-manager-enhanced'
```

**Quick Actions:**

#### Add Database Connection
1. Click "Sandbox" in the sidebar
2. Navigate to "Database Connections" tab
3. Click one of the database type buttons (PostgreSQL, MySQL, or MongoDB)
4. Fill in the connection form:
   - Connection Name (required)
   - Host (required)
   - Port (auto-filled based on database type)
   - Database Name (required)
   - Username (optional)
   - Password (optional)
   - SSL checkbox
5. Click "Create Connection"
6. Optionally click "Test" to verify the connection

#### Add API Endpoint
1. Navigate to "API Endpoints" tab
2. Click "Add New API Endpoint"
3. Fill in the endpoint form:
   - Endpoint Name (required)
   - HTTP Method (GET, POST, PUT, DELETE)
   - URL (required)
   - Authentication (None, Bearer Token, or API Key)
   - Custom Headers (JSON format)
4. Check "Test connection after saving" if desired
5. Click "Create Endpoint"

#### Delete a Data Source
1. Navigate to "Data Sources" tab
2. Find the source you want to delete
3. Click the "Delete" button
4. Confirm deletion in the dialog

#### Sync/Refresh a Data Source
1. Navigate to "Data Sources" tab
2. Find the source you want to refresh
3. Click the "Sync" button
4. Wait for the success message showing record count

---

### 2. Enhanced Dynamic Filters

**Import:**
```tsx
import { DynamicFiltersEnhanced } from '@/components/dynamic-filters-enhanced'
```

**Quick Actions:**

#### Apply Basic Filters
1. Open the filters dialog (usually via a Filter icon button)
2. In the "Filters" tab, select your criteria:
   - Check boxes for multi-select options (regions, states, etc.)
   - Use the date range picker for temporal filtering
   - Adjust numeric sliders for range-based filtering
3. Choose AND or OR logic at the top
4. Click "Apply Filters"

#### Save a Filter Preset
1. Configure your desired filters
2. Go to the "Presets" tab
3. Click "Save Current Filters"
4. Enter a name for your preset
5. Click "Save Preset"

#### Load a Filter Preset
1. Go to the "Presets" tab
2. Find your saved preset
3. Click the "Load" button
4. The filters will be applied automatically

#### Export/Import Filters
1. Go to the "Advanced" tab
2. Click "Export Filters" to download a JSON file
3. Click "Import Filters" and select a JSON file to load saved filters

---

## 🔧 Code Examples

### Using Data Validation in Your Code

```tsx
import { 
  generateDataQualityReport,
  cleanData,
  detectDataTypes,
  retryWithBackoff
} from '@/lib/validation'

// Example 1: Check data quality
const myData = [/* your data array */]
const report = generateDataQualityReport(myData)

console.log(`Total Rows: ${report.totalRows}`)
console.log(`Valid Rows: ${report.validRows}`)
console.log(`Duplicates: ${report.duplicates}`)
console.log(`Null Values:`, report.nullValues)

// Example 2: Clean your data
const cleanedData = cleanData(myData, {
  removeDuplicates: true,
  fillNulls: true,
  trimStrings: true
})

// Example 3: Detect data types
const types = detectDataTypes(myData)
console.log('Column Types:', types)

// Example 4: Retry failed API calls
try {
  const result = await retryWithBackoff(
    async () => await fetch('/api/my-endpoint'),
    3, // retry 3 times
    1000 // start with 1 second delay
  )
} catch (error) {
  console.error('Failed after retries:', error)
}
```

### Integrating Enhanced Components in Your Pages

```tsx
'use client'

import { useState } from 'react'
import { DataSourceManagerEnhanced } from '@/components/data-source-manager-enhanced'
import { DynamicFiltersEnhanced } from '@/components/dynamic-filters-enhanced'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'

export default function MyPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({})

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
    console.log('Filters updated:', newFilters)
  }

  const handleApplyFilters = () => {
    // Apply filters to your data
    console.log('Applying filters:', filters)
    setShowFilters(false)
  }

  return (
    <div>
      {/* Your page content */}
      
      {/* Filter Button */}
      <Button onClick={() => setShowFilters(true)}>
        <Filter className="w-4 h-4 mr-2" />
        Open Filters
      </Button>

      {/* Enhanced Filters */}
      <DynamicFiltersEnhanced
        module="my-module"
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={() => setFilters({})}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Data Source Manager */}
      <DataSourceManagerEnhanced />
    </div>
  )
}
```

---

## 🎨 Customization Tips

### Styling
All components use Tailwind CSS and can be customized via:
- Tailwind config (`tailwind.config.js`)
- CSS variables (for theme colors)
- Component-level className props

### Theme Colors
The components respect your theme settings. To modify:
1. Edit `app/globals.css` for light/dark theme colors
2. Modify CSS variables under `:root` and `.dark`

---

## 🐛 Troubleshooting

### Filters not persisting?
- Check browser localStorage is enabled
- Check console for any errors
- Clear localStorage: `localStorage.clear()` in browser console

### Database connection test failing?
- Verify the database is accessible from your machine
- Check firewall settings
- Ensure correct credentials

### API endpoint test failing?
- Check the URL is accessible
- Verify CORS settings if calling external APIs
- Check authentication tokens

### Component not showing?
- Verify all dependencies are installed: `npm install`
- Check for console errors
- Ensure you're importing from the correct path

---

## 📦 File Locations

Quick reference for finding files:

```
src/
├── components/
│   ├── data-source-manager-enhanced.tsx  ← New enhanced manager
│   ├── dynamic-filters-enhanced.tsx       ← New enhanced filters
│   ├── data-source-manager.tsx            ← Original (backup exists)
│   └── dynamic-filters.tsx                ← Original
├── lib/
│   └── validation.ts                      ← Enhanced validation utilities
└── app/
    └── api/
        ├── database-connections/          ← DB connection endpoints
        ├── api-endpoints/                 ← API endpoint endpoints
        └── data-sources/
            └── [id]/
                ├── delete/               ← Delete endpoint
                └── sync/                 ← Sync endpoint
```

---

## 🎯 Testing Your Implementation

### Quick Test Checklist

1. **Data Source Manager:**
   ```
   ✓ Upload an Excel file
   ✓ Create a database connection
   ✓ Test the connection
   ✓ Create an API endpoint
   ✓ Test the endpoint
   ✓ Delete a data source (with confirmation)
   ```

2. **Dynamic Filters:**
   ```
   ✓ Apply multi-select filters
   ✓ Use date range picker
   ✓ Adjust numeric sliders
   ✓ Save a filter preset
   ✓ Load the preset
   ✓ Export filters to JSON
   ✓ Import filters from JSON
   ✓ Verify filters persist after page reload
   ```

3. **Data Validation:**
   ```
   ✓ Generate a data quality report
   ✓ Clean data with options
   ✓ Detect data types
   ✓ Test retry mechanism
   ```

---

## 💡 Pro Tips

1. **Use Presets for Common Filters**
   - Save your frequently used filter combinations
   - Name them descriptively (e.g., "High Capacity Western Region")
   
2. **Export Your Configurations**
   - Regularly export your filter presets and database connections
   - Share them with team members

3. **Monitor Data Quality**
   - Run quality reports on new data uploads
   - Set thresholds for acceptable null percentages

4. **Test Connections Regularly**
   - Use the test buttons to verify connectivity
   - Update credentials when they change

---

## 📞 Need Help?

- Check `IMPLEMENTATION_SUMMARY.md` for detailed feature documentation
- Review inline code comments in component files
- Check browser console for error messages
- Verify all dependencies are installed: `npm install`

---

## ✨ Quick Command Reference

```powershell
# Start server
npx nodemon --exec "npx tsx server.ts" --watch server.ts --watch src --ext ts,tsx,js,jsx

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Check types
npm run type-check

# Format code
npm run format
```

---

**Happy Coding! 🚀**
