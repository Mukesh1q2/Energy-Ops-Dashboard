# Dashboard Charts Not Working - Diagnosis & Fix Plan

## Problem Statement
User reports: **"None of the dashboard charts are working when I upload files"**

## Root Cause Analysis

### Charts Affected:
1. **Main Dashboard DMO Module Charts:**
   - Generator Scheduling Chart
   - Contract Scheduling Chart
   - Market Bidding Chart

2. **Dedicated `/dmo` Page:**
   - Market Snapshot Chart (already fixed with custom event listener)

### Key Findings:

#### 1. **API-First Approach with Fallback**
The DMO charts follow this pattern:
```typescript
fetchData() → API Call → If fails → Generate Simulated Data → Render Chart
```

#### 2. **Database Tables Exist But Are Empty**
- `DMOGeneratorScheduling` ✅ Model exists
- `DMOContractScheduling` ✅ Model exists
- `DMOMarketBidding` ✅ Model exists
- But tables are likely **empty** (no data uploaded yet)

#### 3. **API Returns Empty Arrays**
When no data exists:
- API returns: `{ success: true, data: [], total: 0 }`
- Chart receives empty data
- Fallback simulated data SHOULD trigger
- But chart might not be rendering simulated data properly

#### 4. **Possible Issues:**
- ❌ No upload UI for these specific tables
- ❌ Charts may not be falling back to simulated data correctly
- ❌ Toast context errors might break rendering
- ❌ Charts might be stuck in loading state

## Solution Strategy

### Phase 1: Immediate Fixes (High Priority) ⚡

#### Fix 1.1: Ensure Simulated Data Always Shows
**Problem:** Charts should show simulated data when API returns empty/fails  
**Status:** Code has this logic but might not be working

**Action:**
- Verify the fallback is actually executing
- Check console for errors
- Test with empty database

#### Fix 1.2: Add Upload Handlers for All DMO Tables
**Problem:** No way to upload data for generator/contract/bidding tables  
**Status:** Only market-snapshot has upload handler

**Files to Create:**
1. `/api/dmo/generator-scheduling/upload/route.ts` ✅ Created
2. `/api/dmo/contract-scheduling/upload/route.ts` - TODO
3. `/api/dmo/market-bidding/upload/route.ts` - TODO

#### Fix 1.3: Create Sample Data Generators
**Problem:** No test data to upload  
**Status:** Only market snapshot has generator

**Files to Create:**
1. `generate_dmo_generator_sample.py` ✅ Created
2. `generate_dmo_contract_sample.py` - TODO
3. `generate_dmo_bidding_sample.py` - TODO

### Phase 2: Enhanced Upload UI (Medium Priority) 📤

#### Fix 2.1: Add Upload Section to Main DMO Module
**Current:** Main dashboard DMO module (`activeModule === "dmo"`) only shows charts  
**Needed:** Add upload dropzone before charts

**Location:** `src/app/page.tsx` lines 660-686

**Enhancement:**
```typescript
{activeModule === "dmo" && (
  <div className="space-y-6">
    {/* ADD THIS: Upload Section */}
    <Card>
      <CardHeader>
        <CardTitle>Upload DMO Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs>
          <TabsList>
            <TabsTrigger value="generator">Generator Scheduling</TabsTrigger>
            <TabsTrigger value="contract">Contract Scheduling</TabsTrigger>
            <TabsTrigger value="bidding">Market Bidding</TabsTrigger>
          </TabsList>
          {/* Upload forms for each type */}
        </Tabs>
      </CardContent>
    </Card>
    
    {/* Existing charts */}
    <GeneratorSchedulingChart />
    <ContractSchedulingChart />
    <MarketBiddingChart />
  </div>
)}
```

###Phase 3: Debugging & Verification (Testing) 🔍

#### Test 3.1: Check Console for Errors
```javascript
// Open browser console and look for:
- "Error fetching generator scheduling data"
- "Using simulated data"
- Toast context errors
- React rendering errors
```

#### Test 3.2: Verify API Endpoints
```bash
# Test each endpoint manually:
curl "http://localhost:3000/api/dmo/generator-scheduling"
curl "http://localhost:3000/api/dmo/contract-scheduling"
curl "http://localhost:3000/api/dmo/market-bidding"

# Expected: { success: true, data: [], total: 0 }
```

#### Test 3.3: Upload Sample Data
```bash
# Generate sample files
python generate_dmo_generator_sample.py
python generate_dmo_contract_sample.py  # TODO
python generate_dmo_bidding_sample.py   # TODO

# Upload via API or UI
```

## Quick Fix: Force Simulated Data Display

If charts are completely broken, temporarily modify charts to ALWAYS show simulated data:

**File:** `src/components/dmo-charts.tsx`

**Change line ~110 (GeneratorSchedulingChart):**
```typescript
useEffect(() => {
  // TEMPORARY: Always show simulated data
  generateSimulatedData()
  // Comment out API call for now
  // fetchData()
}, [])
```

This ensures charts ALWAYS render something.

## Implementation Order

### Step 1: Verify Current State (5 min)
1. Open browser to `http://localhost:3000`
2. Navigate to DMO module
3. Open console
4. Check what errors appear
5. Check if charts show loading spinner forever or error message

### Step 2: Quick Win - Force Simulated Data (10 min)
1. Temporarily modify charts to always show simulated data
2. Verify charts render
3. This proves rendering works, issue is with data fetching

### Step 3: Create Upload Infrastructure (30 min)
1. Create remaining sample generators ✅ (generator done)
2. Create remaining upload handlers
3. Test upload flow

### Step 4: Add Upload UI (20 min)
1. Add upload section to main DMO module
2. Wire up to upload APIs
3. Test end-to-end

### Step 5: Remove Temporary Fixes (5 min)
1. Restore API calls in charts
2. Verify both real data and fallback simulated data work
3. Clean up debug logs

## Expected Behavior After Fix

### Scenario A: No Data Uploaded
- Charts should show simulated data
- Message: "Using simulated data"
- Charts are interactive and functional

### Scenario B: Data Uploaded
- Charts should show real uploaded data
- Message: "Data loaded successfully"
- Filters work to narrow down data

### Scenario C: API Error
- Charts should fallback to simulated data
- Error message in toast
- Charts still render (with simulated data)

## Files Changed/Created

### Created:
1. ✅ `generate_dmo_generator_sample.py`
2. ✅ `/api/dmo/generator-scheduling/upload/route.ts`
3. 🔄 `generate_dmo_contract_sample.py` (TODO)
4. 🔄 `generate_dmo_bidding_sample.py` (TODO)
5. 🔄 `/api/dmo/contract-scheduling/upload/route.ts` (TODO)
6. 🔄 `/api/dmo/market-bidding/upload/route.ts` (TODO)

### To Modify:
1. 🔄 `src/app/page.tsx` - Add upload UI to DMO module
2. 🔄 `src/components/dmo-charts.tsx` - Ensure fallback always works

## Testing Checklist

- [ ] Charts render with empty database (simulated data)
- [ ] API endpoints return valid responses
- [ ] Upload handlers accept and process Excel files
- [ ] Charts update after data upload
- [ ] Filters work correctly
- [ ] Export buttons work (CSV/Excel)
- [ ] Error handling works (invalid files, API failures)
- [ ] Toast notifications appear correctly

## Troubleshooting

### Issue: Charts Show Loading Forever
**Fix:** Check if `setLoading(false)` is called in finally block

### Issue: Charts Are Completely Blank
**Fix:** Check React console for rendering errors

### Issue: Data Uploads But Charts Don't Refresh
**Fix:** Add event listener or auto-refresh after upload

### Issue: Simulated Data Doesn't Show
**Fix:** Check if `generateSimulatedData()` is actually being called

---

**Next Action:** Run Step 1 (Verify Current State) to determine exact issue, then proceed with appropriate fix.
