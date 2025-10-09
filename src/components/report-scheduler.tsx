"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Calendar, 
  Clock, 
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Download,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface ScheduledReport {
  id: string
  name: string
  type: 'optimization' | 'performance' | 'comparison'
  format: 'pdf' | 'excel' | 'both'
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  schedule_time: string
  recipients: string[]
  models: string[]
  is_active: boolean
  last_run?: string
  next_run: string
  created_at: string
}

export function ReportScheduler() {
  const [schedules, setSchedules] = useState<ScheduledReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'optimization' as 'optimization' | 'performance' | 'comparison',
    format: 'pdf' as 'pdf' | 'excel' | 'both',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    schedule_time: '09:00',
    day_of_week: '1',
    day_of_month: '1',
    recipients: '',
    models: [] as string[],
    is_active: true
  })

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/reports/schedules')
      const result = await response.json()
      
      if (result.success) {
        setSchedules(result.data)
      } else {
        // Mock data for development
        const mockSchedules: ScheduledReport[] = [
          {
            id: 'sched-001',
            name: 'Daily Optimization Summary',
            type: 'optimization',
            format: 'pdf',
            frequency: 'daily',
            schedule_time: '09:00',
            recipients: ['admin@energy.com', 'ops@energy.com'],
            models: ['DMO', 'RMO', 'SO'],
            is_active: true,
            last_run: new Date(Date.now() - 86400000).toISOString(),
            next_run: new Date(Date.now() + 3600000).toISOString(),
            created_at: new Date(Date.now() - 604800000).toISOString()
          },
          {
            id: 'sched-002',
            name: 'Weekly Performance Report',
            type: 'performance',
            format: 'both',
            frequency: 'weekly',
            schedule_time: '10:00',
            recipients: ['manager@energy.com'],
            models: ['DMO', 'RMO', 'SO'],
            is_active: true,
            last_run: new Date(Date.now() - 604800000).toISOString(),
            next_run: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date(Date.now() - 2592000000).toISOString()
          },
          {
            id: 'sched-003',
            name: 'Monthly Comparison Analysis',
            type: 'comparison',
            format: 'excel',
            frequency: 'monthly',
            schedule_time: '08:00',
            recipients: ['ceo@energy.com', 'cfo@energy.com'],
            models: ['DMO'],
            is_active: false,
            last_run: new Date(Date.now() - 2592000000).toISOString(),
            next_run: new Date(Date.now() + 2592000000).toISOString(),
            created_at: new Date(Date.now() - 7776000000).toISOString()
          }
        ]
        setSchedules(mockSchedules)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast.error('Failed to fetch schedules')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const recipientsArray = formData.recipients.split(',').map(e => e.trim()).filter(e => e)
      
      const payload = {
        ...formData,
        recipients: recipientsArray
      }

      const endpoint = editingSchedule 
        ? `/api/reports/schedules/${editingSchedule.id}`
        : '/api/reports/schedules'
      
      const method = editingSchedule ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingSchedule ? 'Schedule updated successfully' : 'Schedule created successfully')
        setIsDialogOpen(false)
        resetForm()
        fetchSchedules()
      } else {
        throw new Error(result.message || 'Failed to save schedule')
      }
    } catch (error: any) {
      console.error('Error saving schedule:', error)
      toast.error(error.message || 'Failed to save schedule')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      const response = await fetch(`/api/reports/schedules/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Schedule deleted successfully')
        fetchSchedules()
      } else {
        throw new Error(result.message || 'Failed to delete schedule')
      }
    } catch (error: any) {
      console.error('Error deleting schedule:', error)
      toast.error(error.message || 'Failed to delete schedule')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/reports/schedules/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(currentStatus ? 'Schedule paused' : 'Schedule activated')
        fetchSchedules()
      } else {
        throw new Error(result.message || 'Failed to toggle schedule')
      }
    } catch (error: any) {
      console.error('Error toggling schedule:', error)
      toast.error(error.message || 'Failed to toggle schedule')
    }
  }

  const handleRunNow = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/schedules/${id}/run`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Report generation started')
      } else {
        throw new Error(result.message || 'Failed to run report')
      }
    } catch (error: any) {
      console.error('Error running report:', error)
      toast.error(error.message || 'Failed to run report')
    }
  }

  const handleEdit = (schedule: ScheduledReport) => {
    setEditingSchedule(schedule)
    setFormData({
      name: schedule.name,
      type: schedule.type,
      format: schedule.format,
      frequency: schedule.frequency,
      schedule_time: schedule.schedule_time,
      day_of_week: '1',
      day_of_month: '1',
      recipients: schedule.recipients.join(', '),
      models: schedule.models,
      is_active: schedule.is_active
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingSchedule(null)
    setFormData({
      name: '',
      type: 'optimization',
      format: 'pdf',
      frequency: 'daily',
      schedule_time: '09:00',
      day_of_week: '1',
      day_of_month: '1',
      recipients: '',
      models: [],
      is_active: true
    })
  }

  const handleModelToggle = (model: string) => {
    setFormData(prev => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter(m => m !== model)
        : [...prev.models, model]
    }))
  }

  const getFrequencyBadge = (frequency: string) => {
    const colors: Record<string, string> = {
      daily: 'bg-blue-500',
      weekly: 'bg-green-500',
      monthly: 'bg-purple-500',
      custom: 'bg-orange-500'
    }
    return <Badge className={colors[frequency]}>{frequency}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      optimization: 'bg-blue-600',
      performance: 'bg-green-600',
      comparison: 'bg-purple-600'
    }
    return <Badge className={colors[type]}>{type}</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Report Scheduler
          </h2>
          <p className="text-muted-foreground">Automate report generation and distribution</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
              </DialogTitle>
              <DialogDescription>
                Configure automated report generation and delivery
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  placeholder="Daily Optimization Report"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Report Type</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({ ...formData, type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="optimization">Optimization Report</SelectItem>
                    <SelectItem value="performance">Performance Dashboard</SelectItem>
                    <SelectItem value="comparison">Run Comparison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <Label htmlFor="format">Output Format</Label>
                <Select value={formData.format} onValueChange={(val: any) => setFormData({ ...formData, format: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Only</SelectItem>
                    <SelectItem value="excel">Excel Only</SelectItem>
                    <SelectItem value="both">Both PDF & Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(val: any) => setFormData({ ...formData, frequency: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time">Schedule Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.schedule_time}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                />
              </div>

              {/* Day of Week (for weekly) */}
              {formData.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="day-week">Day of Week</Label>
                  <Select value={formData.day_of_week} onValueChange={(val) => setFormData({ ...formData, day_of_week: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="0">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Day of Month (for monthly) */}
              {formData.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="day-month">Day of Month</Label>
                  <Input
                    id="day-month"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                  />
                </div>
              )}

              {/* Models */}
              <div className="space-y-2">
                <Label>Include Models</Label>
                <div className="flex gap-4">
                  {['DMO', 'RMO', 'SO'].map(model => (
                    <div key={model} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={model}
                        checked={formData.models.includes(model)}
                        onChange={() => handleModelToggle(model)}
                        className="cursor-pointer"
                      />
                      <Label htmlFor={model} className="cursor-pointer">{model}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <Label htmlFor="recipients">Email Recipients</Label>
                <Input
                  id="recipients"
                  placeholder="admin@energy.com, ops@energy.com"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-xs text-muted-foreground">Enable or disable this schedule</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Schedules</CardTitle>
          <CardDescription>Manage your automated report schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No schedules configured yet
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map(schedule => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>{getTypeBadge(schedule.type)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{schedule.format.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{getFrequencyBadge(schedule.frequency)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {new Date(schedule.next_run).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {schedule.is_active ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Pause className="w-3 h-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRunNow(schedule.id)}
                            title="Run now"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(schedule.id, schedule.is_active)}
                            title={schedule.is_active ? 'Pause' : 'Activate'}
                          >
                            {schedule.is_active ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(schedule.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Schedules</p>
                <p className="text-3xl font-bold">{schedules.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {schedules.filter(s => s.is_active).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-3xl font-bold text-gray-600">
                  {schedules.filter(s => !s.is_active).length}
                </p>
              </div>
              <Pause className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next Run</p>
                <p className="text-sm font-bold">
                  {schedules.filter(s => s.is_active).length > 0
                    ? new Date(
                        Math.min(
                          ...schedules
                            .filter(s => s.is_active)
                            .map(s => new Date(s.next_run).getTime())
                        )
                      ).toLocaleTimeString()
                    : 'N/A'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
