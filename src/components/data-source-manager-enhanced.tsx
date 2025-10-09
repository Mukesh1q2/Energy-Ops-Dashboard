"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  Globe, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  AlertCircle,
  Loader2,
  Settings
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FileUpload {
  id: string
  name: string
  type: 'excel' | 'csv' | 'json'
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  uploadedAt: Date
  processedAt?: Date
  errorMessage?: string
}

interface DataSource {
  id: string
  name: string
  type: 'file' | 'database' | 'api'
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: Date
  recordCount?: number
  config: any
}

interface DatabaseConnection {
  id: string
  name: string
  type: 'postgresql' | 'mysql' | 'mongodb'
  host: string
  port: number
  database: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  lastConnected?: Date
}

interface ApiEndpoint {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  status: 'active' | 'inactive' | 'error'
  lastCalled?: Date
  responseTime?: number
}

export function DataSourceManagerEnhanced() {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [databaseConnections, setDatabaseConnections] = useState<DatabaseConnection[]>([])
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'sources' | 'databases' | 'apis'>('upload')
  
  // Modal states
  const [showDbModal, setShowDbModal] = useState(false)
  const [showApiModal, setShowApiModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string, id: string, name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Database connection form
  const [dbForm, setDbForm] = useState({
    id: '',
    name: '',
    type: 'postgresql',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false
  })
  
  // API endpoint form
  const [apiForm, setApiForm] = useState({
    id: '',
    name: '',
    url: '',
    method: 'GET',
    authType: 'none',
    authToken: '',
    headers: '{}',
    testOnSave: false
  })

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const resetDbForm = () => {
    setDbForm({
      id: '',
      name: '',
      type: 'postgresql',
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false
    })
  }

  const resetApiForm = () => {
    setApiForm({
      id: '',
      name: '',
      url: '',
      method: 'GET',
      authType: 'none',
      authToken: '',
      headers: '{}',
      testOnSave: false
    })
  }

  // Database Connection Handlers
  const handleOpenDbModal = (connection?: DatabaseConnection) => {
    clearMessages()
    if (connection) {
      setDbForm({
        id: connection.id,
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: '',
        password: '',
        ssl: false
      })
    } else {
      resetDbForm()
    }
    setShowDbModal(true)
  }

  const handleSaveDbConnection = async () => {
    clearMessages()
    setIsLoading(true)

    try {
      const url = dbForm.id 
        ? `/api/database-connections/${dbForm.id}`
        : '/api/database-connections'
      
      const method = dbForm.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbForm)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(dbForm.id ? 'Connection updated successfully' : 'Connection created successfully')
        setShowDbModal(false)
        resetDbForm()
        fetchDatabaseConnections()
      } else {
        setError(result.error || 'Failed to save connection')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestDbConnection = async (id: string) => {
    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/database-connections/${id}/test`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Connection successful! Response time: ${result.responseTime}ms`)
        fetchDatabaseConnections()
      } else {
        setError(result.error || 'Connection test failed')
      }
    } catch (err) {
      setError('Network error during connection test')
    } finally {
      setIsLoading(false)
    }
  }

  // API Endpoint Handlers
  const handleOpenApiModal = (endpoint?: ApiEndpoint) => {
    clearMessages()
    if (endpoint) {
      setApiForm({
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        authType: 'none',
        authToken: '',
        headers: '{}',
        testOnSave: false
      })
    } else {
      resetApiForm()
    }
    setShowApiModal(true)
  }

  const handleSaveApiEndpoint = async () => {
    clearMessages()
    setIsLoading(true)

    try {
      const url = apiForm.id 
        ? `/api/api-endpoints/${apiForm.id}`
        : '/api/api-endpoints'
      
      const method = apiForm.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiForm)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(apiForm.id ? 'API endpoint updated successfully' : 'API endpoint created successfully')
        
        // Test if requested
        if (apiForm.testOnSave && result.data?.id) {
          await handleTestApiEndpoint(result.data.id)
        }
        
        setShowApiModal(false)
        resetApiForm()
        fetchApiEndpoints()
      } else {
        setError(result.error || 'Failed to save API endpoint')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestApiEndpoint = async (id: string) => {
    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/api-endpoints/${id}/test`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`API test successful! Response time: ${result.responseTime}ms`)
        fetchApiEndpoints()
      } else {
        setError(result.error || 'API test failed')
      }
    } catch (err) {
      setError('Network error during API test')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete handlers
  const handleDeleteClick = (type: string, id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsLoading(true)
    clearMessages()

    try {
      let url = ''
      if (deleteTarget.type === 'database') {
        url = `/api/database-connections/${deleteTarget.id}`
      } else if (deleteTarget.type === 'api') {
        url = `/api/api-endpoints/${deleteTarget.id}`
      } else if (deleteTarget.type === 'datasource') {
        url = `/api/data-sources/${deleteTarget.id}/delete`
      }

      const response = await fetch(url, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`${deleteTarget.name} deleted successfully`)
        if (deleteTarget.type === 'database') fetchDatabaseConnections()
        else if (deleteTarget.type === 'api') fetchApiEndpoints()
        else if (deleteTarget.type === 'datasource') fetchDataSources()
      } else {
        setError(result.error || 'Failed to delete')
      }
    } catch (err) {
      setError('Network error during deletion')
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  // Sync handler
  const handleSyncDataSource = async (id: string) => {
    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/data-sources/${id}/sync`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Data source synced! ${result.data.recordCount} records found`)
        fetchDataSources()
      } else {
        setError(result.error || 'Sync failed')
      }
    } catch (err) {
      setError('Network error during sync')
    } finally {
      setIsLoading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: FileUpload[] = acceptedFiles.map(file => {
      const fileType = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') 
        ? 'excel' 
        : file.name.toLowerCase().endsWith('.csv') 
        ? 'csv' 
        : 'json'

      return {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: fileType,
        size: file.size,
        status: 'uploading',
        progress: 0,
        uploadedAt: new Date()
      }
    })

    setUploads(prev => [...prev, ...newUploads])

    // Upload files to server
    newUploads.forEach(upload => {
      uploadFileToServer(acceptedFiles.find(f => f.name === upload.name)!, upload.id)
    })
  }, [])

  const uploadFileToServer = async (file: File, uploadId: string) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId && upload.status === 'uploading') {
            return { ...upload, progress: Math.min(upload.progress + 15, 90) }
          }
          return upload
        }))
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      const result = await response.json()

      if (result.success) {
        // Upload and processing are now complete (done automatically in upload API)
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId) {
            return { 
              ...upload, 
              status: 'completed',
              progress: 100,
              processedAt: new Date()
            }
          }
          return upload
        }))

        // Show success message with data source info
        const uploadMessage = `✅ ${result.data.message || 'File uploaded successfully!'}`
        const dataSourceInfo = result.data.recordCount ? ` - ${result.data.recordCount} records processed` : ''
        const dashboardHint = result.data.dataSourceId ? 
          `\n💡 Use "One-Click Plot" above to automatically generate charts from this data.` : ''
        
        setSuccess(uploadMessage + dataSourceInfo + dashboardHint)
        
        // Refresh data sources
        fetchDataSources()
        
        // Auto-trigger dashboard generation suggestion
        if (result.data.dataSourceId) {
          // Emit custom event to notify parent sandbox component
          window.dispatchEvent(new CustomEvent('sandbox:data-uploaded', {
            detail: {
              dataSourceId: result.data.dataSourceId,
              fileName: result.data.fileName,
              recordCount: result.data.recordCount
            }
          }))
        }
      } else {
        // Upload failed
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId) {
            return { 
              ...upload, 
              status: 'error',
              errorMessage: result.error || 'Upload failed'
            }
          }
          return upload
        }))
        setError(result.error || 'Upload failed')
      }
    } catch (error) {
      setUploads(prev => prev.map(upload => {
        if (upload.id === uploadId) {
          return { 
            ...upload, 
            status: 'error',
            errorMessage: 'Network error'
          }
        }
        return upload
      }))
    }
  }

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources')
      const result = await response.json()
      if (result.success) {
        setDataSources(result.data)
      }
    } catch (error) {
      console.error('Error fetching data sources:', error)
    }
  }

  const fetchDatabaseConnections = async () => {
    try {
      const response = await fetch('/api/database-connections')
      const result = await response.json()
      if (result.success) {
        setDatabaseConnections(result.data)
      }
    } catch (error) {
      console.error('Error fetching database connections:', error)
    }
  }

  const fetchApiEndpoints = async () => {
    try {
      const response = await fetch('/api/api-endpoints')
      const result = await response.json()
      if (result.success) {
        setApiEndpoints(result.data)
      }
    } catch (error) {
      console.error('Error fetching API endpoints:', error)
    }
  }

  useEffect(() => {
    fetchDataSources()
    fetchDatabaseConnections()
    fetchApiEndpoints()
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: true
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'connected':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'uploading':
      case 'processing':
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />
      case 'csv':
        return <FileText className="w-5 h-5 text-blue-600" />
      case 'json':
        return <Database className="w-5 h-5 text-yellow-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId))
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Alerts */}
      {(success || error) && (
        <Alert variant={error ? "destructive" : "default"} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'upload', label: 'File Upload', icon: Upload },
          { id: 'sources', label: 'Data Sources', icon: Database },
          { id: 'databases', label: 'Database Connections', icon: Globe },
          { id: 'apis', label: 'API Endpoints', icon: Globe }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1"
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* File Upload Tab - Keep existing implementation */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Data Files</CardTitle>
              <CardDescription>
                Upload Excel, CSV, or JSON files to visualize and analyze your energy market data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports: Excel (.xlsx, .xls), CSV (.csv), JSON (.json) - Max 100MB
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {uploads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Progress</CardTitle>
                <CardDescription>
                  Track the status of your file uploads and processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getFileIcon(upload.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{upload.name}</p>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(upload.status)}
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(upload.size)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Progress value={upload.progress} className="flex-1 mr-4" />
                          <span className="text-xs text-muted-foreground">
                            {upload.progress}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {upload.status === 'uploading' && 'Uploading...'}
                          {upload.status === 'processing' && 'Processing...'}
                          {upload.status === 'completed' && `Completed at ${upload.processedAt?.toLocaleTimeString()}`}
                          {upload.status === 'error' && upload.errorMessage}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUpload(upload.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Data Sources Tab */}
      {activeTab === 'sources' && (
        <Card>
          <CardHeader>
            <CardTitle>Active Data Sources</CardTitle>
            <CardDescription>
              All your connected data sources and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dataSources.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No data sources connected</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a file to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dataSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {source.type === 'file' && <FileText className="w-5 h-5 text-blue-600" />}
                        {source.type === 'database' && <Database className="w-5 h-5 text-green-600" />}
                        {source.type === 'api' && <Globe className="w-5 h-5 text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {source.type.charAt(0).toUpperCase() + source.type.slice(1)} • 
                          {source.recordCount ? ` ${source.recordCount.toLocaleString()} records` : ' Record count unavailable'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(source.status)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {source.status}
                        </span>
                      </div>
                      {source.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Last sync: {new Date(source.lastSync).toLocaleString()}
                        </p>
                      )}
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSyncDataSource(source.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          Sync
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteClick('datasource', source.id, source.name)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Database Connections Tab */}
      {activeTab === 'databases' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Connections</CardTitle>
              <CardDescription>
                Manage connections to external databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => {
                    setDbForm(prev => ({ ...prev, type: 'postgresql', port: 5432 }))
                    handleOpenDbModal()
                  }}
                >
                  <Database className="w-6 h-6 mb-2 text-blue-600" />
                  <span className="font-medium">Add PostgreSQL</span>
                  <span className="text-xs text-muted-foreground">Connect to PostgreSQL</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => {
                    setDbForm(prev => ({ ...prev, type: 'mysql', port: 3306 }))
                    handleOpenDbModal()
                  }}
                >
                  <Database className="w-6 h-6 mb-2 text-green-600" />
                  <span className="font-medium">Add MySQL</span>
                  <span className="text-xs text-muted-foreground">Connect to MySQL</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => {
                    setDbForm(prev => ({ ...prev, type: 'mongodb', port: 27017 }))
                    handleOpenDbModal()
                  }}
                >
                  <Database className="w-6 h-6 mb-2 text-green-700" />
                  <span className="font-medium">Add MongoDB</span>
                  <span className="text-xs text-muted-foreground">Connect to MongoDB</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {databaseConnections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connected Databases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {databaseConnections.map((db) => (
                    <div key={db.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Database className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{db.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {db.type.toUpperCase()} • {db.host}:{db.port}/{db.database}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(db.status)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {db.status}
                          </span>
                        </div>
                        {db.lastConnected && (
                          <p className="text-xs text-muted-foreground">
                            Last connected: {new Date(db.lastConnected).toLocaleString()}
                          </p>
                        )}
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestDbConnection(db.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenDbModal(db)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick('database', db.id, db.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* API Endpoints Tab */}
      {activeTab === 'apis' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Manage REST API connections for real-time data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleOpenApiModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add New API Endpoint
              </Button>
            </CardContent>
          </Card>

          {apiEndpoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configured API Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiEndpoints.map((api) => (
                    <div key={api.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Globe className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{api.name}</p>
                          <p className="text-sm text-muted-foreground">
                            <Badge variant="outline" className="mr-2">{api.method}</Badge>
                            {api.url}
                            {api.responseTime && ` • ${api.responseTime}ms`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(api.status)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {api.status}
                          </span>
                        </div>
                        {api.lastCalled && (
                          <p className="text-xs text-muted-foreground">
                            Last called: {new Date(api.lastCalled).toLocaleString()}
                          </p>
                        )}
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestApiEndpoint(api.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenApiModal(api)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick('api', api.id, api.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Database Connection Modal */}
      <Dialog open={showDbModal} onOpenChange={setShowDbModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dbForm.id ? 'Edit' : 'Add'} Database Connection
            </DialogTitle>
            <DialogDescription>
              Configure your database connection settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="db-name">Connection Name *</Label>
                <Input
                  id="db-name"
                  placeholder="My Production DB"
                  value={dbForm.name}
                  onChange={(e) => setDbForm({...dbForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-type">Database Type *</Label>
                <Select
                  value={dbForm.type}
                  onValueChange={(value) => {
                    const defaultPorts: Record<string, number> = {
                      postgresql: 5432,
                      mysql: 3306,
                      mongodb: 27017
                    }
                    setDbForm({...dbForm, type: value, port: defaultPorts[value]})
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="db-host">Host *</Label>
                <Input
                  id="db-host"
                  placeholder="localhost or IP address"
                  value={dbForm.host}
                  onChange={(e) => setDbForm({...dbForm, host: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-port">Port *</Label>
                <Input
                  id="db-port"
                  type="number"
                  placeholder="5432"
                  value={dbForm.port}
                  onChange={(e) => setDbForm({...dbForm, port: parseInt(e.target.value) || 5432})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="db-database">Database Name *</Label>
              <Input
                id="db-database"
                placeholder="my_database"
                value={dbForm.database}
                onChange={(e) => setDbForm({...dbForm, database: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="db-username">Username</Label>
                <Input
                  id="db-username"
                  placeholder="db_user"
                  value={dbForm.username}
                  onChange={(e) => setDbForm({...dbForm, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-password">Password</Label>
                <Input
                  id="db-password"
                  type="password"
                  placeholder="••••••••"
                  value={dbForm.password}
                  onChange={(e) => setDbForm({...dbForm, password: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="db-ssl"
                checked={dbForm.ssl}
                onCheckedChange={(checked) => setDbForm({...dbForm, ssl: checked as boolean})}
              />
              <Label htmlFor="db-ssl">Use SSL/TLS Connection</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDbModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDbConnection}
              disabled={isLoading || !dbForm.name || !dbForm.host || !dbForm.database}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {dbForm.id ? 'Update' : 'Create'} Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Endpoint Modal */}
      <Dialog open={showApiModal} onOpenChange={setShowApiModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {apiForm.id ? 'Edit' : 'Add'} API Endpoint
            </DialogTitle>
            <DialogDescription>
              Configure your API endpoint settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-name">Endpoint Name *</Label>
              <Input
                id="api-name"
                placeholder="Weather API"
                value={apiForm.name}
                onChange={(e) => setApiForm({...apiForm, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-method">Method *</Label>
                <Select
                  value={apiForm.method}
                  onValueChange={(value) => setApiForm({...apiForm, method: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-3">
                <Label htmlFor="api-url">URL *</Label>
                <Input
                  id="api-url"
                  placeholder="https://api.example.com/data"
                  value={apiForm.url}
                  onChange={(e) => setApiForm({...apiForm, url: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Authentication</Label>
              <Tabs defaultValue={apiForm.authType} onValueChange={(value) => setApiForm({...apiForm, authType: value})}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="none">None</TabsTrigger>
                  <TabsTrigger value="bearer">Bearer Token</TabsTrigger>
                  <TabsTrigger value="apikey">API Key</TabsTrigger>
                </TabsList>
                <TabsContent value="bearer" className="space-y-2">
                  <Label htmlFor="bearer-token">Bearer Token</Label>
                  <Input
                    id="bearer-token"
                    type="password"
                    placeholder="Enter your bearer token"
                    value={apiForm.authToken}
                    onChange={(e) => setApiForm({...apiForm, authToken: e.target.value})}
                  />
                </TabsContent>
                <TabsContent value="apikey" className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiForm.authToken}
                    onChange={(e) => setApiForm({...apiForm, authToken: e.target.value})}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-headers">Custom Headers (JSON)</Label>
              <Textarea
                id="api-headers"
                placeholder='{"Content-Type": "application/json"}'
                value={apiForm.headers}
                onChange={(e) => setApiForm({...apiForm, headers: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="test-on-save"
                checked={apiForm.testOnSave}
                onCheckedChange={(checked) => setApiForm({...apiForm, testOnSave: checked as boolean})}
              />
              <Label htmlFor="test-on-save">Test connection after saving</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveApiEndpoint}
              disabled={isLoading || !apiForm.name || !apiForm.url}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {apiForm.id ? 'Update' : 'Create'} Endpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
