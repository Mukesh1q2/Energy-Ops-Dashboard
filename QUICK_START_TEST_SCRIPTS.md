# Quick Start: Test Script Runner 🚀

## Prerequisites
- Backend server must be running (Socket.IO enabled)
- Database migrations applied
- Frontend dev server running

## 🎯 5-Minute Test Guide

### Step 1: Start the Application
```powershell
# Terminal 1 - Start backend
npm run dev

# Terminal 2 - Verify Socket.IO is running
# Check server logs for "Socket.IO initialized"
```

### Step 2: Navigate to Test Scripts
1. Open browser to `http://localhost:3000`
2. Go to **Sandbox** page
3. Click on **Test Scripts** tab (Flask icon)

### Step 3: Upload Your First Test Script
1. Drag and drop `test_sample.py` into the upload area
   - OR click to browse and select the file
2. (Optional) Add description: "Basic test script for validation"
3. Click **Upload Script** button
4. ✅ Success notification should appear

### Step 4: Run the Test Script
1. Find `test_sample.py` in the "Uploaded Scripts" panel
2. Click the **Run** button
3. Watch the magic happen! 🎉

### Step 5: Observe Real-Time Logs
You should see logs appearing in real-time in the console below:
```
10:34:21.234 [OUT] #1   Model name: Test Script
10:34:22.156 [OUT] #2   Model run time 2025-01-08 10:34:22
10:34:23.456 [OUT] #3   Testing Price Forecast Loop a bit
10:34:24.789 [OUT] #4   Running Deterministic Day-Ahead Model...
10:34:25.123 [OUT] #5   Wind profiles used for respective plant...
10:34:26.456 [ERR] #6   WARNING: This is a sample warning message
10:34:27.890 [OUT] #7   Calculating optimal bid strategies...
10:34:29.012 [OUT] #8   Execution completed successfully
```

### Step 6: Test Features

#### Filter Logs
- Click the filter dropdown in the console header
- Select "Stdout", "Stderr", "Errors", or "Warnings"
- Watch logs update based on filter

#### Download Logs
- Click the **Download** button (📥 icon)
- File saved as `test-logs-test_sample.py-2025-01-08.txt`

#### Archive Script
- Click the **Trash** icon next to a script
- Script is archived (soft delete)

#### Run Another Script
- Upload `experiment_forecast_validation.py`
- Click Run and observe different output patterns

---

## 🧪 Expected Behavior

### Upload Validation
✅ **PASS:** Upload `test_sample.py`  
❌ **FAIL:** Upload `model.py` (must start with test_ or experiment_)  
❌ **FAIL:** Upload `test.txt` (must be .py)  
❌ **FAIL:** Upload 10MB file (max 5MB)  

### Execution Flow
1. Click Run → Button shows "Running..." with spinner
2. Console header shows execution status with script name
3. Logs stream in real-time (line by line)
4. After ~5 seconds, execution completes
5. Status badge changes to "completed" (green)
6. Exit code and runtime displayed

### Socket Connection
- Green pulsing dot = Connected ✅
- Red dot = Disconnected ❌
- If disconnected, refresh page

---

## 🐛 Troubleshooting

### No Logs Appearing
**Problem:** Clicked Run but no logs in console  
**Solution:**
1. Check browser console for Socket.IO errors
2. Verify backend server is running
3. Check Socket.IO connection indicator
4. Refresh page and try again

### Upload Fails
**Problem:** Upload button disabled or error toast  
**Solution:**
1. Verify filename starts with `test_` or `experiment_`
2. Check file extension is `.py`
3. Ensure file size < 5MB
4. Check browser console for errors

### Script Execution Hangs
**Problem:** Status stuck on "running"  
**Solution:**
1. Check backend logs for Python errors
2. Verify Python is installed: `python --version`
3. Check script syntax (run locally first)
4. Look for infinite loops in script

### 404 on API Calls
**Problem:** Upload or execution returns 404  
**Solution:**
1. Verify API routes exist:
   - `/api/sandbox/test-scripts/upload`
   - `/api/sandbox/test-scripts`
2. Check Next.js server logs
3. Restart dev server

---

## 📊 Test Scenarios

### Scenario 1: Successful Execution
- Upload: `test_sample.py`
- Expected: Green status, exit code 0, ~5s runtime
- Logs: 8-10 lines of stdout, 1 stderr warning

### Scenario 2: Failed Execution
Create `test_error.py`:
```python
print("Starting...")
raise Exception("Test error!")
```
- Upload and run
- Expected: Red status, exit code 1
- Logs: Error traceback in stderr

### Scenario 3: Long Running Script
Create `test_long.py`:
```python
import time
for i in range(20):
    print(f"Progress: {i+1}/20")
    time.sleep(0.5)
print("Done!")
```
- Upload and run
- Expected: Real-time progress updates
- Test auto-scroll behavior

### Scenario 4: Multiple Scripts
- Upload 3 different scripts
- Run them one at a time
- Verify each execution is tracked
- Check "total runs" counter increments

---

## ✅ Validation Checklist

After testing, verify:

- [ ] Upload works with valid files
- [ ] Upload rejects invalid files
- [ ] Scripts list displays uploaded files
- [ ] Run button starts execution
- [ ] Logs appear in real-time
- [ ] Log filtering works
- [ ] Download logs works
- [ ] Archive removes scripts
- [ ] Status badges update correctly
- [ ] Exit code and runtime display
- [ ] Socket connection indicator works
- [ ] Auto-scroll can be toggled
- [ ] Multiple scripts can be managed
- [ ] Execution history is saved

---

## 🎓 Advanced Testing

### Test with Real Optimization
Create `test_optimization_mock.py`:
```python
import time
import random

print("Initializing DMO optimizer...")
time.sleep(1)

for hour in range(1, 25):
    price = random.uniform(30, 100)
    print(f"Hour {hour:02d}: Optimal bid ${price:.2f}/MWh")
    time.sleep(0.2)

print("Optimization complete!")
print(f"Total revenue: ${random.uniform(5000, 15000):.2f}")
```

### Test with Data Processing
Create `experiment_data_analysis.py`:
```python
import time
import sys

print("Loading wind farm data...")
time.sleep(1)

print("Processing 1000 records...")
for i in range(0, 101, 10):
    print(f"Progress: {i}%")
    if i == 50:
        print("Warning: Outlier detected", file=sys.stderr)
    time.sleep(0.3)

print("Analysis complete!")
```

---

## 📈 Performance Expectations

- **Upload:** < 1 second for 5MB file
- **Execution start:** < 500ms
- **Log latency:** < 100ms per line
- **UI responsiveness:** No lag during execution
- **Memory usage:** Stable (no leaks)
- **Socket reconnection:** < 2 seconds

---

## 🎉 Success Criteria

The test script runner is working correctly if:

1. ✅ All upload validations pass
2. ✅ Scripts execute and stream logs in real-time
3. ✅ UI updates reflect execution status
4. ✅ Multiple scripts can be managed simultaneously
5. ✅ Logs are filterable and downloadable
6. ✅ No console errors during operation
7. ✅ Socket connection is stable
8. ✅ Performance is smooth and responsive

---

## 🆘 Need Help?

1. Check `TEST_SCRIPT_FEATURE_COMPLETE.md` for detailed documentation
2. Review backend logs in terminal
3. Check browser console for frontend errors
4. Verify database migrations: `npx prisma db push`
5. Restart both frontend and backend servers

---

**Happy Testing! 🚀**

---

*Last Updated: 2025-01-08*  
*Feature Status: ✅ Ready for Testing*
