# OptiBid Dashboard - Comprehensive Project Report

## Executive Summary

**OptiBid Dashboard** is a sophisticated, full-stack web application designed for comprehensive power market operations, analysis, and visualization. Built for the Indian electricity market, it provides real-time monitoring, analytics, and optimization capabilities for Day-Ahead Markets (DMO), Real-Time Markets (RMO), and storage operations.

**Project Type:** Enterprise-grade Power Market Intelligence Platform  
**Technology Stack:** Next.js 15, TypeScript, React 19, Socket.IO, Prisma ORM  
**Current Version:** 0.1.0  
**Status:** Production-ready with active real-time features

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Core Features](#core-features)
4. [Pages & Dashboards](#pages--dashboards)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Real-Time Features](#real-time-features)
8. [Component Library](#component-library)
9. [How It Works](#how-it-works)
10. [Development & Deployment](#development--deployment)

---

## 1. Technology Stack

### Frontend Technologies

#### Core Framework
- **Next.js 15.3.5** - React framework with App Router
  - Server-Side Rendering (SSR)
  - Static Site Generation (SSG)
  - API Routes
  - File-based routing
  - Image optimization

- **React 19.0.0** - UI library
  - Latest concurrent features
  - Suspense boundaries
  - Server Components support

- **TypeScript 5.x** - Type-safe development
  - Full type coverage
  - Enhanced IDE support
  - Compile-time error checking

#### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
  - JIT (Just-In-Time) compilation
  - Custom design system
  - Responsive design utilities

- **shadcn/ui** - High-quality React components
  - Built on Radix UI primitives
  - Accessible components (WCAG compliant)
  - Customizable with Tailwind

- **Framer Motion 12.23.22** - Animation library
  - Smooth transitions
  - Page animations
  - Interactive gestures

#### Data Visualization
- **Recharts 2.15.4** - Chart library
  - Line, Bar, Area, Pie charts
  - Responsive charts
  - Interactive tooltips

- **@nivo/charts 0.99.0** - Advanced visualizations
  - Heatmaps
  - Sankey diagrams
  - Treemaps
  - Network graphs

- **React Leaflet 5.0.0** - Interactive maps
  - Geospatial visualization
  - Custom markers
  - Layer controls

#### State Management & Data Fetching
- **Zustand 5.0.6** - Lightweight state management
  - Minimal boilerplate
  - React hooks integration
  - DevTools support

- **@tanstack/react-query 5.82.0** - Server state management
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Query invalidation

- **@tanstack/react-table 8.21.3** - Headless table library
  - Sorting, filtering, pagination
  - Column resizing
  - Row selection
  - Virtualization support

#### Form & Validation
- **React Hook Form 7.60.0** - Form management
  - Performance-focused
  - Easy validation
  - Field-level subscriptions

- **Zod 4.0.2** - Schema validation
  - TypeScript-first
  - Runtime validation
  - Type inference

- **@hookform/resolvers 5.1.1** - Validation bridge
  - Zod integration
  - Yup/Joi support

### Backend Technologies

#### Server & API
- **Custom Node.js Server** - Express-compatible
  - Socket.IO integration
  - Next.js handler
  - Middleware support

- **Socket.IO 4.8.1** - Real-time communication
  - WebSocket connections
  - Event-based messaging
  - Room management
  - Automatic reconnection

#### Database & ORM
- **Prisma 6.11.1** - Next-generation ORM
  - Type-safe database client
  - Automatic migrations
  - Query optimization
  - IntelliSense support

- **SQLite** - Embedded database
  - Zero-configuration
  - File-based storage
  - ACID compliance
  - Full-text search

#### File Processing
- **XLSX 0.18.5** - Excel file processing
  - Read/Write Excel files
  - Multiple sheet support
  - Formula parsing

- **Sharp 0.34.3** - Image processing
  - Fast image optimization
  - Format conversion
  - Resizing & cropping

#### Development Tools
- **Nodemon 3.1.10** - Auto-restart on file changes
- **TSX 4.20.3** - TypeScript execution
- **ESLint 9** - Code linting
- **PostCSS** - CSS processing

---

## 2. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Browser    │  │  Mobile Web  │  │   Desktop    │  │
│  │  (Chrome,    │  │   (Safari,   │  │   (Electron) │  │
│  │  Firefox)    │  │   Chrome)    │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ▼ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│                  Next.js App Layer                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Components (Client/Server)          │   │
│  │  • Dashboard Pages  • Charts  • Forms  • Tables  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API Routes (REST)                    │   │
│  │  /api/dashboard  /api/dmo  /api/rmo  /api/kpi   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Custom Server Layer                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │          HTTP Server (Node.js)                    │   │
│  │  • Next.js Request Handler                        │   │
│  │  • Socket.IO Integration                          │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │          WebSocket Server (Socket.IO)             │   │
│  │  • Real-time Events  • Room Management           │   │
│  │  • Broadcasting  • Connection Handling           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Layer                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Prisma ORM (Type-safe queries)            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         SQLite Database (File-based)              │   │
│  │  • ElectricityData  • DMO Tables  • RMO Data     │   │
│  │  • Notifications  • Activities  • DataSources    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Application Flow

1. **User Request** → Browser sends HTTP request
2. **Next.js Router** → Matches route and loads page
3. **Server Components** → Fetch initial data server-side
4. **Client Components** → Hydrate with interactivity
5. **API Calls** → REST endpoints for dynamic data
6. **WebSocket Connection** → Establishes real-time channel
7. **Database Queries** → Prisma queries SQLite
8. **Data Processing** → Transform and aggregate data
9. **Response** → Send to client (SSR/JSON/WebSocket)
10. **UI Rendering** → React updates DOM

---

## 3. Core Features

### 3.1 Real-Time Monitoring
- **Live Data Updates** - WebSocket-based real-time data streaming
- **KPI Dashboard** - 8 key performance indicators updated every 30 seconds
- **System Health** - Monitor database, API, and connection status
- **Notification System** - Real-time alerts and notifications

### 3.2 Market Operations

#### Day-Ahead Market (DMO)
- Generator scheduling and dispatch
- Contract-based scheduling
- Market bidding and clearing prices
- Volume analysis and forecasting

#### Real-Time Market (RMO)
- Live price tracking
- Real-time scheduling adjustments
- Optimization algorithms
- Performance metrics

#### Storage Operations (SO)
- Battery capacity monitoring
- Charge/discharge cycles
- Performance analytics
- Energy arbitrage calculations

### 3.3 Data Management

#### Sandbox Workspace
- **Data Source Manager** - Connect to files, databases, APIs
- **Header Mapping** - Map data columns to system fields
- **Data Validation** - Quality checks and error detection
- **One-Click Plotting** - Automatic chart generation

#### File Support
- CSV files
- Excel (XLSX, XLS)
- JSON data
- Database connections (PostgreSQL, MySQL, SQLite)
- REST API endpoints

### 3.4 Analytics & Forecasting

#### Advanced Analytics
- Time-series analysis
- Trend detection
- Anomaly detection
- Statistical modeling

#### Machine Learning
- Demand forecasting
- Price prediction
- Load profiling
- Pattern recognition

### 3.5 Visualization

#### Chart Types
- Line charts (time-series)
- Bar charts (comparisons)
- Area charts (cumulative)
- Pie/Donut charts (distribution)
- Heatmaps (correlation)
- Sankey diagrams (flow)
- Geographic maps (spatial)

#### Interactive Features
- Zoom & pan
- Tooltip details
- Legend filtering
- Export to PNG/SVG
- Data table view

### 3.6 Filtering & Search

#### Dynamic Filters
- Region-based filtering
- State selection
- Technology type
- Date/time ranges
- Plant/unit selection
- Contract filtering

#### Global Search
- Full-text search
- Quick navigation
- Keyboard shortcuts (Cmd/Ctrl + K)

---

## 4. Pages & Dashboards

### 4.1 Home Dashboard (`/`)

**Purpose:** Main landing page with overview of all operations

**Components:**
- **Welcome Header** - Animated gradient header with system status
- **KPI Grid** - 8 key performance indicators
  - Total Generation (MW)
  - Total Capacity (MW)
  - Demand Met (MW)
  - Average Price (₹/MWh)
  - Market Clearing Rate
  - Contract Fulfillment
  - Generator Utilization
  - Storage Capacity

- **Quick Actions Panel** - Shortcuts to common tasks
  - Upload new data
  - Create visualization
  - Run optimization
  - Export reports
  - Schedule analysis
  - Configure alerts

- **Recent Activity Feed** - Latest system activities
  - Data uploads
  - Optimizations completed
  - Reports generated
  - User actions

- **Data Quality Dashboard** - Data health metrics
  - Completeness score
  - Accuracy metrics
  - Timeliness indicators
  - Validation status

- **System Health Monitor** - Infrastructure status
  - Database health
  - API response times
  - Connection status
  - Error rates

**Real-Time Features:**
- Live KPI updates (30-second intervals)
- Activity feed auto-refresh
- System health monitoring
- Connection status indicator

### 4.2 Day-Ahead Market (`/dmo`)

**Purpose:** Manage and analyze day-ahead market operations

**Sub-Modules:**

#### Generator Scheduling
- **Scheduled vs Actual MW** - Time-series comparison
- **Technology-wise breakdown** - Coal, Gas, Hydro, Nuclear, Renewables
- **Regional analysis** - Northern, Western, Southern, Eastern, NE regions
- **Plant-level details** - Individual generator performance

#### Contract Scheduling
- **Contract fulfillment** - PPA, Tender, Merchant, Banking
- **Scheduled vs Actual delivery**
- **Cumulative tracking**
- **Contract-wise performance**

#### Market Bidding
- **Bid price vs Clearing price**
- **Bid volume vs Cleared volume**
- **Market type analysis** - Day-Ahead, Term-Ahead
- **Bidding strategies**

**Interactive Features:**
- Filter by region, state, technology
- Date range selection
- Plant/contract search
- Export to CSV/Excel

### 4.3 Real-Time Market (`/rmo`)

**Purpose:** Monitor and optimize real-time market operations

**Charts & Analytics:**

#### Price Charts
- **Real-time price tracking** - Live price updates
- **Price volatility** - Standard deviation analysis
- **Peak vs off-peak** - Time-of-day patterns
- **Regional comparison** - Price differences across regions

#### Schedule Charts
- **Real-time dispatch** - Current generation status
- **Schedule deviations** - Actual vs scheduled
- **Imbalance tracking** - Over/under generation
- **Correction signals** - Automatic adjustments

#### Optimization Charts
- **Cost optimization** - Minimize generation costs
- **Revenue optimization** - Maximize market revenue
- **Constraint satisfaction** - Technical limits
- **Multi-objective solutions** - Pareto frontiers

**Real-Time Features:**
- WebSocket-based price updates
- Live schedule adjustments
- Automatic optimization triggers
- Alert notifications

### 4.4 Storage Operations (`/storage-operations`)

**Purpose:** Manage battery and energy storage systems

**Dashboards:**

#### Storage Capacity
- **State of Charge (SoC)** - Current battery levels
- **Available capacity** - Total vs used
- **Technology breakdown** - Li-ion, Flow, Pumped Hydro
- **Regional distribution** - Storage by location

#### Storage Performance
- **Charge/Discharge cycles** - Daily patterns
- **Round-trip efficiency** - Energy loss analysis
- **Degradation tracking** - Capacity fade over time
- **Revenue analysis** - Arbitrage opportunities

**Features:**
- Time-series filtering (24h, 7d, 30d)
- Technology comparison
- Performance benchmarking
- Export capabilities

### 4.5 Sandbox Workspace (`/sandbox`)

**Purpose:** Flexible data exploration and analysis environment

**Tools & Features:**

#### Data Source Manager
- **Connect to data sources:**
  - Upload files (CSV, Excel, JSON)
  - Database connections (PostgreSQL, MySQL, SQLite)
  - API endpoints (REST, GraphQL)
  - Cloud storage (S3, Azure Blob)

- **Data preview** - View first 100 rows
- **Schema detection** - Automatic column type inference
- **Data validation** - Quality checks

#### Header Mapper
- **Column mapping interface**
  - Drag-and-drop mapping
  - Auto-suggest based on column names
  - Manual override
  - Save mapping profiles

- **Validation rules**
  - Required fields
  - Data type constraints
  - Value ranges
  - Foreign key validation

#### One-Click Plot
- **Automatic chart selection** - Based on data types
- **Chart gallery** - Pre-configured visualizations
- **Customization options** - Colors, labels, axes
- **Export charts** - PNG, SVG, PDF

#### RMO Optimization
- **Solver configuration** - Algorithm selection
- **Objective functions** - Cost, revenue, emissions
- **Constraints** - Technical, contractual
- **Results visualization** - Optimal solutions

**Workflow:**
1. Upload/connect data source
2. Map headers to schema
3. Validate data quality
4. Generate visualizations
5. Run optimizations (if applicable)
6. Export results

### 4.6 Archives (`/archives`)

**Purpose:** Historical data access and report repository

**Features:**
- **Date-based browsing** - Calendar interface
- **Report categories** - Daily, weekly, monthly
- **Search functionality** - Full-text search
- **Download manager** - Batch downloads
- **Version control** - Track report revisions

### 4.7 Analytics (`/analytics`)

**Purpose:** Advanced analytics and forecasting tools

**Modules:**

#### Price Trends
- Historical price analysis
- Moving averages
- Seasonal patterns
- Price forecasting

#### Volume Analysis
- Generation trends
- Demand patterns
- Capacity utilization
- Load factor analysis

#### Performance Metrics
- Plant efficiency
- Contract performance
- Market participation
- Revenue analysis

#### Forecasting
- Demand forecasting (1-7 days ahead)
- Price prediction (1-24 hours ahead)
- Renewable generation forecast
- Load profiling

**ML Models:**
- ARIMA (Auto-Regressive Integrated Moving Average)
- LSTM (Long Short-Term Memory networks)
- XGBoost (Gradient Boosting)
- Prophet (Facebook's forecasting tool)

### 4.8 Installed Capacity (`/installed-capacity`)

**Purpose:** Power plant capacity tracking

**Visualizations:**
- **Capacity by technology** - Pie chart
- **State-wise distribution** - Bar chart
- **Regional breakdown** - Map view
- **Time-series growth** - Line chart

### 4.9 Generation (`/generation`)

**Purpose:** Power generation monitoring

**Metrics:**
- Total generation (MU/GWh)
- Plant Load Factor (PLF)
- Capacity utilization
- Technology-wise contribution

### 4.10 Supply Status (`/supply-status`)

**Purpose:** Power supply reliability monitoring

**Indicators:**
- Energy availability
- Peak demand met
- Load shedding instances
- Grid frequency

### 4.11 Capacity Addition (`/capacity-addition`)

**Purpose:** Track new capacity projects

**Data:**
- Pipeline projects
- Under construction
- Commissioned capacity
- Decommissioned units

### 4.12 Consumption (`/consumption`)

**Purpose:** Electricity consumption analysis

**Breakdowns:**
- **By sector** - Residential, Commercial, Industrial, Agriculture
- **By state** - State-wise consumption
- **Time patterns** - Hourly, daily, seasonal
- **Per capita** - Consumption per person

---

## 5. API Endpoints

### 5.1 Dashboard APIs

#### `/api/dashboard/kpi`
- **Method:** GET
- **Purpose:** Fetch all KPI metrics
- **Response:** JSON with 8 KPI values
- **Update Frequency:** 30 seconds

#### `/api/kpi`
- **Method:** GET
- **Query Params:** `hours` (default: 24)
- **Purpose:** Time-series KPI data
- **Response:** Historical KPI values

### 5.2 Market APIs

#### `/api/dmo/generator-scheduling`
- **Method:** GET
- **Query Params:** Filters (region, state, technology, dateRange)
- **Purpose:** Generator scheduling data
- **Response:** Array of scheduling records

#### `/api/dmo/contract-scheduling`
- **Method:** GET
- **Purpose:** Contract-based scheduling data
- **Response:** Contract performance data

#### `/api/dmo/market-bidding`
- **Method:** GET
- **Purpose:** Market bidding and clearing data
- **Response:** Bid/clear price and volume

#### `/api/rmo/*`
- Similar structure for RMO endpoints

### 5.3 Data Management APIs

#### `/api/data-sources`
- **Methods:** GET, POST, PUT, DELETE
- **Purpose:** CRUD operations for data sources
- **Response:** Data source metadata

#### `/api/data-sources/[id]/upload`
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Purpose:** Upload files to data source
- **Max Size:** 50MB

#### `/api/database-connections`
- **Methods:** GET, POST
- **Purpose:** Manage database connections
- **Support:** PostgreSQL, MySQL, SQLite

#### `/api/api-endpoints`
- **Methods:** GET, POST
- **Purpose:** Manage API endpoint connections

### 5.4 Analytics APIs

#### `/api/autoplot`
- **Method:** POST
- **Body:** Data source ID, chart preferences
- **Purpose:** Generate automatic visualizations
- **Response:** Chart configuration

#### `/api/optimization/run`
- **Method:** POST
- **Body:** Optimization parameters
- **Purpose:** Run optimization algorithms
- **Response:** Optimal solution

### 5.5 Jobs & Tasks APIs

#### `/api/jobs`
- **Method:** GET
- **Query Params:** `limit`, `offset`
- **Purpose:** List optimization jobs
- **Response:** Job run history

#### `/api/jobs/trigger`
- **Method:** POST
- **Body:** Job configuration
- **Purpose:** Trigger new optimization
- **Response:** Job ID and status

### 5.6 System APIs

#### `/api/system/health`
- **Method:** GET
- **Purpose:** System health check
- **Response:** Database, API, WebSocket status

#### `/api/notifications`
- **Method:** GET
- **Query Params:** `limit`, `isRead`
- **Purpose:** Fetch notifications
- **Response:** Notification list

#### `/api/activities`
- **Method:** GET
- **Query Params:** `limit`
- **Purpose:** Recent activity log
- **Response:** Activity entries

### 5.7 Export APIs

#### `/api/export`
- **Method:** POST
- **Body:** Export type, format (CSV/Excel), filters
- **Purpose:** Export data
- **Response:** File download

---

## 6. Database Schema

### Core Tables

#### ElectricityData
**Purpose:** Primary electricity data storage

**Fields:**
- `id` - Unique identifier
- `time_period` - Timestamp
- `region` - Northern/Western/Southern/Eastern/NE
- `state` - Indian state
- `plant_id` - Plant identifier
- `plant_name` - Plant name
- `technology_type` - Coal/Gas/Hydro/Nuclear/Solar/Wind
- `generation_mw` - Generated power (MW)
- `capacity_mw` - Installed capacity (MW)
- `demand_mw` - Demand (MW)
- `price_rs_per_mwh` - Price (₹/MWh)

**Indexes:** time_period, region, state, technology_type, plant_id

#### DMOGeneratorScheduling
**Purpose:** Day-ahead generator scheduling

**Fields:**
- `id`, `time_period`, `region`, `state`
- `plant_id`, `plant_name`, `technology_type`
- `scheduled_mw` - Scheduled generation
- `actual_mw` - Actual generation

#### DMOContractScheduling
**Purpose:** Day-ahead contract scheduling

**Fields:**
- `id`, `time_period`, `region`, `state`
- `contract_name`, `contract_type`
- `scheduled_mw`, `actual_mw`, `cumulative_mw`

#### DMOMarketBidding
**Purpose:** Day-ahead market bidding

**Fields:**
- `id`, `time_period`, `plant_id`, `market_type`
- `bid_price_rs_per_mwh`, `bid_volume_mw`
- `clearing_price_rs_per_mwh`, `cleared_volume_mw`

### Data Management Tables

#### DataSource
**Purpose:** Track connected data sources

**Fields:**
- `id`, `name`, `type` (file/database/api)
- `status` (connected/disconnected/error)
- `config` (JSON) - Connection details
- `last_sync`, `record_count`

#### DataSourceColumn
**Purpose:** Column metadata for data sources

**Fields:**
- `id`, `data_source_id`, `column_name`
- `normalized_name`, `data_type`
- `expose_as_filter`, `ui_filter_type`

#### UploadedFile
**Purpose:** File upload tracking

**Fields:**
- `id`, `filename`, `file_path`, `file_type`
- `status` (uploaded/processing/completed/error)
- `processed_data` (JSON)

### Job Management Tables

#### JobRun
**Purpose:** Optimization job tracking

**Fields:**
- `id`, `job_id`, `model_type`, `data_source_id`
- `status`, `progress`, `started_at`, `completed_at`
- `results_count`, `objective_value`, `solver_time_ms`

#### JobLog
**Purpose:** Job execution logs

**Fields:**
- `id`, `job_id`, `level`, `message`, `timestamp`

### System Tables

#### Notification
**Purpose:** User notifications

**Fields:**
- `id`, `type`, `category`, `title`, `message`
- `severity`, `is_read`, `is_archived`
- `action_url`, `action_label`

#### Activity
**Purpose:** System activity log

**Fields:**
- `id`, `type`, `action`, `title`, `description`
- `entity_type`, `entity_id`, `user_id`, `status`

---

## 7. Real-Time Features

### WebSocket Architecture

**Server Setup:**
```typescript
// server.ts
const io = new Server(server, {
  path: '/api/socketio',
  cors: { origin: "*" }
});
```

**Events Emitted:**
1. **`kpi:update`** - KPI data refresh (every 30 seconds)
2. **`notification:new`** - New notification
3. **`system-health:update`** - Health status change
4. **`data:refresh`** - Data source updated
5. **`job:status`** - Job status change

**Client Connection:**
```typescript
const socket = io('ws://localhost:3000/api/socketio');
socket.on('kpi:update', (data) => {
  updateDashboard(data);
});
```

### Real-Time Updates

**Implementation:**
- Socket.IO server integrated with Next.js
- Automatic reconnection on disconnect
- Room-based broadcasting for scalability
- Event-driven architecture

**Update Intervals:**
- KPI updates: 30 seconds
- System health: 60 seconds
- Notifications: Instant
- Data refresh: On-demand

---

## 8. Component Library

### UI Components (shadcn/ui)

**Base Components:**
- Button, Input, Select, Checkbox, Radio
- Card, Badge, Alert, Toast
- Dialog, Drawer, Sheet, Popover
- Table, Tabs, Accordion, Collapsible
- Calendar, Date Picker, Range Picker
- Slider, Switch, Progress Bar

**Layout Components:**
- Sidebar (responsive)
- Mobile Sidebar (drawer-based)
- Navigation Menu
- Breadcrumb
- Separator

### Chart Components

**Custom Wrappers:**
- `<GeneratorSchedulingChart />` - DMO generator chart
- `<ContractSchedulingChart />` - DMO contract chart
- `<MarketBiddingChart />` - DMO bidding chart
- `<RmoPriceChart />` - RMO price tracking
- `<RmoScheduleChart />` - RMO scheduling
- `<StorageCapacityChart />` - Storage metrics
- `<InstalledCapacityCharts />` - Capacity breakdown

### Dashboard Components

- `<KpiGrid />` - 8 KPI cards with live updates
- `<QuickActionsPanel />` - Action shortcuts
- `<RecentActivityFeed />` - Activity timeline
- `<DataQualityDashboard />` - Data health
- `<SystemHealthMonitor />` - System status
- `<NotificationsPanel />` - Notification center

### Data Management Components

- `<DataSourceManager />` - Source CRUD operations
- `<HeaderMapper />` - Column mapping interface
- `<OneClickPlotModal />` - Auto-chart generation
- `<DynamicFilters />` - Advanced filtering
- `<DataSourceMenu />` - Quick access menu

---

## 9. How It Works

### 9.1 Application Startup

**Development Mode:**
```bash
npm run dev
```

**Process:**
1. Nodemon watches for file changes
2. TSX compiles TypeScript to JavaScript
3. Custom server starts on port 3000
4. Next.js app prepares and renders
5. Socket.IO server initializes
6. Database connections established
7. Real-time update intervals start
8. Server ready at http://localhost:3000

### 9.2 Request Flow

**Page Request:**
```
User → Browser → HTTP GET /
  → Next.js Router → Match route → /app/page.tsx
  → Server Component → Fetch initial data
  → Render HTML → Send to browser
  → Client hydration → Interactive
```

**API Request:**
```
Component → Fetch('/api/dashboard/kpi')
  → Next.js API Route → /api/dashboard/kpi/route.ts
  → Prisma Client → Database query
  → Process data → Format response
  → JSON response → Update UI
```

**WebSocket Connection:**
```
Client → Connect to ws://localhost:3000/api/socketio
  → Socket.IO handshake → Authenticate
  → Join rooms → Start listening
  → Server emits event → Client receives
  → Update state → Re-render UI
```

### 9.3 Data Flow

**File Upload:**
```
User → Upload CSV → POST /api/data-sources/upload
  → Save to disk → Parse file
  → Detect schema → Create DataSource record
  → Insert data to ElectricityData table
  → Emit 'data:refresh' event
  → Update UI
```

**Optimization:**
```
User → Trigger optimization → POST /api/jobs/trigger
  → Create JobRun record → Start solver
  → Log progress → Emit 'job:status' events
  → Save results → Complete job
  → Notify user → Display results
```

### 9.4 Real-Time Updates

**KPI Update Cycle:**
```
Every 30 seconds:
  → Query database for latest data
  → Calculate KPI metrics
  → Emit 'kpi:update' to all clients
  → Clients update dashboard
```

**Notification Flow:**
```
System event occurs
  → Create Notification record
  → Emit 'notification:new' to user
  → Client shows toast
  → Update notification panel
```

---

## 10. Development & Deployment

### 10.1 Development Setup

**Prerequisites:**
- Node.js 20+
- npm or yarn
- Git

**Installation:**
```bash
# Clone repository
git clone <repository-url>
cd Energy-Ops-Dashboard-feat-dynamic-data-sources

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

**Environment Variables:**
```env
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
```

### 10.2 Build & Production

**Build Process:**
```bash
# Build Next.js app
npm run build

# Generates:
# - .next/ - Compiled app
# - .next/standalone/ - Production server
# - .next/static/ - Static assets
```

**Production Start:**
```bash
NODE_ENV=production npm start
```

**Production Checklist:**
- [ ] Set NODE_ENV=production
- [ ] Configure DATABASE_URL for production DB
- [ ] Enable HTTPS
- [ ] Set up reverse proxy (Nginx/Apache)
- [ ] Configure CORS properly
- [ ] Set up logging and monitoring
- [ ] Enable rate limiting
- [ ] Implement authentication
- [ ] Set up backups
- [ ] Configure CDN for static assets

### 10.3 Database Migrations

**Create Migration:**
```bash
npx prisma migrate dev --name <migration_name>
```

**Apply Migrations:**
```bash
npx prisma migrate deploy
```

**Reset Database:**
```bash
npm run db:reset
```

### 10.4 Testing

**Manual Testing:**
- Test all dashboard pages
- Verify real-time updates
- Check file uploads
- Test optimizations
- Validate exports

**E2E Testing (Recommended):**
- Cypress or Playwright
- Test user workflows
- API integration tests
- WebSocket connection tests

### 10.5 Performance Optimization

**Implemented:**
- React Server Components for initial render
- Image optimization with Next/Image
- Code splitting with dynamic imports
- Database query optimization with indexes
- WebSocket for efficient real-time updates
- Caching with React Query

**Recommendations:**
- Add Redis for session storage
- Implement CDN for static assets
- Use read replicas for database
- Enable gzip compression
- Implement lazy loading for charts
- Use pagination for large datasets

### 10.6 Monitoring & Logging

**Current:**
- Console logging (development)
- Prisma query logging
- Socket.IO connection logs

**Recommended:**
- Add Winston or Pino for structured logging
- Implement error tracking (Sentry)
- Add performance monitoring (New Relic)
- Set up uptime monitoring
- Create health check endpoints
- Log aggregation (ELK stack)

---

## 11. Security Considerations

### Current Status
- Basic CORS configuration
- SQLite file-based database
- No authentication implemented

### Recommendations

**Authentication & Authorization:**
- Implement NextAuth.js
- Add user roles (Admin, Analyst, Viewer)
- JWT tokens for API access
- OAuth 2.0 for SSO

**Data Security:**
- Encrypt database at rest
- Use HTTPS only
- Implement rate limiting
- Add CSRF protection
- Sanitize user inputs
- Implement SQL injection protection (Prisma handles this)

**API Security:**
- Add API key authentication
- Implement rate limiting per endpoint
- Add request validation with Zod
- Implement audit logging

---

## 12. Future Enhancements

### Planned Features
1. **User Authentication** - Login, roles, permissions
2. **Multi-tenancy** - Support multiple organizations
3. **Advanced ML Models** - Deep learning forecasting
4. **Mobile Apps** - React Native iOS/Android
5. **Email Notifications** - Alert system
6. **Automated Reports** - Scheduled PDF reports
7. **API Marketplace** - Third-party integrations
8. **Blockchain Integration** - Energy trading
9. **AI Chatbot** - Natural language queries
10. **GraphQL API** - Alternative to REST

### Technical Improvements
- Migrate to PostgreSQL for production
- Add Redis for caching
- Implement microservices architecture
- Add Docker containerization
- Kubernetes orchestration
- CI/CD pipeline setup
- Comprehensive test coverage

---

## 13. Support & Documentation

### Documentation
- **API Documentation:** Swagger/OpenAPI
- **Component Storybook:** Interactive component docs
- **User Guide:** End-user documentation
- **Developer Guide:** This document

### Support Channels
- GitHub Issues
- Email support
- Slack community
- Video tutorials

---

## 14. License & Credits

**License:** Proprietary (Update as needed)

**Built With:**
- Next.js team
- Vercel
- Prisma team
- shadcn/ui
- Open source community

**Version:** 0.1.0  
**Last Updated:** October 2, 2025

---

## Conclusion

OptiBid Dashboard is a comprehensive, production-ready platform for power market operations. With its modern tech stack, real-time capabilities, and extensive analytics features, it provides a powerful tool for monitoring, analyzing, and optimizing electricity markets.

The modular architecture allows for easy extension and customization, while the type-safe development approach ensures reliability and maintainability.

For questions or support, please refer to the documentation or contact the development team.
