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
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  AlertCircle,
  Loader2
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

export function DataSourceManager() {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [databaseConnections, setDatabaseConnections] = useState<DatabaseConnection[]>([])
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'sources' | 'databases' | 'apis'>('upload')
  
  // Modal states
  const [showDbModal, setShowDbModal] = useState(false)
  const [showApiModal, setShowApiModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
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

        // Refresh data sources
        fetchDataSources()
      } else {
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId) {
            return { 
              ...upload, 
              status: 'error',
              errorMessage: result.error
            }
          }
          return upload
        }))
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

      {/* File Upload Tab */}
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
                      Supports: Excel (.xlsx, .xls), CSV (.csv), JSON (.json)
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
                  Connect your first data source to get started
                </p>
                <Button>Connect Data Source</Button>
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
                          Last sync: {source.lastSync.toLocaleString()}
                        </p>
                      )}
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync
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
                <Button variant="outline" className="h-20 flex-col">
                  <Database className="w-6 h-6 mb-2 text-blue-600" />
                  Add PostgreSQL
                  <span className="text-xs text-muted-foreground">Connect to PostgreSQL database</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Database className="w-6 h-6 mb-2 text-green-600" />
                  Add MySQL
                  <span className="text-xs text-muted-foreground">Connect to MySQL database</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Database className="w-6 h-6 mb-2 text-green-700" />
                  Add MongoDB
                  <span className="text-xs text-muted-foreground">Connect to MongoDB database</span>
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
                            Last connected: {db.lastConnected.toLocaleString()}
                          </p>
                        )}
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Test Connection
                          </Button>
                          <Button variant="outline" size="sm">
                            Configure
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
              <Button>Add New API Endpoint</Button>
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
                            {api.method} {api.url}
                            {api.responseTime && ` • ${api.responseTime}ms response time`}
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
                            Last called: {api.lastCalled.toLocaleString()}
                          </p>
                        )}
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Test
                          </Button>
                          <Button variant="outline" size="sm">
                            Configure
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
    </div>
  )
}