# Excel Upload & Dashboard Usage Guide

## ✅ All Issues Resolved - Summary

### 1. ✅ Transmission Page - DISABLED
The Transmission page has been removed from the navigation menu.

### 2. ✅ Dark Theme - IMPLEMENTED  
A professional energy-themed dark color scheme has been applied:
- **Deep navy background** with subtle blue tones
- **Electric blue primary** colors representing energy/power
- **Energy-themed chart colors**: Green (Renewable), Yellow (Solar), Purple (Nuclear), Cyan (Hydro), Orange (Thermal)
- **Enhanced contrast** for better readability
- **Sidebar depth** with darker tones
- Dark mode is now **enabled by default**

### 3. ✅ Analytics & Forecasting - ENHANCED
The Analytics page now includes:
- **ML-Powered Predictive Forecasting** with confidence intervals
- **4 Key Insight Cards** with real-time predictions
- **Price Distribution Analysis** with histogram visualization
- **Factor Correlation Analysis** showing impact of various factors
- **Model Performance Metrics** including MAPE, R², RMSE
- **Anomaly Detection Log** with severity tracking
- **Radar Chart** for comprehensive performance evaluation
- **Trend Analysis** with historical and predicted values

### 4. ✅ Excel Upload System - COMPLETELY REDESIGNED

---

## 📊 How to Upload Your RMO Excel File

### Step 1: Understanding Your Data
Your `RMO_sample.xlsx` file has these headers:
```
TechnologyType, Region, State, ContractType, PlantName, ContractName, 
TimePeriod, TimeBlock, DAMPrice, GDAMPrice, RTMPrice, ScheduledMW, 
ModelResultsMW, ModelID, ModelTriggerTime
```

### Step 2: Intelligent Column Mapping
The system now **automatically maps** your Excel headers to database columns:

| Your Excel Header | Maps To Database Column | Data Type |
|-------------------|-------------------------|-----------|
| TechnologyType    | technology_type         | Category  |
| Region            | region                  | Category  |
| State             | state                   | Category  |
| ContractType      | contract_type           | Category  |
| PlantName         | plant_name              | String    |
| ContractName      | contract_name           | String    |
| TimePeriod        | time_period             | DateTime  |
| TimeBlock         | time_block              | Integer   |
| DAMPrice          | dam_price               | Float     |
| GDAMPrice         | gdam_price              | Float     |
| RTMPrice          | rtm_price               | Float     |
| ScheduledMW       | scheduled_mw            | Float     |
| ModelResultsMW    | model_results_mw        | Float     |
| ModelID           | model_id                | String    |
| ModelTriggerTime  | model_trigger_time      | DateTime  |

### Step 3: Upload Process

#### Option A: Via Sandbox Page
1. Navigate to **Sandbox** from the main menu
2. Click **"Upload File"** button
3. Select your `RMO_sample.xlsx` file
4. The system will automatically:
   - Detect all sheets in your file
   - Extract column headers
   - Infer data types (string, integer, float, datetime, category)
   - Map to database schema
   - Insert data into the `ElectricityData` table

#### Option B: Via API (for developers)
```bash
# Step 1: Upload the file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@RMO_sample.xlsx"

# Response will include data_source_id

# Step 2: Process the sheet
curl -X POST http://localhost:3000/api/upload/process-sheet \
  -H "Content-Type: application/json" \
  -d '{"data_source_id": "YOUR_ID", "sheet_name": "Sheet1"}'
```

### Step 4: Column Mapping Features

The new system includes:

✅ **Automatic Normalization**
- Converts PascalCase → snake_case
- Removes special characters
- Handles spaces and underscores

✅ **Smart Data Type Detection**
- Numbers → `integer` or `float`
- Dates → `datetime`
- Low cardinality text → `category`
- High cardinality text → `string`

✅ **Intelligent Matching**
- Recognizes common variations
- Example: "TechnologyType", "Technology", "Tech_Type" all map to `technology_type`

✅ **Automatic Filter Configuration**
- Region, State, Technology Type, Contract Type, Plant Name are **automatically exposed as filters**
- Filter UI types are set based on data type (date_range, numeric_range, multi_select, text)

---

## 🎯 One-Click Plot & Chart Suggestions - FIXED

### The Problem (Before)
- Error: "No columns found for this data source"
- Unable to generate chart suggestions

### The Solution (Now)
After uploading your Excel file and processing it:

1. Columns are **automatically created** in the database
2. The system tracks:
   - Column name (original from Excel)
   - Normalized name (database format)
   - Data type (numeric, string, datetime, category)
   - Sample values
   - Filter configuration

3. **Autoplot API** now works correctly:
   - Detects numeric columns for Y-axis
   - Detects categorical columns for grouping
   - Detects datetime columns for time series
   - Generates intelligent chart suggestions:
     - **Line Charts**: Time series with dates + numeric values
     - **Bar Charts**: Categories vs numeric values
     - **Scatter Plots**: Two numeric columns correlation
     - **Pie Charts**: Distribution by category
     - **Histograms**: Single numeric column distribution

### How to Use One-Click Plot

1. Upload your RMO Excel file via Sandbox
2. Wait for processing to complete
3. Click **"One-Click Plot"** button
4. System will show chart suggestions with:
   - Chart type
   - Recommended axes
   - Confidence score
   - Preview

---

## 📈 Viewing Your Data

### Dashboard Modules
Your uploaded RMO data will appear in:

1. **RMO (Real-Time Market)** - Line charts showing:
   - DAM Price, GDAM Price, RTM Price over time
   - Scheduled MW vs Actual MW comparison
   - Optimization results

2. **Analytics & Forecasting** - Advanced analysis:
   - Price predictions
   - Trend forecasting
   - Anomaly detection
   - Factor correlations

3. **Sandbox** - Interactive workspace:
   - Upload new data
   - Configure column mappings
   - Generate custom charts

---

## 🎨 Dark Theme Features

### Color Palette
- **Background**: Deep navy (`oklch(0.12 0.01 240)`)
- **Cards**: Slightly lighter (`oklch(0.16 0.015 240)`)
- **Primary**: Electric blue (`oklch(0.65 0.22 240)`)
- **Borders**: Subtle with glow effect

### Chart Colors (Energy Themed)
1. **Green** - Renewable energy sources
2. **Yellow** - Solar generation
3. **Purple** - Nuclear power
4. **Cyan** - Hydroelectric
5. **Orange** - Thermal/Coal

### Typography & Contrast
- High contrast white text on dark backgrounds
- Muted foreground for secondary text
- Enhanced readability for data-heavy dashboards

---

## 🔧 Troubleshooting

### Issue: "No columns found for this data source"
**Solution**: Make sure you:
1. Uploaded the file successfully (check for success message)
2. Called the `/api/upload/process-sheet` endpoint
3. Wait for processing to complete (check status: 'active')

### Issue: Data not showing in charts
**Solution**: 
1. Check that your Excel file has data rows (not just headers)
2. Verify TimePeriod column has valid dates
3. Ensure numeric columns (DAMPrice, RTMPrice, etc.) have valid numbers

### Issue: Chart suggestions not accurate
**Solution**:
1. The system learns from your data structure
2. More data rows = better suggestions
3. Ensure column names are descriptive
4. Use consistent data types within each column

---

## 🚀 Best Practices

### Excel File Format
✅ **DO**:
- Use clear, descriptive column headers
- Keep consistent data types in each column
- Include a TimePeriod or Date column
- Use numeric values for measurements (MW, Price, etc.)
- Separate different data categories into different sheets

❌ **DON'T**:
- Mix data types in the same column
- Use special characters in column names (except underscore)
- Leave large gaps in data
- Use merged cells

### Data Quality
- **Completeness**: Fewer missing values = better analysis
- **Consistency**: Use same units throughout (MW not KW and MW)
- **Accuracy**: Verify data before upload
- **Timeliness**: Recent data provides better forecasts

---

## 📞 Support

For additional help or to report issues, check:
1. Browser console (F12) for error messages
2. Network tab to see API responses
3. Server logs for detailed error information

---

**Dashboard Version**: 2.0 (Enhanced)
**Last Updated**: October 2025
**Status**: All features operational ✅
