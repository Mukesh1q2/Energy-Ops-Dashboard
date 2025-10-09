# Remaining Tasks & Enhancement Roadmap

## Project: Energy-Ops-Dashboard (OptiBid Command Center)
**Date Created:** October 3, 2025
**Last Updated:** October 3, 2025

---

## 🎯 Priority Levels
- 🔴 **Critical** - Must be completed for production
- 🟠 **High** - Important for user experience
- 🟡 **Medium** - Nice to have, enhances functionality
- 🟢 **Low** - Future enhancements, optional

---

## ✅ Completed Tasks (Current Session)

- [x] Fix India Map visibility issue (CSP errors)
- [x] Create IndiaMapSimple component
- [x] Implement CSV/Excel export functionality
- [x] Create export utility library
- [x] Ensure simulated data for all charts
- [x] Update Installed Capacity Charts component
- [x] Create comprehensive documentation (FIXES_SUMMARY.md)
- [x] Create visual guide (INDIA_MAP_GUIDE.md)
- [x] Server running successfully on port 3000
- [x] WebSocket real-time updates working

---

## 📋 Remaining Tasks

### 🔴 **CRITICAL PRIORITY**

#### 1. Add Export Functionality to All Chart Components
**Status:** Not Started
**Estimated Time:** 2-3 hours
**Description:** Add CSV/Excel export buttons to all existing chart components

**Components to Update:**
- [ ] DMO Charts
  - [ ] GeneratorSchedulingChart (`src/components/dmo-charts.tsx`)
  - [ ] ContractSchedulingChart (`src/components/dmo-charts.tsx`)
  - [ ] MarketBiddingChart (`src/components/dmo-charts.tsx`)

- [ ] RMO Charts
  - [ ] RmoPriceChart (`src/components/rmo-charts.tsx`)
  - [ ] RmoScheduleChart (`src/components/rmo-charts.tsx`)
  - [ ] RmoOptimizationChart (`src/components/rmo-charts.tsx`)

- [ ] Storage Charts
  - [ ] StorageCapacityChart (`src/components/storage-charts.tsx`)
  - [ ] StoragePerformanceChart (`src/components/storage-charts.tsx`)

- [ ] Analytics Charts
  - [ ] PriceTrendsChart (`src/components/analytics-charts.tsx`)
  - [ ] VolumeAnalysisChart (`src/components/analytics-charts.tsx`)
  - [ ] PerformanceMetricsChart (`src/components/analytics-charts.tsx`)

- [ ] Consumption Charts
  - [ ] ConsumptionBySectorChart (`src/components/consumption-charts.tsx`)
  - [ ] DemandPatternChart (`src/components/consumption-charts.tsx`)

- [ ] Transmission Charts
  - [ ] TransmissionFlowChart (`src/components/transmission-charts.tsx`)
  - [ ] TransmissionLossesChart (`src/components/transmission-charts.tsx`)

- [ ] Generation Charts
  - [ ] GenerationCharts (`src/components/generation-charts.tsx`)

**Implementation Steps:**
1. Import export utilities in each component
2. Add export buttons to CardHeader
3. Create export handler functions
4. Define column mappings for each data type
5. Test downloads for each chart

**Files to Modify:**
- `src/components/dmo-charts.tsx`
- `src/components/rmo-charts.tsx`
- `src/components/storage-charts.tsx`
- `src/components/analytics-charts.tsx`
- `src/components/consumption-charts.tsx`
- `src/components/transmission-charts.tsx`
- `src/components/generation-charts.tsx`

---

#### 2. Real Data Integration for India Map
**Status:** Not Started
**Estimated Time:** 3-4 hours
**Description:** Connect India Map to real API data instead of simulated data

**Tasks:**
- [ ] Create API endpoint for state-wise capacity data
  - [ ] File: `src/app/api/capacity/states/route.ts`
  - [ ] Query ElectricityData table by state
  - [ ] Aggregate capacity by technology and state
  - [ ] Return formatted state capacity data

- [ ] Update IndiaMapSimple component to fetch real data
  - [ ] Add API call on component mount
  - [ ] Handle loading states
  - [ ] Handle errors with fallback to simulated data
  - [ ] Add refresh button

- [ ] Database Schema Enhancement
  - [ ] Add `state` column to ElectricityData table if missing
  - [ ] Create migration script
  - [ ] Seed with sample state data

**Implementation:**
```typescript
// API Endpoint
GET /api/capacity/states
Response: {
  success: true,
  data: [
    { state: "Maharashtra", capacity_mw: 35240, percentage: 12.45, rank: 1 },
    ...
  ]
}
```

---

#### 3. Fix Content Security Policy (CSP) Headers
**Status:** Not Started
**Estimated Time:** 1 hour
**Description:** Ensure proper CSP headers are set to prevent security issues

**Tasks:**
- [ ] Review current CSP configuration
- [ ] Add CSP headers to Next.js config
- [ ] Test all components for CSP compliance
- [ ] Document allowed sources

**File to Create/Modify:**
- `next.config.js` or `next.config.mjs`

**Implementation:**
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}
```

---

### 🟠 **HIGH PRIORITY**

#### 4. Implement Batch Export Functionality
**Status:** Not Started
**Estimated Time:** 2 hours
**Description:** Allow users to export all dashboard data at once

**Tasks:**
- [ ] Create batch export API endpoint
  - [ ] File: `src/app/api/export/batch/route.ts`
  - [ ] Aggregate data from all modules
  - [ ] Generate ZIP file with multiple CSV/Excel files

- [ ] Add "Export All" button to main dashboard header
- [ ] Create progress indicator for large exports
- [ ] Add format selection (CSV, Excel, JSON, ZIP)

**Features:**
- Export includes:
  - DMO data (all three charts)
  - RMO data (all three charts)
  - Storage data
  - Analytics data
  - Capacity data
  - Generation data
  - Consumption data

---

#### 5. Add Data Refresh Functionality to All Charts
**Status:** Partial (KPI has refresh)
**Estimated Time:** 2 hours
**Description:** Add refresh buttons to all chart components for manual data updates

**Tasks:**
- [ ] Add RefreshCw icon button to each chart header
- [ ] Implement refresh handler for each chart
- [ ] Add loading state during refresh
- [ ] Show timestamp of last update
- [ ] Add auto-refresh option with interval selector

**Components to Update:**
- All chart components listed in Task #1

---

#### 6. Enhance Error Handling and User Feedback
**Status:** Not Started
**Estimated Time:** 2-3 hours
**Description:** Improve error messages and user notifications

**Tasks:**
- [ ] Create centralized error handling utility
- [ ] Add toast notifications for success/error states
- [ ] Implement retry logic for failed API calls
- [ ] Add error boundaries for React components
- [ ] Create user-friendly error messages

**Files to Create:**
- `src/lib/error-handler.ts`
- `src/components/error-boundary.tsx`
- `src/components/toast-notification.tsx`

---

#### 7. Implement Data Caching Strategy
**Status:** Not Started
**Estimated Time:** 3 hours
**Description:** Cache API responses to improve performance

**Tasks:**
- [ ] Implement browser localStorage caching
- [ ] Add cache invalidation logic
- [ ] Set appropriate cache TTL (Time To Live)
- [ ] Add cache bypass option for real-time data
- [ ] Create cache management UI

**Implementation:**
- Use React Query or SWR for data fetching
- Cache API responses with timestamps
- Invalidate cache on user action or time expiry

---

### 🟡 **MEDIUM PRIORITY**

#### 8. Add Data Filtering to India Map
**Status:** Not Started
**Estimated Time:** 2 hours
**Description:** Allow users to filter states by capacity, technology, or region

**Tasks:**
- [ ] Add filter controls above the map
- [ ] Implement filters:
  - [ ] Capacity range slider
  - [ ] Technology type checkboxes
  - [ ] Region selector
  - [ ] Search by state name

- [ ] Update map visualization based on filters
- [ ] Show/hide filtered states
- [ ] Add "Clear Filters" button

---

#### 9. Implement Chart Comparison Mode
**Status:** Not Started
**Estimated Time:** 3 hours
**Description:** Allow users to compare data across different time periods or categories

**Tasks:**
- [ ] Add comparison toggle to charts
- [ ] Implement side-by-side view
- [ ] Add date range pickers for time comparison
- [ ] Highlight differences and trends
- [ ] Export comparison data

**Features:**
- Compare:
  - Month-over-month
  - Year-over-year
  - State vs State
  - Technology vs Technology

---

#### 10. Create Dashboard Widgets/Customization
**Status:** Not Started
**Estimated Time:** 4 hours
**Description:** Allow users to customize their dashboard layout

**Tasks:**
- [ ] Create drag-and-drop widget system
- [ ] Save user preferences to localStorage/database
- [ ] Add widget resize functionality
- [ ] Create widget gallery for selection
- [ ] Implement dashboard presets (default, analyst, manager)

**Libraries to Consider:**
- react-grid-layout
- react-beautiful-dnd

---

#### 11. Add Chart Zoom and Pan Functionality
**Status:** Not Started
**Estimated Time:** 2 hours
**Description:** Enable users to zoom into specific data ranges

**Tasks:**
- [ ] Add zoom controls to line/bar charts
- [ ] Implement pan functionality
- [ ] Add reset zoom button
- [ ] Enable pinch-to-zoom on mobile
- [ ] Add zoom level indicator

**Implementation:**
- Use Recharts zoom/pan features
- Add custom zoom controls

---

#### 12. Implement Advanced Search and Filter
**Status:** Not Started
**Estimated Time:** 3 hours
**Description:** Global search and advanced filtering across all data

**Tasks:**
- [ ] Create global search bar in header
- [ ] Implement search across:
  - [ ] States
  - [ ] Technologies
  - [ ] Contracts
  - [ ] Time periods
  - [ ] Data points

- [ ] Add autocomplete suggestions
- [ ] Show search results in dropdown
- [ ] Navigate to relevant chart/section

---

### 🟢 **LOW PRIORITY (Future Enhancements)**

#### 13. Add PDF Export with Charts
**Status:** Not Started
**Estimated Time:** 4 hours
**Description:** Generate PDF reports with embedded charts

**Tasks:**
- [ ] Integrate PDF generation library (jsPDF, pdfmake)
- [ ] Create PDF templates
- [ ] Capture charts as images
- [ ] Add custom branding/headers
- [ ] Include data tables
- [ ] Add export to email option

---

#### 14. Implement Data Import Wizard
**Status:** Partial (Sandbox has upload)
**Estimated Time:** 3 hours
**Description:** Improve data upload experience with guided wizard

**Tasks:**
- [ ] Create multi-step wizard
- [ ] Add file validation
- [ ] Preview data before import
- [ ] Map columns automatically
- [ ] Handle errors gracefully
- [ ] Show import progress

---

#### 15. Add Mobile App View
**Status:** Partial (Responsive design exists)
**Estimated Time:** 5 hours
**Description:** Optimize dashboard for mobile devices

**Tasks:**
- [ ] Create mobile-specific layouts
- [ ] Optimize charts for small screens
- [ ] Add touch gestures
- [ ] Implement bottom navigation
- [ ] Create mobile menu
- [ ] Test on various devices

---

#### 16. Implement User Preferences
**Status:** Not Started
**Estimated Time:** 2 hours
**Description:** Save and restore user settings

**Tasks:**
- [ ] Create preferences page
- [ ] Add settings:
  - [ ] Default date range
  - [ ] Preferred units (MW/GW)
  - [ ] Theme (light/dark)
  - [ ] Chart colors
  - [ ] Auto-refresh interval
  - [ ] Default filters

- [ ] Save to localStorage/database
- [ ] Sync across devices (if auth added)

---

#### 17. Add Historical Data View
**Status:** Not Started
**Estimated Time:** 3 hours
**Description:** View and analyze historical trends

**Tasks:**
- [ ] Create time-series viewer
- [ ] Add timeline slider
- [ ] Show historical comparisons
- [ ] Implement playback mode
- [ ] Export historical data

---

#### 18. Implement Alerts and Notifications System
**Status:** Partial (Notifications panel exists)
**Estimated Time:** 4 hours
**Description:** Enhanced notification system with custom alerts

**Tasks:**
- [ ] Create alert configuration UI
- [ ] Define alert rules:
  - [ ] Threshold alerts (capacity, price, etc.)
  - [ ] Anomaly detection alerts
  - [ ] Scheduled alerts
  
- [ ] Add notification preferences
- [ ] Implement email/SMS notifications
- [ ] Create alert history

---

#### 19. Add Data Visualization Gallery
**Status:** Not Started
**Estimated Time:** 2 hours
**Description:** Showcase different chart types and examples

**Tasks:**
- [ ] Create gallery page
- [ ] Add chart type selector
- [ ] Show sample data
- [ ] Add code examples
- [ ] Include best practices guide

---

#### 20. Implement Collaborative Features
**Status:** Not Started
**Estimated Time:** 6 hours
**Description:** Allow users to share dashboards and insights

**Tasks:**
- [ ] Add user authentication
- [ ] Create sharing functionality
- [ ] Add comments on charts
- [ ] Implement annotations
- [ ] Create shared workspaces
- [ ] Add version history

---

#### 21. Create API Documentation
**Status:** Not Started
**Estimated Time:** 2 hours
**Description:** Document all API endpoints

**Tasks:**
- [ ] Create API documentation page
- [ ] Use Swagger/OpenAPI
- [ ] Add example requests/responses
- [ ] Include authentication details
- [ ] Add rate limiting info

**File to Create:**
- `API_DOCUMENTATION.md`

---

#### 22. Add Unit Tests
**Status:** Not Started
**Estimated Time:** 8 hours
**Description:** Write comprehensive unit tests

**Tasks:**
- [ ] Set up testing framework (Jest, React Testing Library)
- [ ] Write tests for:
  - [ ] Components (50+ components)
  - [ ] Utility functions
  - [ ] API endpoints
  - [ ] Export functions
  - [ ] Data generators

- [ ] Achieve >80% code coverage
- [ ] Add CI/CD integration

---

#### 23. Performance Optimization
**Status:** Not Started
**Estimated Time:** 4 hours
**Description:** Optimize app performance

**Tasks:**
- [ ] Implement code splitting
- [ ] Lazy load components
- [ ] Optimize images
- [ ] Reduce bundle size
- [ ] Add service worker for PWA
- [ ] Implement virtual scrolling for large lists

---

#### 24. Add Geographic Map View (Alternative)
**Status:** Not Started
**Estimated Time:** 5 hours
**Description:** Add actual geographic map as alternative to grid view

**Tasks:**
- [ ] Integrate mapping library (Leaflet, Mapbox)
- [ ] Create India GeoJSON boundaries
- [ ] Host map tiles locally
- [ ] Add toggle between grid and map view
- [ ] Implement map interactions
- [ ] Add layer controls

**Note:** Use self-hosted tiles to avoid CSP issues

---

#### 25. Implement Data Quality Dashboard Enhancements
**Status:** Partial (Basic dashboard exists)
**Estimated Time:** 3 hours
**Description:** Enhanced data quality monitoring

**Tasks:**
- [ ] Add more quality metrics
- [ ] Create data lineage visualization
- [ ] Implement data validation rules
- [ ] Add automated quality checks
- [ ] Create quality score algorithm
- [ ] Generate quality reports

---

## 📊 Progress Tracking

### Overall Progress
- ✅ **Completed:** 10 tasks
- 🔄 **In Progress:** 0 tasks
- ⏳ **Not Started:** 25 tasks
- **Total Tasks:** 35 tasks

### Progress by Priority
- 🔴 Critical: 0/3 remaining (0% complete)
- 🟠 High: 0/4 remaining (0% complete)
- 🟡 Medium: 0/5 remaining (0% complete)
- 🟢 Low: 0/13 remaining (0% complete)

---

## 🎯 Recommended Next Steps

### Week 1 Focus (High ROI Tasks):
1. ✅ Add Export to All Charts (#1) - **3 hours**
2. ✅ Real Data Integration for India Map (#2) - **4 hours**
3. ✅ Data Refresh Functionality (#5) - **2 hours**
4. ✅ Error Handling Enhancement (#6) - **3 hours**

**Total Estimated Time:** 12 hours

### Week 2 Focus:
5. ✅ Batch Export (#4) - **2 hours**
6. ✅ Data Caching (#7) - **3 hours**
7. ✅ CSP Headers (#3) - **1 hour**
8. ✅ Data Filtering for Map (#8) - **2 hours**

**Total Estimated Time:** 8 hours

### Week 3 Focus:
9. ✅ Chart Comparison Mode (#9) - **3 hours**
10. ✅ Dashboard Customization (#10) - **4 hours**
11. ✅ Advanced Search (#12) - **3 hours**

**Total Estimated Time:** 10 hours

---

## 📝 Notes

### Technical Debt:
- Remove unused dependencies
- Update outdated packages
- Refactor duplicate code
- Standardize error handling
- Improve TypeScript types

### Security Considerations:
- Implement authentication/authorization
- Add rate limiting
- Sanitize user inputs
- Secure API endpoints
- Add CSRF protection

### Performance Goals:
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Score > 90
- Bundle size < 1MB

---

## 🤝 How to Contribute

### For Developers:
1. Pick a task from this list
2. Create a new branch: `git checkout -b feature/task-name`
3. Implement the feature
4. Write tests
5. Update documentation
6. Submit pull request

### Task Assignment Format:
```markdown
**Assignee:** [Your Name]
**Start Date:** YYYY-MM-DD
**Target Completion:** YYYY-MM-DD
**Status:** In Progress
```

---

## 📞 Contact & Support

**Project Lead:** [Your Name]
**Repository:** [GitHub URL]
**Documentation:** See FIXES_SUMMARY.md, INDIA_MAP_GUIDE.md
**Issues:** [GitHub Issues URL]

---

*Last Updated: October 3, 2025*
*Document Version: 1.0*
*Next Review: Weekly*
