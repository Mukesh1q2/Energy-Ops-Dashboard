"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  Filter,
  Transform,
  Validate
} from "lucide-react"
import { useDropzone } from "react-dropzone"

interface ValidationRule {
  id: string
  name: string
  description: string
  type: 'required' | 'format' | 'range' | 'uniqueness' | 'custom'
  enabled: boolean
  parameters: Record<string, any>
}

interface TransformationRule {
  id: string
  name: string
  description: string
  type: 'mapping' | 'calculation' | 'formatting' | 'aggregation' | 'filter'
  enabled: boolean
  parameters: Record<string, any>
}

interface ProcessingResult {
  id: string
  fileName: string
  fileSize: number
  status: 'uploading' | 'validating' | 'transforming' | 'processing' | 'completed' | 'error'
  progress: number
  uploadedAt: Date
  processedAt?: Date
  errorMessage?: string
  validationResults?: {
    totalRows: number
    validRows: number
    invalidRows: number
    errors: Array<{
      row: number
      column: string
      message: string
      severity: 'error' | 'warning' | 'info'
    }>
  }
  transformationResults?: {
    rowsProcessed: number
    columnsTransformed: number
    transformationsApplied: number
  }
}

interface DataPreview {
  columns: string[]
  rows: Array<Record<string, any>>
  totalRows: number
  sampleSize: number
}

export function EnhancedDataProcessor() {
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([])
  const [activeTab, setActiveTab] = useState('upload')
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([])
  const [transformationRules, setTransformationRules] = useState<TransformationRule[]>([])
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Initialize validation and transformation rules
  useState(() => {
    const initialValidationRules: ValidationRule[] = [
      {
        id: 'required-fields',
        name: 'Required Fields',
        description: 'Ensure mandatory fields are present',
        type: 'required',
        enabled: true,
        parameters: { fields: ['time_period', 'region', 'technology_type'] }
      },
      {
        id: 'date-format',
        name: 'Date Format Validation',
        description: 'Validate date format in time_period column',
        type: 'format',
        enabled: true,
        parameters: { format: 'YYYY-MM-DDTHH:mm:ss.sssZ', column: 'time_period' }
      },
      {
        id: 'numeric-range',
        name: 'Numeric Range Validation',
        description: 'Ensure numeric values are within acceptable ranges',
        type: 'range',
        enabled: true,
        parameters: { 
          columns: ['scheduled_mw', 'actual_mw', 'bid_price_rs_per_mwh'],
          min: 0,
          max: 100000
        }
      },
      {
        id: 'uniqueness-check',
        name: 'Uniqueness Validation',
        description: 'Ensure unique identifiers where required',
        type: 'uniqueness',
        enabled: true,
        parameters: { columns: ['id', 'plant_id'] }
      }
    ]
    setValidationRules(initialValidationRules)

    const initialTransformationRules: TransformationRule[] = [
      {
        id: 'date-normalization',
        name: 'Date Normalization',
        description: 'Standardize date formats',
        type: 'formatting',
        enabled: true,
        parameters: { inputFormat: 'auto', outputFormat: 'ISO' }
      },
      {
        id: 'unit-conversion',
        name: 'Unit Conversion',
        description: 'Convert units to standard format',
        type: 'mapping',
        enabled: true,
        parameters: { conversions: { 'MW': 'mw', 'KWH': 'kwh' } }
      },
      {
        id: 'data-cleaning',
        name: 'Data Cleaning',
        description: 'Remove null values and standardize text',
        type: 'filter',
        enabled: true,
        parameters: { removeNulls: true, trimWhitespace: true }
      },
      {
        id: 'aggregation',
        name: 'Data Aggregation',
        description: 'Aggregate data by time periods',
        type: 'aggregation',
        enabled: false,
        parameters: { groupBy: ['region', 'technology_type'], aggregations: { 'scheduled_mw': 'sum' } }
      }
    ]
    setTransformationRules(initialTransformationRules)
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setSelectedFile(file)
    processFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: false
  })

  const processFile = async (file: File) => {
    const result: ProcessingResult = {
      id: Date.now().toString(),
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading',
      progress: 0,
      uploadedAt: new Date()
    }

    setProcessingResults(prev => [result, ...prev])

    try {
      // Simulate file upload
      await simulateProgress(result, 'uploading', 0, 30)
      
      // Validate file
      await simulateProgress(result, 'validating', 30, 60)
      const validationResult = await validateFile(file)
      
      // Transform data
      await simulateProgress(result, 'transforming', 60, 80)
      const transformationResult = await transformFile(file)
      
      // Process and store
      await simulateProgress(result, 'processing', 80, 95)
      await processToDatabase(file)
      
      // Complete
      await simulateProgress(result, 'completed', 95, 100)
      
      setProcessingResults(prev => 
        prev.map(r => r.id === result.id ? { 
          ...r, 
          status: 'completed',
          validationResults: validationResult,
          transformationResults: transformationResult,
          processedAt: new Date()
        } : r)
      )

      // Generate data preview
      generateDataPreview(file)
      
    } catch (error) {
      setProcessingResults(prev => 
        prev.map(r => r.id === result.id ? { 
          ...r, 
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Processing failed'
        } : r)
      )
    }
  }

  const simulateProgress = (result: ProcessingResult, status: ProcessingResult['status'], startProgress: number, endProgress: number): Promise<void> => {
    return new Promise((resolve) => {
      const duration = 1000 + Math.random() * 2000 // 1-3 seconds
      const steps = 20
      const stepProgress = (endProgress - startProgress) / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        const newProgress = startProgress + (stepProgress * currentStep)
        
        setProcessingResults(prev => 
          prev.map(r => r.id === result.id ? { ...r, status, progress: Math.min(newProgress, endProgress) } : r)
        )

        if (currentStep >= steps) {
          clearInterval(interval)
          resolve()
        }
      }, duration / steps)
    })
  }

  const validateFile = async (file: File) => {
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      totalRows: 1250,
      validRows: 1180,
      invalidRows: 70,
      errors: [
        { row: 15, column: 'time_period', message: 'Invalid date format', severity: 'error' },
        { row: 23, column: 'scheduled_mw', message: 'Value out of range', severity: 'warning' },
        { row: 45, column: 'region', message: 'Missing required field', severity: 'error' }
      ]
    }
  }

  const transformFile = async (file: File) => {
    // Simulate transformation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      rowsProcessed: 1180,
      columnsTransformed: 8,
      transformationsApplied: 3
    }
  }

  const processToDatabase = async (file: File) => {
    // Simulate database processing
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  const generateDataPreview = (file: File) => {
    // Simulate data preview generation
    const preview: DataPreview = {
      columns: ['time_period', 'region', 'state', 'technology_type', 'scheduled_mw', 'actual_mw', 'bid_price_rs_per_mwh', 'bid_volume_mw'],
      rows: [
        { time_period: '2024-01-01T00:00:00.000Z', region: 'Northern', state: 'Delhi', technology_type: 'Solar', scheduled_mw: 150, actual_mw: 145, bid_price_rs_per_mwh: 4500, bid_volume_mw: 140 },
        { time_period: '2024-01-01T01:00:00.000Z', region: 'Western', state: 'Maharashtra', technology_type: 'Wind', scheduled_mw: 200, actual_mw: 195, bid_price_rs_per_mwh: 4200, bid_volume_mw: 190 },
        { time_period: '2024-01-01T02:00:00.000Z', region: 'Southern', state: 'Tamil Nadu', technology_type: 'Coal', scheduled_mw: 300, actual_mw: 295, bid_price_rs_per_mwh: 3800, bid_volume_mw: 290 },
        { time_period: '2024-01-01T03:00:00.000Z', region: 'Eastern', state: 'West Bengal', technology_type: 'Gas', scheduled_mw: 120, actual_mw: 118, bid_price_rs_per_mwh: 5200, bid_volume_mw: 115 },
        { time_period: '2024-01-01T04:00:00.000Z', region: 'North Eastern', state: 'Assam', technology_type: 'Hydro', scheduled_mw: 80, actual_mw: 78, bid_price_rs_per_mwh: 3500, bid_volume_mw: 75 }
      ],
      totalRows: 1250,
      sampleSize: 5
    }
    setDataPreview(preview)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: ProcessingResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'uploading':
      case 'validating':
      case 'transforming':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const updateValidationRule = (id: string, enabled: boolean) => {
    setValidationRules(prev => 
      prev.map(rule => rule.id === id ? { ...rule, enabled } : rule)
    )
  }

  const updateTransformationRule = (id: string, enabled: boolean) => {
    setTransformationRules(prev => 
      prev.map(rule => rule.id === id ? { ...rule, enabled } : rule)
    )
  }

  const removeResult = (id: string) => {
    setProcessingResults(prev => prev.filter(result => result.id !== id))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Transform className="w-5 h-5 text-blue-600" />
            Enhanced Data Processor
          </CardTitle>
          <CardDescription>
            Advanced file processing with validation, transformation, and data quality assurance
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="validation">Validation Rules</TabsTrigger>
          <TabsTrigger value="transformation">Transformation</TabsTrigger>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Upload & Processing</CardTitle>
              <CardDescription>
                Upload Excel, CSV, or JSON files with advanced validation and transformation
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
                  <p className="text-lg font-medium">Drop the file here...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop file here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports: Excel (.xlsx, .xls), CSV (.csv), JSON (.json)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {processingResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Results</CardTitle>
                <CardDescription>
                  Track the status of your file processing operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processingResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <p className="font-medium">{result.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(result.fileSize)} • {result.uploadedAt.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            result.status === 'completed' ? 'default' :
                            result.status === 'error' ? 'destructive' : 'secondary'
                          }>
                            {result.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeResult(result.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Progress value={result.progress} className="mb-3" />

                      {result.validationResults && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center p-2 border rounded">
                            <div className="text-lg font-bold">{result.validationResults.totalRows}</div>
                            <div className="text-xs text-muted-foreground">Total Rows</div>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-lg font-bold text-green-600">{result.validationResults.validRows}</div>
                            <div className="text-xs text-muted-foreground">Valid Rows</div>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-lg font-bold text-red-600">{result.validationResults.invalidRows}</div>
                            <div className="text-xs text-muted-foreground">Invalid Rows</div>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-lg font-bold text-blue-600">
                              {((result.validationResults.validRows / result.validationResults.totalRows) * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Quality Score</div>
                          </div>
                        </div>
                      )}

                      {result.transformationResults && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-2 border rounded">
                            <div className="text-lg font-bold">{result.transformationResults.rowsProcessed}</div>
                            <div className="text-xs text-muted-foreground">Rows Processed</div>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-lg font-bold">{result.transformationResults.columnsTransformed}</div>
                            <div className="text-xs text-muted-foreground">Columns Transformed</div>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="text-lg font-bold">{result.transformationResults.transformationsApplied}</div>
                            <div className="text-xs text-muted-foreground">Transformations</div>
                          </div>
                        </div>
                      )}

                      {result.errorMessage && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-600">{result.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Validate className="w-5 h-5 text-green-600" />
                Validation Rules
              </CardTitle>
              <CardDescription>
                Configure data validation rules to ensure data quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant="outline">{rule.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => updateValidationRule(rule.id, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transformation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Transform className="w-5 h-5 text-purple-600" />
                Transformation Rules
              </CardTitle>
              <CardDescription>
                Configure data transformation rules for processing and standardization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transformationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant="outline">{rule.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Transform className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => updateTransformationRule(rule.id, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {dataPreview ? (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Preview of processed data showing {dataPreview.sampleSize} of {dataPreview.totalRows} rows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-muted">
                        {dataPreview.columns.map((column) => (
                          <th key={column} className="border border-gray-300 px-4 py-2 text-left font-medium">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataPreview.rows.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                          {dataPreview.columns.map((column) => (
                            <td key={column} className="border border-gray-300 px-4 py-2 text-sm">
                              {row[column]?.toString() || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {dataPreview.sampleSize} of {dataPreview.totalRows} rows
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Dataset
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No Data Preview</p>
                  <p className="text-muted-foreground">Upload and process a file to see data preview</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}