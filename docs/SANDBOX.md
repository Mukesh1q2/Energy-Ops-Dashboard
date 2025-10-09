# Sandbox - Unified Data Source & One-Click Plot

## Overview

The **Sandbox** is a comprehensive workspace that unifies the hybrid data source approach under a single, intuitive interface. It provides four data input options and features an intelligent "One-Click Plot" button that generates AI-powered chart suggestions for your entire dashboard.

## Key Features

### 🎯 Four Data Source Options

1. **Excel Upload** (Local Testing)
   - Upload Excel/CSV files for quick testing and validation
   - Perfect for prototyping and local data analysis
   - Drag-and-drop interface for easy file management

2. **Database Connections** (Azure Production)
   - Connect to Azure SQL, PostgreSQL, or MySQL databases
   - Real-time data synchronization
   - Test connections before saving
   - Secure credential management

3. **API Endpoints** (Real-time Data)
   - Integrate external REST APIs
   - Real-time data ingestion
   - Custom header and authentication support
   - Automatic data refresh

4. **Optimization Models** (DMO/RMO/SO)
   - Run Day-Ahead Market Optimization (DMO)
   - Run Real-Time Market Optimization (RMO)
   - Run Storage Optimization (SO)
   - View optimization results and analytics

### ✨ One-Click Plot Feature

The One-Click Plot feature uses AI to analyze your data and generate intelligent chart suggestions:

- **AI-Powered Analysis**: Automatically analyzes data structure, types, and relationships
- **Smart Suggestions**: Generates 3-6 chart recommendations with confidence scores
- **Multi-Select**: Choose which charts to add to your dashboard
- **Batch Creation**: Add multiple charts to your dashboard in one action
- **Dashboard-Wide**: Works across all connected data sources

## How to Use

### Step 1: Access the Sandbox

Navigate to the Sandbox from the main dashboard sidebar:
- Click on **"Sandbox"** in the navigation menu
- You'll be taken to the dedicated Sandbox workspace

### Step 2: Choose Your Data Source Type

Select one of the four data source options:
- Click on the card representing your preferred data source type
- Each card displays a description and appropriate badge

### Step 3: Configure Your Data Source

Depending on your selection:

**For Excel Upload:**
1. Click "Add Data Source"
2. Upload your Excel/CSV file
3. The system will automatically parse columns and data

**For Database Connections:**
1. Click "Add Database Connection"
2. Fill in connection details (host, port, database, credentials)
3. Click "Test Connection" to verify
4. Save the connection

**For API Endpoints:**
1. Click "Add API Endpoint"
2. Enter the API URL
3. Configure headers and authentication (if needed)
4. Test the endpoint
5. Save the configuration

**For Optimization Models:**
1. Select the model type (DMO/RMO/SO)
2. Configure model parameters
3. Run the optimization
4. View results

### Step 4: Select Active Data Source

Once you have data sources configured:
1. Use the dropdown in the header to select a data source
2. View the row count and metadata
3. The selected source is now active for One-Click Plot

### Step 5: One-Click Plot

Generate intelligent chart suggestions:
1. Ensure a data source is selected
2. Click **"One-Click Plot for All Dashboards"**
3. Wait for AI analysis (progress bar shows status)
4. Review chart suggestions with confidence scores
5. Select desired charts (top 3 are auto-selected)
6. Click **"Add Charts to Dashboard"**
7. Charts are automatically added to your dashboard

## UI Components

### Header Section
- **Sandbox Title**: Displays "Sandbox" with sparkle icon
- **Data Source Selector**: Dropdown to choose active data source
- **One-Click Plot Button**: Large, prominent button for AI chart generation

### Data Source Cards
Four interactive cards representing each data source type:
- Visual icons with color coding
- Hover effects for better UX
- Ring border when active
- Badge showing category (Local Testing, Azure Production, etc.)

### Data Source Manager
Embedded component for managing data sources:
- Create, edit, delete data sources
- Test connections
- View metadata and status
- Sync/refresh data

### Quick Stats Dashboard
Real-time statistics showing:
- Total data sources count
- Excel files count
- Database connections count
- API endpoints count

### Autoplot Dialog
Modal showing AI-generated chart suggestions:
- Loading animation with progress bar
- Grid layout of suggestion cards
- Confidence scores for each suggestion
- Chart configuration details (X-axis, Y-axis, grouping, aggregation)
- Select/deselect individual charts
- Batch add to dashboard

## API Integration

The Sandbox integrates with the following API endpoints:

### Data Sources
- `GET /api/data-sources` - Fetch all data sources
- `POST /api/data-sources` - Create new data source
- `PUT /api/data-sources/:id` - Update data source
- `DELETE /api/data-sources/:id` - Delete data source
- `POST /api/data-sources/:id/test` - Test connection
- `POST /api/data-sources/:id/sync` - Sync data

### Database Connections
- `GET /api/database-connections` - List connections
- `POST /api/database-connections` - Create connection
- `POST /api/database-connections/:id/test` - Test connection
- `DELETE /api/database-connections/:id` - Delete connection

### API Endpoints
- `GET /api/api-endpoints` - List endpoints
- `POST /api/api-endpoints` - Create endpoint
- `POST /api/api-endpoints/:id/test` - Test endpoint
- `DELETE /api/api-endpoints/:id` - Delete endpoint

### Autoplot
- `POST /api/autoplot` - Generate AI chart suggestions
  - Request: `{ data_source_id: string }`
  - Response: `{ success: boolean, data: ChartSuggestion[] }`

### Dashboard Charts
- `GET /api/dashboard/charts` - List charts
- `POST /api/dashboard/charts` - Create chart
- `DELETE /api/dashboard/charts/:id` - Delete chart

## Chart Suggestion Structure

Each chart suggestion includes:

```typescript
interface ChartSuggestion {
  chart_type: string        // "line", "bar", "pie", "scatter", etc.
  label: string             // Human-readable chart name
  confidence: number        // AI confidence score (0-1)
  chart_config: {
    x?: string             // X-axis column
    y?: string             // Y-axis column
    group_by?: string      // Grouping column
    agg?: string           // Aggregation method
    [key: string]: any     // Additional config
  }
}
```

## Best Practices

1. **Data Quality**: Ensure your data sources have clean, well-structured data
2. **Column Names**: Use descriptive column names for better AI suggestions
3. **Data Types**: Include mix of numeric, date, and categorical columns
4. **Testing**: Always test connections before saving
5. **Sync Regularly**: Keep data sources synchronized for accurate charts
6. **Review Suggestions**: Check confidence scores before adding charts
7. **Iterative Approach**: Start with top suggestions, then add more as needed

## Troubleshooting

### No Chart Suggestions Generated
- Ensure data source has numeric and/or date columns
- Check that data source has sufficient rows (minimum 10 recommended)
- Verify data source is properly synced

### Connection Failures
- Verify credentials are correct
- Check network connectivity
- Ensure database/API is accessible
- Review firewall settings

### Charts Not Appearing
- Refresh the main dashboard page
- Check browser console for errors
- Verify chart was successfully created via API

## Future Enhancements

Planned improvements for the Sandbox:

- [ ] Real-time data preview for active sources
- [ ] Advanced data transformations and cleaning
- [ ] Custom chart template creation
- [ ] Collaborative sandbox sharing
- [ ] Version control for data sources
- [ ] Scheduled data sync
- [ ] Advanced AI model fine-tuning
- [ ] Export sandbox configurations

## Support

For questions or issues:
- Check API logs at `/api/logs`
- Review browser console for client-side errors
- Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: 2025-09-30  
**Status**: Production Ready
