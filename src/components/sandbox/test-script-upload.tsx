"use client"

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileCode, CheckCircle, XCircle, Loader2, Play, Trash2, RefreshCw, Clock, Terminal, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSocket } from '@/hooks/use-socket'

interface TestScript {
  id: string
  script_name: string
  original_filename: string
  file_size: number
  description: string | null
  uploaded_at: string
  last_run_at: string | null
  total_runs: number
  status: string
  lastExecution?: {
    execution_id: string
    status: string
    exit_code: number | null
    runtime_ms: number | null
    started_at: string
    completed_at: string | null
  } | null
}

export function TestScriptUpload() {
  const socket = useSocket()
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [scripts, setScripts] = useState<TestScript[]>([])
  const [loading, setLoading] = useState(true)
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set())
  const [socketConnected, setSocketConnected] = useState(false)

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/sandbox/scripts')
      const result = await response.json()
      
      if (result.success) {
        // Map the new API response format
        const mappedScripts = result.data.scripts.map((s: any) => ({
          id: s.id,
          script_name: s.scriptName,
          original_filename: s.originalFilename,
          file_size: s.fileSize,
          description: s.description,
          uploaded_at: s.uploadedAt,
          last_run_at: s.lastRunAt,
          total_runs: s.totalRuns,
          status: s.status,
          lastExecution: s.lastExecution
        }))
        setScripts(mappedScripts)
      }
    } catch (error) {
      console.error('Error fetching scripts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScripts()
  }, [])

  // Socket.IO connection monitoring
  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      console.log('✅ Socket.IO connected for test scripts')
      setSocketConnected(true)
      toast.success('Real-time logging connected', { duration: 2000 })
    }

    const handleDisconnect = () => {
      console.log('❌ Socket.IO disconnected')
      setSocketConnected(false)
    }

    const handleScriptLog = (data: any) => {
      console.log('📝 Script log:', data)
      // Auto-refresh scripts list when execution completes
      if (data.status === 'completed' || data.status === 'failed') {
        setTimeout(fetchScripts, 1000)
        setRunningScripts(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.scriptId)
          return newSet
        })
      }
    }

    const handleScriptComplete = (data: any) => {
      console.log('✅ Script completed:', data)
      toast.success('Script execution completed!', {
        description: `Exit code: ${data.exitCode || 0}`,
        duration: 3000
      })
      fetchScripts()
      setRunningScripts(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.scriptId)
        return newSet
      })
    }

    const handleScriptError = (data: any) => {
      console.log('❌ Script error:', data)
      toast.error('Script execution failed', {
        description: data.error || 'Unknown error',
        duration: 5000
      })
      fetchScripts()
      setRunningScripts(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.scriptId)
        return newSet
      })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('script:log', handleScriptLog)
    socket.on('script:complete', handleScriptComplete)
    socket.on('script:error', handleScriptError)

    // Check initial connection state
    if (socket.connected) {
      setSocketConnected(true)
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('script:log', handleScriptLog)
      socket.off('script:complete', handleScriptComplete)
      socket.off('script:error', handleScriptError)
    }
  }, [socket])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith('.py')) {
      toast.error('Only Python (.py) files are allowed')
      return
    }

    // Optional: Check filename pattern - accept any .py file
    // const validPattern = /(test_|experiment_).*\.py$/i
    // if (!validPattern.test(file.name)) {
    //   toast.error('File must contain "test_" or "experiment_" in the name', {
    //     description: 'Examples: test_sample.py, test_python_MK.py, experiment_forecast.py'
    //   })
    //   return
    // }

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
    formData.append('description', description)

    try {
      const response = await fetch('/api/sandbox/upload-script', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Test script uploaded successfully!', {
          description: `File: ${uploadedFile.name}`
        })
        setUploadedFile(null)
        setDescription('')
        fetchScripts()
      } else {
        toast.error(result.error || 'Upload failed', {
          description: result.message
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload test script', {
        description: 'Network or server error occurred'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRunScript = async (scriptId: string, scriptName: string) => {
    setRunningScripts(prev => new Set(prev).add(scriptId))
    
    try {
      const response = await fetch('/api/sandbox/test-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Test script execution started!', {
          description: `Running: ${scriptName}`,
          duration: 3000
        })
        
        // Refresh scripts list after a delay
        setTimeout(fetchScripts, 2000)
      } else {
        toast.error(result.error || 'Execution failed', {
          description: result.message
        })
        setRunningScripts(prev => {
          const newSet = new Set(prev)
          newSet.delete(scriptId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Execution error:', error)
      toast.error('Failed to start test script', {
        description: 'Network or server error occurred'
      })
      setRunningScripts(prev => {
        const newSet = new Set(prev)
        newSet.delete(scriptId)
        return newSet
      })
    }
  }

  const handleArchiveScript = async (scriptId: string, scriptName: string) => {
    try {
      const response = await fetch(`/api/sandbox/scripts?id=${scriptId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Test script archived', {
          description: scriptName
        })
        fetchScripts()
      } else {
        toast.error(result.error || 'Failed to archive script')
      }
    } catch (error) {
      console.error('Archive error:', error)
      toast.error('Failed to archive script')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatRuntime = (ms: number | null) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Test Script
          </CardTitle>
          <CardDescription>
            Upload any Python script (.py files)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : uploadedFile 
                ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{uploadedFile.name}</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <Badge variant="outline">{formatFileSize(uploadedFile.size)}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadedFile(null)
                  }}
                  className="mt-2"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium mb-1">
                  {isDragActive 
                    ? 'Drop the file here...'
                    : 'Drag & drop Python test script, or click to browse'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Only .py files, max 5MB
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this test script does..."
              rows={3}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!uploadedFile || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Script
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Scripts List Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Uploaded Scripts
                <Badge variant="outline" className="ml-2">
                  {scripts.length}
                </Badge>
              </CardTitle>
              {socketConnected && (
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">
                  <Terminal className="h-3 w-3 mr-1" />
                  Live Logs
                </Badge>
              )}
            </div>
            <Button
              onClick={fetchScripts}
              size="sm"
              variant="outline"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <CardDescription>
            {scripts.length > 0 
              ? 'Click Run to execute a test script • Real-time logs streamed below'
              : 'Upload your first Python script to get started'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p>Loading scripts...</p>
              </div>
            ) : scripts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No scripts uploaded yet</p>
                <p className="text-sm mt-1">Upload your first test script to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scripts.map((script) => (
                  <div
                    key={script.id}
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate" title={script.original_filename}>
                          {script.original_filename}
                        </h4>
                        {script.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {script.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRunScript(script.id, script.original_filename)}
                          disabled={runningScripts.has(script.id)}
                          size="sm"
                          variant="default"
                          className="relative"
                        >
                          {runningScripts.has(script.id) ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Running
                              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Run
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleArchiveScript(script.id, script.original_filename)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        {formatFileSize(script.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {script.total_runs} runs
                      </span>
                      {script.last_run_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(script.last_run_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {script.lastExecution && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">Last execution:</span>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] ${getStatusColor(script.lastExecution.status)}`}
                            >
                              {script.lastExecution.status}
                            </Badge>
                            {script.lastExecution.runtime_ms !== null && (
                              <Badge variant="outline" className="text-[10px]">
                                {formatRuntime(script.lastExecution.runtime_ms)}
                              </Badge>
                            )}
                            {script.lastExecution.exit_code !== null && (
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] ${
                                  script.lastExecution.exit_code === 0 
                                    ? 'bg-green-50 dark:bg-green-950' 
                                    : 'bg-red-50 dark:bg-red-950'
                                }`}
                              >
                                Exit: {script.lastExecution.exit_code}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
