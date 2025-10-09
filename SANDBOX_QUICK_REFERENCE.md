# Sandbox Quick Reference Guide

## 🚀 Quick Start

### Access Sandbox
```
URL: http://localhost:3000/sandbox
Tab: "Test Scripts"
```

### System Requirements
- Python 3.10+ ✅ (Currently: Python 3.10.6)
- Node.js server running ✅
- Database connected ✅
- Socket.IO enabled ✅

## 📋 Common Operations

### Upload a Python Script
1. **Via Drag & Drop:** Drag `.py` file into upload zone
2. **Via Click:** Click upload zone → select file
3. Add description (optional)
4. Click "Upload Script"

**Limits:**
- File type: `.py` only
- Max size: 5MB
- No special characters in filename

### Execute a Script
1. Find script in the list
2. Click green "Run" button
3. Watch logs appear in real-time below
4. Wait for completion notification

### View Execution Logs
- **Real-time:** Logs appear automatically during execution
- **Filter:** Use dropdown to filter by log level
- **Download:** Click download icon to save as `.txt`
- **Clear:** Click trash icon to clear console

### Delete a Script
1. Find script in the list
2. Click red trash icon
3. Confirm deletion
4. Script is archived

## 🎨 UI Elements Explained

### Script Card Elements
```
┌─────────────────────────────────────┐
│ 📄 script_name.py           [Run] [🗑]│
│ Description text here...            │
│ 📊 2.5KB  ▶️ 3 runs  🕐 Last: ...   │
│ ─────────────────────────────────── │
│ Last execution:                     │
│ [completed] [1.23s] [Exit: 0]       │
└─────────────────────────────────────┘
```

### Log Console Elements
```
┌─────────────────────────────────────┐
│ 🖥️ Test Script Console [5/10] 🔗    │
│ [Filter ▼] [Download] [Clear]       │
│ ─────────────────────────────────── │
│ [12:34:56.789] [OUT] #1 Starting... │
│ [12:34:57.123] [ERR] #2 Warning!    │
│ [12:34:58.456] [OUT] #3 Completed   │
│ ─────────────────────────────────── │
│ ☑ Auto-scroll        🟢 Connected   │
└─────────────────────────────────────┘
```

## 🎯 Status Indicators

### Script Status
- **🟢 active** - Ready to run
- **🔵 running** - Currently executing
- **✅ completed** - Last run succeeded
- **❌ failed** - Last run failed

### Log Levels
- **🔵 OUT** (stdout) - Normal output
- **🔴 ERR** (stderr) - Error messages
- **🟡 WARN** - Warnings
- **⚠️ ERROR** - Critical errors

### Connection Status
- **🟢 Connected** - Real-time updates active
- **🔴 Disconnected** - Connection lost

## 🔑 Keyboard Shortcuts
(When log console is focused)
- `Ctrl/Cmd + F` - Focus filter dropdown
- `Ctrl/Cmd + D` - Download logs
- `Ctrl/Cmd + K` - Clear logs
- `End` - Scroll to bottom
- `Home` - Scroll to top

## 📁 File Structure

### Your Files
```
Energy-Ops-Dashboard/
├── sandbox/
│   ├── uploads/
│   │   └── test_scripts/        # Uploaded scripts
│   │       └── {timestamp}_{filename}.py
│   └── logs/                    # Execution logs
│       └── {script}_{timestamp}.log
├── prisma/
│   └── db/
│       └── custom.db            # Database
└── test_hello.py                # Sample test script
```

## 🧪 Sample Test Scripts

### 1. Hello World (test_hello.py)
```python
#!/usr/bin/env python3
import time
import sys

print("Hello from sandbox!")
for i in range(5):
    print(f"Step {i+1}/5")
    time.sleep(0.5)
print("✅ Complete!")
```

### 2. Error Test
```python
#!/usr/bin/env python3
import sys

print("Testing error output...")
print("ERROR: This is a test error", file=sys.stderr)
sys.exit(1)  # Non-zero exit code
```

### 3. Long Running
```python
#!/usr/bin/env python3
import time

print("Starting long task...")
for i in range(100):
    print(f"Progress: {i+1}%")
    time.sleep(0.1)
print("✅ Task completed!")
```

## 🔍 Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Can't upload | Check file is `.py` and < 5MB |
| No logs appear | Verify Socket.IO shows "Connected" |
| Script won't run | Check Python installed: `python --version` |
| Need to login | Go to `/auth/signin` |
| Upload folder missing | Server creates it automatically |
| Script hangs | Max runtime is 10 minutes, then auto-kills |

## 📊 API Endpoints (for developers)

```bash
# Get all scripts
GET /api/sandbox/scripts

# Upload script
POST /api/sandbox/upload-script
  FormData: { file: File, description: string }

# Execute script
POST /api/sandbox/execute-script
  Body: { scriptId: string, args?: string[] }

# Delete script
DELETE /api/sandbox/scripts?id={scriptId}

# Get execution status
GET /api/sandbox/execute-script?executionId={id}

# Kill running execution
DELETE /api/sandbox/execute-script?executionId={id}
```

## 🔌 Socket.IO Events

### Subscribe to sandbox updates:
```javascript
socket.emit('subscribe', 'sandbox')
```

### Listen for logs:
```javascript
socket.on('script:log', (data) => {
  console.log(data.message)
})
```

### Listen for completion:
```javascript
socket.on('script:completed', (data) => {
  console.log(`Exit code: ${data.exitCode}`)
})
```

## 💡 Pro Tips

1. **Use descriptive script names** - Helps identify scripts later
2. **Add descriptions** - Explain what the script does
3. **Test incrementally** - Start with simple scripts
4. **Watch the console** - Real-time feedback is immediate
5. **Filter logs** - Use filters to find specific issues
6. **Download logs** - Keep logs for debugging
7. **Check exit codes** - 0 = success, non-zero = failure
8. **Auto-scroll** - Enable to always see latest output
9. **Multiple tabs** - Open multiple browser tabs to see live updates

## 🎓 Common Use Cases

### Data Processing
Upload scripts to process CSV/Excel files, transform data, generate reports.

### Algorithm Testing
Test optimization algorithms, machine learning models, data analysis.

### Automation
Run scheduled tasks, data validation, quality checks.

### Debugging
Test code snippets, debug issues, verify logic.

### Prototyping
Quickly test ideas without local setup.

## 📞 Support

### Check Server Status
```bash
# Check if Node.js server is running
Get-Process -Name node

# Check if Python is available
python --version
```

### View Server Logs
Server console shows:
- Script execution starts
- Real-time log emissions
- Completion status
- Any errors

### Database Queries
```bash
# Open database in SQLite viewer
npx prisma studio

# Or use SQL directly
sqlite3 prisma/db/custom.db "SELECT * FROM TestScript;"
```

## ✅ Pre-Flight Checklist

Before using sandbox:
- [ ] Python installed and in PATH
- [ ] Node.js server running
- [ ] Database exists and is synced
- [ ] Logged in to application
- [ ] On `/sandbox` page, "Test Scripts" tab
- [ ] Socket.IO shows "Connected"

---

**Quick Links:**
- Full Guide: `SANDBOX_VERIFICATION.md`
- Sample Script: `test_hello.py`
- Sandbox URL: `http://localhost:3000/sandbox`
