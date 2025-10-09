# Optimization Job Scheduling Guide

## Overview

This guide explains how to set up automated scheduling for the three optimization models (DMO, RMO, SO) in the Energy-Ops Dashboard application.

## Optimization Models Schedule

### 1. DMO (Day-Ahead Market Optimization)
- **Frequency**: 1 time per day
- **Recommended Time**: 10:00 AM daily
- **Purpose**: Day-ahead market bidding and scheduling

### 2. RMO (Real-Time Market Optimization)
- **Frequency**: 48 times per day  
- **Interval**: Every 30 minutes
- **Purpose**: Real-time market adjustments

### 3. SO (Storage Optimization)
- **Frequency**: 96 times per day
- **Interval**: Every 15 minutes
- **Purpose**: Battery storage optimization

---

## Windows Task Scheduler Setup

### Prerequisites
- Windows 10/11 or Windows Server
- Administrator access
- Python installed and accessible in PATH
- Node.js and application running

### Step 1: Create PowerShell Scripts

Create a scripts directory in your project root:

```powershell
mkdir scripts/scheduling
```

#### DMO Schedule Script (`scripts/scheduling/run_dmo.ps1`):

```powershell
# DMO Daily Runner
$ErrorActionPreference = "Stop"

$API_URL = "http://localhost:3000/api/jobs/trigger"
$DATA_SOURCE_ID = "YOUR_DATA_SOURCE_ID"  # Replace with actual ID

$body = @{
    model_type = "DMO"
    data_source_id = $DATA_SOURCE_ID
    triggered_by = "scheduled"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json"
    Write-Host "DMO job triggered successfully: $($response.data.job_id)"
    exit 0
} catch {
    Write-Error "Failed to trigger DMO: $_"
    exit 1
}
```

#### RMO Schedule Script (`scripts/scheduling/run_rmo.ps1`):

```powershell
# RMO 30-minute Runner
$ErrorActionPreference = "Stop"

$API_URL = "http://localhost:3000/api/jobs/trigger"
$DATA_SOURCE_ID = "YOUR_DATA_SOURCE_ID"  # Replace with actual ID

$body = @{
    model_type = "RMO"
    data_source_id = $DATA_SOURCE_ID
    triggered_by = "scheduled"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json"
    Write-Host "RMO job triggered successfully: $($response.data.job_id)"
    exit 0
} catch {
    Write-Error "Failed to trigger RMO: $_"
    exit 1
}
```

#### SO Schedule Script (`scripts/scheduling/run_so.ps1`):

```powershell
# SO 15-minute Runner
$ErrorActionPreference = "Stop"

$API_URL = "http://localhost:3000/api/jobs/trigger"
$DATA_SOURCE_ID = "YOUR_DATA_SOURCE_ID"  # Replace with actual ID

$body = @{
    model_type = "SO"
    data_source_id = $DATA_SOURCE_ID
    triggered_by = "scheduled"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json"
    Write-Host "SO job triggered successfully: $($response.data.job_id)"
    exit 0
} catch {
    Write-Error "Failed to trigger SO: $_"
    exit 1
}
```

### Step 2: Set Execution Policy

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 3: Create Scheduled Tasks

#### DMO Task (Daily at 10 AM):

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\path\to\scripts\scheduling\run_dmo.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At 10:00AM

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask `
    -TaskName "Energy-Ops-DMO-Daily" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Daily DMO optimization at 10 AM"
```

#### RMO Task (Every 30 minutes):

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\path\to\scripts\scheduling\run_rmo.ps1"

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 2)

Register-ScheduledTask `
    -TaskName "Energy-Ops-RMO-30min" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "RMO optimization every 30 minutes"
```

#### SO Task (Every 15 minutes):

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\path\to\scripts\scheduling\run_so.ps1"

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 20) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
    -TaskName "Energy-Ops-SO-15min" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "SO optimization every 15 minutes"
```

---

## Linux/macOS Cron Setup

### Prerequisites
- Linux/macOS system
- Cron daemon running
- curl or wget installed

### Step 1: Create Shell Scripts

Create a scripts directory:

```bash
mkdir -p scripts/scheduling
chmod +x scripts/scheduling/*.sh
```

#### DMO Schedule Script (`scripts/scheduling/run_dmo.sh`):

```bash
#!/bin/bash

API_URL="http://localhost:3000/api/jobs/trigger"
DATA_SOURCE_ID="YOUR_DATA_SOURCE_ID"  # Replace with actual ID

response=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"model_type\": \"DMO\",
    \"data_source_id\": \"$DATA_SOURCE_ID\",
    \"triggered_by\": \"scheduled\"
  }")

if echo "$response" | grep -q '"success":true'; then
  echo "$(date): DMO job triggered successfully"
  exit 0
else
  echo "$(date): Failed to trigger DMO: $response" >&2
  exit 1
fi
```

#### RMO Schedule Script (`scripts/scheduling/run_rmo.sh`):

```bash
#!/bin/bash

API_URL="http://localhost:3000/api/jobs/trigger"
DATA_SOURCE_ID="YOUR_DATA_SOURCE_ID"  # Replace with actual ID

response=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"model_type\": \"RMO\",
    \"data_source_id\": \"$DATA_SOURCE_ID\",
    \"triggered_by\": \"scheduled\"
  }")

if echo "$response" | grep -q '"success":true'; then
  echo "$(date): RMO job triggered successfully"
  exit 0
else
  echo "$(date): Failed to trigger RMO: $response" >&2
  exit 1
fi
```

#### SO Schedule Script (`scripts/scheduling/run_so.sh`):

```bash
#!/bin/bash

API_URL="http://localhost:3000/api/jobs/trigger"
DATA_SOURCE_ID="YOUR_DATA_SOURCE_ID"  # Replace with actual ID

response=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"model_type\": \"SO\",
    \"data_source_id\": \"$DATA_SOURCE_ID\",
    \"triggered_by\": \"scheduled\"
  }")

if echo "$response" | grep -q '"success":true'; then
  echo "$(date): SO job triggered successfully"
  exit 0
else
  echo "$(date): Failed to trigger SO: $response" >&2
  exit 1
fi
```

### Step 2: Edit Crontab

```bash
crontab -e
```

Add the following entries:

```cron
# DMO: Daily at 10:00 AM
0 10 * * * /path/to/scripts/scheduling/run_dmo.sh >> /var/log/energy-ops-dmo.log 2>&1

# RMO: Every 30 minutes
*/30 * * * * /path/to/scripts/scheduling/run_rmo.sh >> /var/log/energy-ops-rmo.log 2>&1

# SO: Every 15 minutes
*/15 * * * * /path/to/scripts/scheduling/run_so.sh >> /var/log/energy-ops-so.log 2>&1
```

---

## Docker/Container Setup

### Using Docker Compose with Scheduler

Create `docker-compose.scheduler.yml`:

```yaml
version: '3.8'

services:
  scheduler:
    image: mcuadros/ofelia:latest
    container_name: energy-ops-scheduler
    depends_on:
      - app
    command: daemon --docker
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    labels:
      # DMO: Daily at 10:00 AM
      ofelia.job-exec.dmo.schedule: "0 0 10 * * *"
      ofelia.job-exec.dmo.container: "energy-ops-app"
      ofelia.job-exec.dmo.command: "curl -X POST http://localhost:3000/api/jobs/trigger -H 'Content-Type: application/json' -d '{\"model_type\":\"DMO\",\"data_source_id\":\"YOUR_ID\",\"triggered_by\":\"scheduled\"}'"
      
      # RMO: Every 30 minutes
      ofelia.job-exec.rmo.schedule: "0 */30 * * * *"
      ofelia.job-exec.rmo.container: "energy-ops-app"
      ofelia.job-exec.rmo.command: "curl -X POST http://localhost:3000/api/jobs/trigger -H 'Content-Type: application/json' -d '{\"model_type\":\"RMO\",\"data_source_id\":\"YOUR_ID\",\"triggered_by\":\"scheduled\"}'"
      
      # SO: Every 15 minutes
      ofelia.job-exec.so.schedule: "0 */15 * * * *"
      ofelia.job-exec.so.container: "energy-ops-app"
      ofelia.job-exec.so.command: "curl -X POST http://localhost:3000/api/jobs/trigger -H 'Content-Type: application/json' -d '{\"model_type\":\"SO\",\"data_source_id\":\"YOUR_ID\",\"triggered_by\":\"scheduled\"}'"

  app:
    # Your app configuration
    container_name: energy-ops-app
    # ... rest of config
```

Start with:

```bash
docker-compose -f docker-compose.yml -f docker-compose.scheduler.yml up -d
```

---

## Monitoring and Logs

### Check Schedule Status

#### Windows:
```powershell
Get-ScheduledTask -TaskName "Energy-Ops-*" | Select-Object TaskName, State, LastRunTime, NextRunTime
```

#### Linux/macOS:
```bash
crontab -l
grep "energy-ops" /var/log/syslog
```

### View Job Logs

Access logs via the dashboard:
1. Navigate to Sandbox → Optimization
2. View Recent Jobs section
3. Click "Logs" button for any job

Or via API:
```bash
curl http://localhost:3000/api/jobs?limit=20
curl http://localhost:3000/api/jobs/{job_id}/logs
```

### Log Files

Application logs are stored in:
- Windows: `C:\ProgramData\energy-ops\logs\`
- Linux/macOS: `/var/log/energy-ops/`

Job-specific logs:
- `dmo_{timestamp}.log`
- `rmo_{timestamp}.log`
- `so_{timestamp}.log`

---

## Troubleshooting

### Jobs Not Running

1. **Check Task Scheduler/Cron Status**:
   ```powershell
   # Windows
   Get-ScheduledTask -TaskName "Energy-Ops-DMO-Daily"
   
   # Linux/macOS
   sudo service cron status
   ```

2. **Verify API Accessibility**:
   ```bash
   curl http://localhost:3000/api/jobs/trigger -X POST -H "Content-Type: application/json" -d '{"model_type":"DMO","data_source_id":"test"}'
   ```

3. **Check Application Logs**:
   ```bash
   tail -f /var/log/energy-ops/app.log
   ```

### DMO Already Run Today

If you see "DMO has already been run today" error:
- This is by design - only 1 DMO run per day is allowed
- Check recent jobs: `curl http://localhost:3000/api/jobs?model_type=DMO`
- Reset if needed (development only): Delete today's DMO run from database

### Script Execution Errors

**Windows**:
```powershell
# Test script manually
PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/scheduling/run_dmo.ps1
```

**Linux/macOS**:
```bash
# Test script manually
bash scripts/scheduling/run_dmo.sh
```

---

## Best Practices

1. **Use Environment Variables**: Store DATA_SOURCE_ID and API_URL in environment variables
2. **Enable Logging**: Always log output for debugging
3. **Set Timeouts**: Configure reasonable execution time limits
4. **Monitor Resources**: Track CPU/memory usage during optimization runs
5. **Alerting**: Set up notifications for failed jobs
6. **Backup**: Regular backups of job results and configurations

---

## Production Deployment

### Azure

Use Azure Logic Apps or Azure Functions with Timer triggers:

```json
{
  "bindings": [
    {
      "name": "Timer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 10 * * *"
    }
  ]
}
```

### AWS

Use AWS Lambda with CloudWatch Events:

```yaml
Resources:
  DMOScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      ScheduleExpression: "cron(0 10 * * ? *)"
      Targets:
        - Arn: !GetAtt DMOFunction.Arn
          Id: "1"
```

### Kubernetes

Use CronJob resources:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: energy-ops-dmo
spec:
  schedule: "0 10 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: dmo-trigger
            image: curlimages/curl
            args:
            - /bin/sh
            - -c
            - curl -X POST http://app:3000/api/jobs/trigger -H 'Content-Type: application/json' -d '{"model_type":"DMO","data_source_id":"${DATA_SOURCE_ID}","triggered_by":"scheduled"}'
          restartPolicy: OnFailure
```

---

## Support

For issues or questions:
- Check application logs
- Review API documentation at `/api/docs`
- Contact the development team

**Version**: 1.0.0  
**Last Updated**: 2025-09-30  
**Status**: Production Ready
