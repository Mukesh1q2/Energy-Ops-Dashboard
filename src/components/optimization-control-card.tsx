"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Zap, 
  Play,
  Loader2, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface OptimizationControlCardProps {
  dataSourceId?: string
}

interface JobStatus {
  job_id: string
  model_type: string
  status: string
  progress: number
  started_at: string
  completed_at?: string
  error_message?: string
  duration_ms?: number
  is_running: boolean
  is_complete: boolean
}

interface Job {
  job_id: string
  model_type: string
  status: string
  progress: number
  started_at: string
  completed_at?: string
  error_message?: string
}

export function OptimizationControlCard({ dataSourceId }: OptimizationControlCardProps) {
  const [selectedDataSource, setSelectedDataSource] = useState<string>(dataSourceId || '')
  const [dataSources, setDataSources] = useState<any[]>([])
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [runningJobs, setRunningJobs] = useState<Map<string, JobStatus>>(new Map())
  const [loading, setLoading] = useState<Map<string, boolean>>(new Map())
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [jobLogs, setJobLogs] = useState<any[]>([])
  const [dmoRunToday, setDmoRunToday] = useState(false)
  const [models, setModels] = useState<any[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')

  useEffect(() => {
    fetchDataSources()
    fetchRecentJobs()
    fetchModels()
    const interval = setInterval(pollRunningJobs, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (dataSourceId) {
      setSelectedDataSource(dataSourceId)
    }
  }, [dataSourceId])

  useEffect(() => {
    checkDMORunToday()
  }, [selectedDataSource, recentJobs])

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources')
      const result = await response.json()
      if (result.success) {
        setDataSources(result.data.filter((ds: any) => ds.status === 'connected'))
      }
    } catch (error) {
      console.error('Error fetching data sources:', error)
    }
  }

  const fetchRecentJobs = async () => {
    try {
      const response = await fetch('/api/jobs?limit=10')
      const result = await response.json()
      if (result.success) {
        setRecentJobs(result.data)
      }
    } catch (error) {
      console.error('Error fetching recent jobs:', error)
    }
  }

  const checkDMORunToday = () => {
    if (!selectedDataSource) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dmoRun = recentJobs.find(job => 
      job.model_type === 'DMO' &&
      job.status === 'success' &&
      new Date(job.started_at) >= today &&
      (job as any).data_source_id === selectedDataSource
    )

    setDmoRunToday(!!dmoRun)
  }

  const pollRunningJobs = async () => {
    const jobsToCheck = Array.from(runningJobs.keys())
    
    for (const job_id of jobsToCheck) {
      try {
        const response = await fetch(`/api/jobs/${job_id}/status`)
        const result = await response.json()
        
        if (result.success) {
          const status = result.data
          
          if (status.is_complete) {
            // Remove from running jobs
            setRunningJobs(prev => {
              const updated = new Map(prev)
              updated.delete(job_id)
              return updated
            })
            
            // Show toast notification
            if (status.status === 'success') {
              toast.success(`${status.model_type} Optimization Complete`, {
                description: `Job completed successfully`,
                action: {
                  label: "View Logs",
                  onClick: () => viewJobLogs(job_id)
                }
              })
            } else {
              toast.error(`${status.model_type} Optimization Failed`, {
                description: status.error_message || 'Job failed',
                action: {
                  label: "View Logs",
                  onClick: () => viewJobLogs(job_id)
                }
              })
            }
            
            // Refresh recent jobs
            fetchRecentJobs()
          } else {
            // Update status
            setRunningJobs(prev => {
              const updated = new Map(prev)
              updated.set(job_id, status)
              return updated
            })
          }
        }
      } catch (error) {
        console.error(`Error polling job ${job_id}:`, error)
      }
    }
  }

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/optimization-models')
      const json = await res.json()
      if (json.success) setModels(json.data)
    } catch (e) {
      console.error('Failed to load models', e)
    }
  }

  const triggerOptimization = async (modelType: string) => {
    if (!selectedDataSource) {
      toast.error('Please select a data source first')
      return
    }

    if (modelType === 'DMO' && dmoRunToday) {
      toast.error('DMO has already been run today', {
        description: 'Only one DMO run is allowed per day'
      })
      return
    }

    setLoading(prev => new Map(prev).set(modelType, true))

    try {
      const response = await fetch('/api/jobs/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_type: modelType,
          data_source_id: selectedDataSource,
          triggered_by: 'manual',
          model_id: selectedModelId || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${modelType} Optimization Started`, {
          description: result.data.message
        })

        // Add to running jobs for tracking
        setRunningJobs(prev => {
          const updated = new Map(prev)
          updated.set(result.data.job_id, {
            job_id: result.data.job_id,
            model_type: modelType,
            status: 'pending',
            progress: 0,
            started_at: new Date().toISOString(),
            is_running: true,
            is_complete: false
          })
          return updated
        })
        
        fetchRecentJobs()
      } else {
        toast.error(`Failed to start ${modelType}`, {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('Error triggering optimization', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(prev => {
        const updated = new Map(prev)
        updated.delete(modelType)
        return updated
      })
    }
  }

  const viewJobLogs = async (job_id: string) => {
    setSelectedJobId(job_id)
    setShowLogsDialog(true)
    
    try {
      const response = await fetch(`/api/jobs/${job_id}/logs`)
      const result = await response.json()
      
      if (result.success) {
        setJobLogs(result.data)
      }
    } catch (error) {
      console.error('Error fetching job logs:', error)
      toast.error('Failed to fetch job logs')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Optimization Control
              </CardTitle>
              <CardDescription>
                Trigger DMO, RMO, or SO optimization models
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Source Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Source</label>
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map(source => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Optimization Model (optional)</label>
              <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Use default built-in model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use built-in default</SelectItem>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.model_name} ({m.model_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DMO Run Alert */}
          {dmoRunToday && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>DMO Already Run Today</AlertTitle>
              <AlertDescription>
                DMO has already been executed today. Only one run is allowed per day.
              </AlertDescription>
            </Alert>
          )}

          {/* Model Uploader */}
          <div>
            <label className="text-sm font-medium mb-2 block">Upload Optimization Model (.py)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".py"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const fd = new FormData()
                  fd.append('file', f)
                  fd.append('model_type', 'DMO')
                  const res = await fetch('/api/optimization-models', { method: 'POST', body: fd })
                  const json = await res.json()
                  if (json.success) {
                    toast.success('Model uploaded')
                    fetchModels()
                  } else {
                    toast.error(json.error || 'Upload failed')
                  }
                }}
              />
            </div>
          </div>

          {/* Model Trigger Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* DMO Button */}
            <Card className={dmoRunToday ? 'opacity-50' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">DMO</CardTitle>
                <CardDescription className="text-xs">Day-Ahead Market</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => triggerOptimization('DMO')}
                  disabled={!selectedDataSource || loading.get('DMO') || dmoRunToday}
                  className="w-full"
                >
                  {loading.get('DMO') ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Run DMO</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  1x per day at 10am
                </p>
              </CardContent>
            </Card>

            {/* RMO Button */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">RMO</CardTitle>
                <CardDescription className="text-xs">Real-Time Market</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => triggerOptimization('RMO')}
                  disabled={!selectedDataSource || loading.get('RMO')}
                  className="w-full"
                >
                  {loading.get('RMO') ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Run RMO</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  48x per day every 30min
                </p>
              </CardContent>
            </Card>

            {/* SO Button */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SO</CardTitle>
                <CardDescription className="text-xs">Storage Optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => triggerOptimization('SO')}
                  disabled={!selectedDataSource || loading.get('SO')}
                  className="w-full"
                >
                  {loading.get('SO') ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Run SO</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  96x per day every 15min
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Running Jobs */}
          {runningJobs.size > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Running Jobs</h4>
              {Array.from(runningJobs.values()).map((job) => (
                <Card key={job.job_id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="font-medium">{job.model_type}</span>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                    <Progress value={job.progress} className="h-2" />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {job.progress}% complete
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewJobLogs(job.job_id)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Jobs */}
          {recentJobs.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Recent Jobs</h4>
              <div className="space-y-2">
                {recentJobs.slice(0, 5).map((job) => (
                  <div key={job.job_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium text-sm">{job.model_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewJobLogs(job.job_id)}
                      >
                        <FileText className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Logs: {selectedJobId}</DialogTitle>
            <DialogDescription>
              Execution logs and progress information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 font-mono text-xs">
            {jobLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-2 rounded ${
                  log.level === 'ERROR' ? 'bg-red-50 text-red-900' :
                  log.level === 'WARNING' ? 'bg-yellow-50 text-yellow-900' :
                  'bg-gray-50 text-gray-900'
                }`}
              >
                <span className="text-gray-500">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>{' '}
                <span className="font-medium">[{log.level}]</span> {log.message}
              </div>
            ))}
            {jobLogs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No logs available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
