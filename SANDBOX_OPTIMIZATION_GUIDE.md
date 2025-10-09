# Sandbox Optimization Integration and Notification System
## Implementation Guide

## 🎉 What's Been Completed

### ✅ Backend Infrastructure (100% Complete)

1. **Database Schema** (`prisma/schema.prisma`)
   - Added `OptimizationModel` table for managing uploaded Python files
   - Extended `JobRun` with model references and log file paths
   - All relationships configured

2. **Python Execution Service** (`src/lib/optimization-executor.ts`)
   - Subprocess-based Python script execution
   - Real-time log capture and streaming via Socket.IO
   - Job status tracking and error handling
   - Automatic log file creation

3. **Socket.IO Integration** (`src/lib/socket.ts`)
   - Extended with optimization event handlers
   - Real-time log streaming: `optimization:log`, `optimization:started`, `optimization:completed`
   - Subscription-based model and job tracking

4. **API Endpoints**
   - `POST /api/optimization/upload` - Upload Python models with syntax validation
   - `GET/DELETE /api/optimization/models` - List and manage models
   - `POST /api/optimization/execute` - Execute models
   - `GET /api/optimization/execute?jobId=X` - Get job status

---

## 📋 Next Steps - Frontend Components

### Required Frontend Components

You need to create these React components in `src/components/`:

#### 1. Model Upload Component
```tsx
// src/components/optimization/model-upload-card.tsx
"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileCode, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function ModelUploadCard() {
  const [modelType, setModelType] = useState<'DMO' | 'RMO' | 'SO'>('DMO')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith('.py')) {
      toast.error('Only Python (.py) files are allowed')
      return
    }

    setUploadedFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/x-python': ['.py'] },
    maxFiles: 1
  })

  const handleUpload = async () => {
    if (!uploadedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadedFile)
    formData.append('modelType', modelType)
    formData.append('description', description)

    try {
      const response = await fetch('/api/optimization/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${modelType} model uploaded successfully!`)
        setUploadedFile(null)
        setDescription('')
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (error) {
      toast.error('Failed to upload model')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Optimization Model
        </CardTitle>
        <CardDescription>
          Upload Python (.py) files for DMO, RMO, or SO optimization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Model Type</label>
          <Select value={modelType} onValueChange={(v: any) => setModelType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DMO">DMO - Day Ahead Market</SelectItem>
              <SelectItem value="RMO">RMO - Real Time Market</SelectItem>
              <SelectItem value="SO">SO - System Optimization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
        >
          <input {...getInputProps()} />
          <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {uploadedFile ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>{uploadedFile.name}</span>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium mb-1">
                Drag & drop Python file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">Only .py files, max 10MB</p>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this model does..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!uploadedFile || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Model'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### 2. Optimization Control Panel
```tsx
// src/components/optimization/control-panel.tsx
"use client"

import { useState, useEffect } from 'react'
import { Play, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ModelStatus {
  type: 'DMO' | 'RMO' | 'SO'
  status: 'idle' | 'running' | 'success' | 'failed'
  lastRun?: string
  activeModelId?: string
}

export function OptimizationControlPanel() {
  const [models, setModels] = useState<ModelStatus[]>([
    { type: 'DMO', status: 'idle' },
    { type: 'RMO', status: 'idle' },
    { type: 'SO', status: 'idle' }
  ])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/optimization/models')
      const data = await response.json()

      if (data.success) {
        const updated = models.map(m => {
          const model = data.models.find((dm: any) => dm.model_type === m.type && dm.status === 'active')
          return {
            ...m,
            activeModelId: model?.id,
            lastRun: model?.lastRun?.completed_at,
            status: model?.lastRun?.status === 'success' ? 'success' : 'idle'
          }
        })
        setModels(updated)
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
    }
  }

  const runModel = async (modelType: 'DMO' | 'RMO' | 'SO') => {
    const model = models.find(m => m.type === modelType)
    if (!model?.activeModelId) {
      toast.error(`No active ${modelType} model found. Please upload one first.`)
      return
    }

    setLoading(modelType)
    setModels(prev => prev.map(m => 
      m.type === modelType ? { ...m, status: 'running' } : m
    ))

    try {
      const response = await fetch('/api/optimization/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: model.activeModelId,
          modelType
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${modelType} optimization started!`)
      } else {
        toast.error(result.error || 'Failed to start optimization')
        setModels(prev => prev.map(m => 
          m.type === modelType ? { ...m, status: 'failed' } : m
        ))
      }
    } catch (error) {
      toast.error('Failed to execute model')
      setModels(prev => prev.map(m => 
        m.type === modelType ? { ...m, status: 'failed' } : m
      ))
    } finally {
      setLoading(null)
    }
  }

  const getStatusIcon = (status: ModelStatus['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimization Control Center</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {models.map(model => (
          <div key={model.type} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(model.status)}
              <div>
                <div className="font-semibold">{model.type}</div>
                <div className="text-xs text-muted-foreground">
                  {model.lastRun ? `Last run: ${new Date(model.lastRun).toLocaleString()}` : 'Never run'}
                </div>
              </div>
            </div>
            <Button
              onClick={() => runModel(model.type)}
              disabled={loading === model.type || model.status === 'running' || !model.activeModelId}
              size="sm"
            >
              <Play className="h-4 w-4 mr-1" />
              Run {model.type}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

#### 3. Real-Time Log Panel
```tsx
// src/components/optimization/log-notification-panel.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useSocket } from '@/hooks/use-socket'

interface LogEntry {
  jobId: string
  modelType: string
  level: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG'
  message: string
  timestamp: Date
}

export function LogNotificationPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.on('optimization:log', (data: LogEntry) => {
      setLogs(prev => [...prev, { ...data, timestamp: new Date(data.timestamp) }])
    })

    return () => {
      socket.off('optimization:log')
    }
  }, [socket])

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const clearLogs = () => setLogs([])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-50'
      case 'WARNING': return 'text-yellow-600 bg-yellow-50'
      case 'INFO': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Live Optimization Logs
          <Badge variant="outline">{logs.length}</Badge>
        </CardTitle>
        <Button onClick={clearLogs} size="sm" variant="outline">
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full" ref={scrollRef}>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No logs yet. Run an optimization model to see live logs.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="p-2 border-l-2 border-primary/20 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getLevelColor(log.level)} variant="secondary">
                      {log.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge variant="outline">{log.modelType}</Badge>
                  </div>
                  <p className="text-xs font-mono">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
```

#### 4. Socket Hook
```tsx
// src/hooks/use-socket.ts
"use client"

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socketio',
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return { socket, isConnected }
}
```

---

## 🚀 Deployment Steps

### 1. Update Database Schema
```bash
npm run db:push
```

### 2. Create Sample Python Model

Create `sample_dmo_model.py` for testing:

```python
#!/usr/bin/env python3
"""
Sample DMO (Day Ahead Market) Optimization Model
This is a demonstration model for the Sandbox environment
"""

import os
import sys
import time
import json
from datetime import datetime

def run_model():
    """Main model execution function"""
    
    # Get environment variables
    job_id = os.getenv('JOB_ID', 'unknown')
    model_type = os.getenv('MODEL_TYPE', 'DMO')
    config = json.loads(os.getenv('CONFIG', '{}'))
    
    print(f"[{datetime.now().isoformat()}] Starting {model_type} optimization")
    print(f"Job ID: {job_id}")
    print(f"Configuration: {config}")
    
    # Simulate data loading
    print("Loading market data from database...")
    time.sleep(1)
    print("Data loaded successfully: 1000 records")
    
    # Simulate optimization
    print("Running optimization algorithm...")
    time.sleep(2)
    print("Optimization converged after 15 iterations")
    print("Objective value: 125436.78")
    
    # Simulate results writing
    print("Writing results to database...")
    time.sleep(1)
    print("Results written: 500 records")
    
    print(f"[{datetime.now().isoformat()}] {model_type} optimization completed successfully")
    
    return 0

if __name__ == '__main__':
    try:
        exit_code = run_model()
        sys.exit(exit_code)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Test the System

1. Navigate to `/sandbox`
2. Upload the sample Python model
3. Select model type (DMO, RMO, or SO)
4. Click "Upload Model"
5. Once uploaded, use the Control Panel to run the model
6. Watch live logs stream in the notification panel

---

## 🔧 Configuration

### Environment Variables
No additional environment variables needed - uses existing DATABASE_URL

### File Storage
- Models: `./server/models/optimization/`
- Logs: `./logs/optimization/`

---

## 📊 Socket.IO Events

### Client → Server
- `subscribe` - Subscribe to a channel
- `optimization:subscribe` - Subscribe to optimization events

### Server → Client
- `optimization:started` - Model execution started
- `optimization:log` - Real-time log message
- `optimization:completed` - Model execution completed
- `optimization:failed` - Model execution failed

---

## 🎯 API Reference

### Upload Model
```
POST /api/optimization/upload
Content-Type: multipart/form-data

Fields:
- file: Python file
- modelType: DMO | RMO | SO
- description: Optional description
```

### List Models
```
GET /api/optimization/models?modelType=DMO&status=active
```

### Execute Model
```
POST /api/optimization/execute
Content-Type: application/json

{
  "modelId": "model_id",
  "modelType": "DMO",
  "dataSourceId": "optional",
  "config": {}
}
```

### Get Job Status
```
GET /api/optimization/execute?jobId=DMO_1234567890_abc
```

---

## 📝 TODO: Optional Enhancements

1. **Scheduling System** - Add cron-based auto-execution
2. **Chart Dashboard** - Create visualization panels for results
3. **Model Versioning** - Support multiple versions of same model
4. **Parallel Execution** - Run multiple models simultaneously
5. **Result Caching** - Cache optimization results

---

## 🐛 Troubleshooting

### Python not found
- Ensure Python is installed and in PATH
- Test with: `python --version`

### File upload fails
- Check file permissions on `./server/models/optimization/`
- Verify MAX_FILE_SIZE in upload route

### Socket.IO not connecting
- Check that server.ts is running
- Verify Socket.IO path: `/api/socketio`

### Logs not streaming
- Check Socket.IO connection in browser console
- Verify optimization executor is initialized

---

## ✅ Testing Checklist

- [ ] Upload DMO model successfully
- [ ] Upload RMO model successfully
- [ ] Upload SO model successfully
- [ ] Execute DMO model
- [ ] Execute RMO model
- [ ] Execute SO model
- [ ] View live logs during execution
- [ ] Check job status after completion
- [ ] View model list
- [ ] Delete/archive model

---

## 🎉 Success Criteria

Your system is working correctly when:
1. You can upload Python files through the UI
2. Files are validated for syntax errors
3. You can trigger model execution from control panel
4. Logs stream in real-time to the notification panel
5. Job status updates correctly in database
6. All three model types (DMO, RMO, SO) work independently

---

For questions or issues, check the implementation files:
- Backend: `src/lib/optimization-executor.ts`
- Socket: `src/lib/socket.ts`
- API: `src/app/api/optimization/`
