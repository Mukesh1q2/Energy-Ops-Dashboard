"use client"

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, Zap, FileText, TrendingUp, X, CheckCircle, Sheet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UploadResult {
  fileName: string
  recordsInserted: number
  totalRows: number
  skipped: number
  errors: string[]
}

interface WorkbookInfo {
  fileName: string
  sheetNames: string[]
  defaultSheet: string
}

interface ModuleConfig {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  endpoint: string
  requiredColumns: string[]
  optionalColumns: string[]
}

const modules: ModuleConfig[] = [
  {
    id: 'generator',
    title: 'Generator Scheduling',
    description: 'Upload generator scheduling data with plant details and scheduled MW',
    icon: <Zap className="h-5 w-5" />,
    endpoint: '/api/dmo/generator-scheduling/upload',
    requiredColumns: [
      'TimePeriod',
      'Region',
      'State',
      'PlantID',
      'PlantName',
      'TechnologyType',
      'ScheduledMW'
    ],
    optionalColumns: [
      'ContractName',
      'ActualMW'
    ]
  },
  {
    id: 'contract',
    title: 'Contract Scheduling',
    description: 'Upload contract scheduling data including buyer, seller, and contracted volume',
    icon: <FileText className="h-5 w-5" />,
    endpoint: '/api/dmo/contract-scheduling/upload',
    requiredColumns: [
      'TimePeriod',
      'ContractName',
      'BuyerEntity',
      'SellerEntity',
      'ContractedMW'
    ],
    optionalColumns: [
      'Region',
      'State',
      'ScheduledMW',
      'ActualMW',
      'ContractType'
    ]
  },
  {
    id: 'bidding',
    title: 'Market Bidding',
    description: 'Upload market bidding data with buy/sell bids and prices',
    icon: <TrendingUp className="h-5 w-5" />,
    endpoint: '/api/dmo/market-bidding/upload',
    requiredColumns: [
      'TimePeriod',
      'Region',
      'BidType',
      'BidVolumeMW',
      'BidPriceRs'
    ],
    optionalColumns: [
      'State',
      'PlantName',
      'ContractName',
      'Status',
      'ClearedMW',
      'ClearedPriceRs'
    ]
  }
]

export function DMOUploadTabs() {
  const [activeModule, setActiveModule] = useState(modules[0].id)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({})
  const [workbookInfo, setWorkbookInfo] = useState<Record<string, WorkbookInfo>>({})
  const [selectedSheets, setSelectedSheets] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, UploadResult>>({})

  const currentModule = modules.find(m => m.id === activeModule)!

  const onDrop = async (acceptedFiles: File[], moduleId: string) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Check file type
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid file type', {
        description: 'Please upload an Excel (.xlsx, .xls) or CSV file'
      })
      return
    }

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'File size must be less than 10MB'
      })
      return
    }

    setUploadedFiles(prev => ({ ...prev, [moduleId]: file }))
    setResults(prev => {
      const newResults = { ...prev }
      delete newResults[moduleId]
      return newResults
    })

    // If Excel file, analyze workbook structure
    if (['.xlsx', '.xls'].includes(fileExtension)) {
      await analyzeWorkbook(file, moduleId)
    } else {
      // CSV files have only one sheet
      setWorkbookInfo(prev => ({
        ...prev,
        [moduleId]: {
          fileName: file.name,
          sheetNames: ['Sheet1'],
          defaultSheet: 'Sheet1'
        }
      }))
      setSelectedSheets(prev => ({ ...prev, [moduleId]: 'Sheet1' }))
    }
  }

  // Analyze workbook to get sheet names
  const analyzeWorkbook = async (file: File, moduleId: string) => {
    setAnalyzing(prev => ({ ...prev, [moduleId]: true }))
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/upload/process-sheet', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Analysis-Only': 'true' // Signal to only analyze, not process
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.workbook) {
        const sheetNames = result.workbook.sheetNames || ['Sheet1']
        const defaultSheet = sheetNames[0]
        
        setWorkbookInfo(prev => ({
          ...prev,
          [moduleId]: {
            fileName: file.name,
            sheetNames,
            defaultSheet
          }
        }))
        
        setSelectedSheets(prev => ({ ...prev, [moduleId]: defaultSheet }))
      } else {
        // Fallback if analysis fails
        setWorkbookInfo(prev => ({
          ...prev,
          [moduleId]: {
            fileName: file.name,
            sheetNames: ['Sheet1'],
            defaultSheet: 'Sheet1'
          }
        }))
        setSelectedSheets(prev => ({ ...prev, [moduleId]: 'Sheet1' }))
      }
    } catch (error) {
      console.error('Error analyzing workbook:', error)
      // Fallback on error
      setWorkbookInfo(prev => ({
        ...prev,
        [moduleId]: {
          fileName: file.name,
          sheetNames: ['Sheet1'],
          defaultSheet: 'Sheet1'
        }
      }))
      setSelectedSheets(prev => ({ ...prev, [moduleId]: 'Sheet1' }))
    } finally {
      setAnalyzing(prev => ({ ...prev, [moduleId]: false }))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, activeModule),
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  })

  const handleUpload = async (moduleId: string) => {
    const file = uploadedFiles[moduleId]
    const selectedSheet = selectedSheets[moduleId]
    if (!file) return

    const module = modules.find(m => m.id === moduleId)!
    setUploading(prev => ({ ...prev, [moduleId]: true }))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sheetName', selectedSheet || 'Sheet1')
    formData.append('moduleType', moduleId)

    try {
      const response = await fetch(module.endpoint, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${module.title} data uploaded successfully!`, {
          description: `${result.data.recordsInserted} records inserted from ${result.data.fileName}`
        })
        
        if (result.data.errors.length > 0) {
          toast.warning('Some rows had errors', {
            description: `${result.data.skipped} rows skipped. Check results for details.`
          })
        }
        
        setResults(prev => ({ ...prev, [moduleId]: result.data }))
        setUploadedFiles(prev => {
          const newFiles = { ...prev }
          delete newFiles[moduleId]
          return newFiles
        })
        
        // Trigger refresh event
        window.dispatchEvent(new CustomEvent('data:uploaded', { 
          detail: { module: moduleId, data: result.data }
        }))
      } else {
        toast.error(result.error || 'Upload failed', {
          description: result.message || result.details?.[0]
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file', {
        description: 'Network or server error occurred'
      })
    } finally {
      setUploading(prev => ({ ...prev, [moduleId]: false }))
    }
  }

  const removeFile = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setUploadedFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[moduleId]
      return newFiles
    })
  }

  const clearResult = (moduleId: string) => {
    setResults(prev => {
      const newResults = { ...prev }
      delete newResults[moduleId]
      return newResults
    })
  }

  const currentFile = uploadedFiles[activeModule]
  const currentWorkbook = workbookInfo[activeModule]
  const currentSelectedSheet = selectedSheets[activeModule]
  const currentResult = results[activeModule]
  const isUploading = uploading[activeModule]
  const isAnalyzing = analyzing[activeModule]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          DMO Data Upload
        </CardTitle>
        <CardDescription>
          Upload Excel or CSV files for different DMO modules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeModule} onValueChange={setActiveModule}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {modules.map((module) => (
              <TabsTrigger 
                key={module.id} 
                value={module.id}
                className="flex items-center gap-2"
              >
                {module.icon}
                <span className="hidden sm:inline">{module.title}</span>
                {uploadedFiles[module.id] && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {modules.map((module) => (
            <TabsContent key={module.id} value={module.id} className="space-y-4">
              {/* Upload Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-1">{module.title}</h3>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : currentFile
                      ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {currentFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium text-sm">{currentFile.name}</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span>{(currentFile.size / 1024).toFixed(2)} KB</span>
                        <span>•</span>
                        <span>{new Date(currentFile.lastModified).toLocaleDateString()}</span>
                        {isAnalyzing && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 animate-pulse">Analyzing sheets...</span>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => removeFile(module.id, e)}
                        className="mt-2"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">
                        {isDragActive 
                          ? 'Drop the file here...'
                          : 'Drag & drop Excel/CSV file here, or click to browse'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: .xlsx, .xls, .csv (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Sheet Selection for Excel files */}
                {workbookInfo[module.id] && workbookInfo[module.id].sheetNames.length > 1 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sheet className="h-4 w-4" />
                      Select Sheet
                    </div>
                    <Select
                      value={selectedSheets[module.id] || workbookInfo[module.id].defaultSheet}
                      onValueChange={(value) => setSelectedSheets(prev => ({ ...prev, [module.id]: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a sheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {workbookInfo[module.id].sheetNames.map((sheetName: string) => (
                          <SelectItem key={sheetName} value={sheetName}>
                            {sheetName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {workbookInfo[module.id].sheetNames.length} sheets found in {workbookInfo[module.id].fileName}
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  onClick={() => handleUpload(module.id)}
                  disabled={!currentFile || isUploading}
                  className="w-full"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-pulse" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload to Database
                    </>
                  )}
                </Button>

                {/* Upload Result */}
                {currentResult && (
                  <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="ml-2">
                      <div className="space-y-1">
                        <p className="font-medium text-sm text-green-900 dark:text-green-100">
                          Upload Successful
                        </p>
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                          <p>• File: {currentResult.fileName}</p>
                          <p>• Records inserted: {currentResult.recordsInserted}</p>
                          <p>• Total rows: {currentResult.totalRows}</p>
                          {currentResult.skipped > 0 && (
                            <p className="text-yellow-700 dark:text-yellow-300">
                              • Skipped: {currentResult.skipped} rows
                            </p>
                          )}
                        </div>
                        {currentResult.errors.length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-yellow-700 dark:text-yellow-300 cursor-pointer">
                              View errors ({currentResult.errors.length})
                            </summary>
                            <ul className="mt-1 text-xs text-muted-foreground space-y-0.5 ml-4">
                              {currentResult.errors.map((error, idx) => (
                                <li key={idx}>• {error}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearResult(module.id)}
                          className="mt-2"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Column Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold text-xs mb-2 text-muted-foreground uppercase">
                      Required Columns
                    </h4>
                    <ul className="text-xs space-y-1">
                      {module.requiredColumns.map((col) => (
                        <li key={col} className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            {col}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-xs mb-2 text-muted-foreground uppercase">
                      Optional Columns
                    </h4>
                    <ul className="text-xs space-y-1">
                      {module.optionalColumns.map((col) => (
                        <li key={col} className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            {col}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
