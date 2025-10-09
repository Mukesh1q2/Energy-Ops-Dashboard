"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Eye, FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface OptimizationRun {
  id: string
  type: 'DMO' | 'RMO' | 'SO'
  status: 'completed' | 'failed' | 'running'
  startTime: Date
  endTime?: Date
  duration?: number
  results?: any
  logs?: string[]
}

export function ArchivesPage() {
  const [runs, setRuns] = useState<OptimizationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'DMO' | 'RMO' | 'SO'>('all')

  useEffect(() => {
    fetchArchives()
  }, [])

  const fetchArchives = async () => {
    try {
      const response = await fetch('/api/optimization/archives')
      const data = await response.json()
      if (data.success) {
        setRuns(data.runs || [])
      }
    } catch (error) {
      console.error('Error fetching archives:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary'
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const colors: any = {
      DMO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      RMO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      SO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    return (
      <Badge className={colors[type]}>
        {type}
      </Badge>
    )
  }

  const handleDownload = async (runId: string) => {
    try {
      const response = await fetch(`/api/optimization/archives/${runId}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `optimization_run_${runId}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading run:', error)
    }
  }

  const filteredRuns = filter === 'all' ? runs : runs.filter(run => run.type === filter)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading archives...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Archives</h2>
          <p className="text-muted-foreground">
            Historical optimization runs and results
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Runs
          </Button>
          <Button
            variant={filter === 'DMO' ? 'default' : 'outline'}
            onClick={() => setFilter('DMO')}
          >
            DMO
          </Button>
          <Button
            variant={filter === 'RMO' ? 'default' : 'outline'}
            onClick={() => setFilter('RMO')}
          >
            RMO
          </Button>
          <Button
            variant={filter === 'SO' ? 'default' : 'outline'}
            onClick={() => setFilter('SO')}
          >
            SO
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Run History</CardTitle>
          <CardDescription>
            View and download results from past optimization runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRuns.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No archives found</h3>
              <p className="text-muted-foreground">
                {filter === 'all'
                  ? 'No optimization runs have been archived yet.'
                  : `No ${filter} optimization runs have been archived yet.`}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(run.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          {getStatusBadge(run.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(run.startTime), 'dd/MM/yyyy')}
                          <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                          {format(new Date(run.startTime), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {run.duration
                          ? `${Math.floor(run.duration / 60)}m ${run.duration % 60}s`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {run.results ? (
                          <div className="text-sm">
                            <div>Optimized: {run.results.optimized || 'N/A'}</div>
                            <div className="text-muted-foreground">
                              Cost: ₹{run.results.cost?.toLocaleString('en-IN') || 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No results</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(run.id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // View details
                              window.location.href = `/archives/${run.id}`
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {runs.filter(r => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {runs.filter(r => r.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {runs.filter(r => r.status === 'running').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
