"use client"

import { useState, useEffect } from 'react'
import { Play, Clock, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/use-socket'

interface ModelStatus {
  type: 'DMO' | 'RMO' | 'SO'
  status: 'idle' | 'running' | 'success' | 'failed'
  lastRun?: string
  activeModelId?: string
  activeModelName?: string
  currentJobId?: string
}

export function OptimizationControlPanel() {
  const [models, setModels] = useState<ModelStatus[]>([
    { type: 'DMO', status: 'idle' },
    { type: 'RMO', status: 'idle' },
    { type: 'SO', status: 'idle' }
  ])
  const [loading, setLoading] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    fetchModels()
    
    // Listen for model uploads to refresh
    const handleModelUpload = () => {
      fetchModels()
    }
    window.addEventListener('model-uploaded', handleModelUpload)
    
    return () => {
      window.removeEventListener('model-uploaded', handleModelUpload)
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    // Listen for optimization events
    socket.on('optimization:started', (data: any) => {
      setModels(prev => prev.map(m => 
        m.type === data.modelType 
          ? { ...m, status: 'running', currentJobId: data.jobId }
          : m
      ))
      toast.info(`${data.modelType} optimization started`, {
        description: data.modelName
      })
    })

    socket.on('optimization:completed', (data: any) => {
      setModels(prev => prev.map(m => 
        m.type === data.modelType 
          ? { ...m, status: data.status === 'success' ? 'success' : 'failed', currentJobId: undefined }
          : m
      ))
      
      if (data.status === 'success') {
        toast.success(`${data.modelType} optimization completed`)
      }
      
      // Refresh to get updated last run time
      setTimeout(() => fetchModels(), 1000)
    })

    socket.on('optimization:failed', (data: any) => {
      setModels(prev => prev.map(m => 
        m.type === data.modelType 
          ? { ...m, status: 'failed', currentJobId: undefined }
          : m
      ))
      toast.error(`${data.modelType} optimization failed`, {
        description: data.error
      })
    })

    return () => {
      socket.off('optimization:started')
      socket.off('optimization:completed')
      socket.off('optimization:failed')
    }
  }, [socket])

  const fetchModels = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/optimization/models')
      const data = await response.json()

      if (data.success) {
        const updated = models.map(m => {
          const model = data.models.find((dm: any) => dm.model_type === m.type && dm.status === 'active')
          return {
            ...m,
            activeModelId: model?.id,
            activeModelName: model?.original_filename,
            lastRun: model?.lastRun?.completed_at,
            status: model?.lastRun?.status === 'running' ? 'running' :
                   model?.lastRun?.status === 'success' ? 'success' :
                   model?.lastRun?.status === 'failed' ? 'failed' : 'idle'
          }
        })
        setModels(updated)
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const runModel = async (modelType: 'DMO' | 'RMO' | 'SO') => {
    const model = models.find(m => m.type === modelType)
    if (!model?.activeModelId) {
      toast.error(`No active ${modelType} model found`, {
        description: 'Please upload a model first'
      })
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
        toast.success(`${modelType} optimization started!`, {
          description: `Job ID: ${result.jobId}`
        })
        setModels(prev => prev.map(m => 
          m.type === modelType ? { ...m, currentJobId: result.jobId } : m
        ))
      } else {
        toast.error(result.error || 'Failed to start optimization')
        setModels(prev => prev.map(m => 
          m.type === modelType ? { ...m, status: 'failed' } : m
        ))
      }
    } catch (error) {
      console.error('Execute error:', error)
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
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: ModelStatus['status']) => {
    const variants: Record<string, any> = {
      running: { variant: 'default', text: 'Running' },
      success: { variant: 'success', text: 'Success' },
      failed: { variant: 'destructive', text: 'Failed' },
      idle: { variant: 'secondary', text: 'Idle' }
    }
    
    const config = variants[status]
    return (
      <Badge variant={config.variant as any} className="ml-2">
        {config.text}
      </Badge>
    )
  }

  const formatLastRun = (dateString?: string) => {
    if (!dateString) return 'Never run'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return date.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Optimization Control Center
              {!isConnected && (
                <Badge variant="outline" className="text-yellow-600">
                  Disconnected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Trigger optimization models and monitor execution status
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchModels}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {models.map(model => (
          <div 
            key={model.type} 
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(model.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{model.type}</span>
                  {getStatusBadge(model.status)}
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {model.activeModelName ? (
                    <div>Model: {model.activeModelName}</div>
                  ) : (
                    <div className="text-yellow-600">No model uploaded</div>
                  )}
                  <div>Last run: {formatLastRun(model.lastRun)}</div>
                  {model.currentJobId && (
                    <div className="font-mono text-[10px]">Job: {model.currentJobId.substring(0, 20)}...</div>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => runModel(model.type)}
              disabled={
                loading === model.type || 
                model.status === 'running' || 
                !model.activeModelId ||
                !isConnected
              }
              size="sm"
              className="ml-4"
            >
              {loading === model.type || model.status === 'running' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Running
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Run {model.type}
                </>
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
