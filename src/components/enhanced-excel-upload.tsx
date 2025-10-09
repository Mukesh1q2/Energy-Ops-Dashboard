"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  FileCheck,
  Table,
  Lightbulb,
  Eye,
  Download
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"

interface SheetData {
  name: string
  rowCount: number
  columnCount: number
  columns: string[]
  preview: any[]
  selected: boolean
  mapping: { [key: string]: string }
  validationErrors: string[]
  statistics: {
    totalRows: number
    validRows: number
    emptyRows: number
    numericColumns: number
    textColumns: number
    dateColumns: number
  }
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Suggested field mappings based on common patterns
const FIELD_SUGGESTIONS = {
  state: ['state', 'state_name', 'region', 'province', 'location'],
  capacity: ['capacity', 'installed_capacity', 'power', 'mw', 'capacity_mw'],
  generation: ['generation', 'output', 'generated', 'power_output'],
  technology: ['technology', 'tech_type', 'source', 'fuel', 'type'],
  date: ['date', 'timestamp', 'time', 'datetime', 'period'],
  price: ['price', 'cost', 'rate', 'tariff', 'rs_per_mwh'],
}

export function EnhancedExcelUpload({ onUploadComplete }: { onUploadComplete?: (data: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'mapping' | 'confirm'>('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setFile(file)
    setUploading(true)
    setUploadProgress(20)

    try {
      const data = await file.arrayBuffer()
      setUploadProgress(40)
      
      const workbook = XLSX.read(data, { type: 'array' })
      setUploadProgress(60)

      const sheetsData: SheetData[] = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]
        
        // Extract headers and data
        const headers = jsonData[0] || []
        const dataRows = jsonData.slice(1).filter(row => row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''))
        
        // Calculate statistics
        const statistics = calculateStatistics(headers, dataRows)
        
        // Generate preview (first 10 rows)
        const preview = dataRows.slice(0, 10).map((row: any) => {
          const obj: any = {}
          headers.forEach((header: string, index: number) => {
            obj[header] = row[index]
          })
          return obj
        })

        // Auto-suggest field mappings
        const mapping = suggestFieldMappings(headers)

        // Validate data
        const validationErrors = validateSheet(headers, dataRows)

        return {
          name: sheetName,
          rowCount: dataRows.length,
          columnCount: headers.length,
          columns: headers,
          preview,
          selected: true,
          mapping,
          validationErrors,
          statistics
        }
      })

      setSheets(sheetsData)
      setUploadProgress(100)
      setCurrentStep('preview')

      // Overall validation
      const allErrors = sheetsData.flatMap(s => s.validationErrors)
      setValidation({
        isValid: allErrors.length === 0,
        errors: allErrors.filter((_, i) => i < 5), // Show first 5 errors
        warnings: []
      })

    } catch (error) {
      console.error('Error parsing Excel file:', error)
      alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    multiple: false
  })

  const calculateStatistics = (headers: any[], rows: any[][]) => {
    const totalRows = rows.length
    const validRows = rows.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== '')).length
    const emptyRows = totalRows - validRows

    let numericColumns = 0
    let textColumns = 0
    let dateColumns = 0

    headers.forEach((_, colIndex) => {
      const sample = rows.slice(0, 100).map(row => row[colIndex]).filter(v => v !== null && v !== undefined)
      const numericCount = sample.filter(v => typeof v === 'number' || !isNaN(Number(v))).length
      const dateCount = sample.filter(v => v instanceof Date || isDateString(String(v))).length

      if (numericCount > sample.length * 0.7) numericColumns++
      else if (dateCount > sample.length * 0.5) dateColumns++
      else textColumns++
    })

    return {
      totalRows,
      validRows,
      emptyRows,
      numericColumns,
      textColumns,
      dateColumns
    }
  }

  const isDateString = (str: string): boolean => {
    return !isNaN(Date.parse(str))
  }

  const suggestFieldMappings = (columns: string[]): { [key: string]: string } => {
    const mapping: { [key: string]: string } = {}

    columns.forEach(col => {
      const colLower = col.toLowerCase().replace(/[_\s-]/g, '')
      
      for (const [field, patterns] of Object.entries(FIELD_SUGGESTIONS)) {
        if (patterns.some(pattern => colLower.includes(pattern.replace(/[_\s-]/g, '')))) {
          mapping[col] = field
          break
        }
      }
    })

    return mapping
  }

  const validateSheet = (headers: any[], rows: any[][]): string[] => {
    const errors: string[] = []

    if (headers.length === 0) {
      errors.push('No columns found in sheet')
    }

    if (rows.length === 0) {
      errors.push('No data rows found in sheet')
    }

    // Check for duplicate headers
    const duplicates = headers.filter((item, index) => headers.indexOf(item) !== index)
    if (duplicates.length > 0) {
      errors.push(`Duplicate column names found: ${duplicates.join(', ')}`)
    }

    // Check for empty headers
    const emptyHeaders = headers.filter(h => !h || h.toString().trim() === '')
    if (emptyHeaders.length > 0) {
      errors.push(`${emptyHeaders.length} column(s) have empty headers`)
    }

    return errors
  }

  const toggleSheetSelection = (sheetName: string) => {
    setSheets(sheets.map(s => 
      s.name === sheetName ? { ...s, selected: !s.selected } : s
    ))
  }

  const updateMapping = (sheetName: string, column: string, field: string) => {
    setSheets(sheets.map(s => 
      s.name === sheetName 
        ? { ...s, mapping: { ...s.mapping, [column]: field } }
        : s
    ))
  }

  const handleUpload = async () => {
    const selectedSheets = sheets.filter(s => s.selected)
    
    if (selectedSheets.length === 0) {
      alert('Please select at least one sheet to upload')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < selectedSheets.length; i++) {
        const sheet = selectedSheets[i]
        
        // Create FormData
        const formData = new FormData()
        formData.append('file', file!)
        formData.append('sheet_name', sheet.name)
        formData.append('mapping', JSON.stringify(sheet.mapping))

        // Upload to API
        const response = await fetch('/api/data-sources/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload sheet: ${sheet.name}`)
        }

        setUploadProgress(((i + 1) / selectedSheets.length) * 100)
      }

      // Success
      if (onUploadComplete) {
        onUploadComplete({ sheets: selectedSheets })
      }

      alert('Upload completed successfully!')
      
      // Reset
      setFile(null)
      setSheets([])
      setCurrentStep('upload')
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {['Upload', 'Preview', 'Mapping', 'Confirm'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep === step.toLowerCase() || 
              (index < ['upload', 'preview', 'mapping', 'confirm'].indexOf(currentStep))
                ? 'border-primary bg-primary text-white'
                : 'border-muted bg-background'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep === step.toLowerCase() ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {step}
            </span>
            {index < 3 && <div className="w-12 h-0.5 bg-muted mx-4" />}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Excel File
            </CardTitle>
            <CardDescription>
              Upload .xlsx, .xls, or .csv files with state-wise capacity data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg font-medium">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">Drag & drop your Excel file here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </Button>
                </>
              )}
            </div>

            {uploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Processing file...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* File Info */}
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-sm">Supported Features:</h4>
              <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Multiple sheet support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Automatic column mapping
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Data validation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Preview before upload
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {currentStep === 'preview' && sheets.length > 0 && (
        <div className="space-y-4">
          {/* Validation Summary */}
          {validation && (
            <Alert variant={validation.isValid ? "default" : "destructive"}>
              {validation.isValid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {validation.isValid ? 'File validated successfully' : 'Validation issues detected'}
              </AlertTitle>
              <AlertDescription>
                {validation.errors.length > 0 && (
                  <ul className="list-disc list-inside mt-2">
                    {validation.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Sheets Selection */}
          {sheets.map((sheet) => (
            <Card key={sheet.name} className={sheet.selected ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={sheet.selected}
                      onCheckedChange={() => toggleSheetSelection(sheet.name)}
                    />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        {sheet.name}
                      </CardTitle>
                      <CardDescription>
                        {sheet.rowCount} rows × {sheet.columnCount} columns
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {sheet.validationErrors.length === 0 ? (
                      <Badge variant="outline" className="bg-green-50">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        {sheet.validationErrors.length} Errors
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Statistics */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="text-xs text-muted-foreground">Total Rows</p>
                    <p className="text-lg font-bold">{sheet.statistics.totalRows}</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                    <p className="text-xs text-muted-foreground">Valid Rows</p>
                    <p className="text-lg font-bold">{sheet.statistics.validRows}</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                    <p className="text-xs text-muted-foreground">Empty Rows</p>
                    <p className="text-lg font-bold">{sheet.statistics.emptyRows}</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded">
                    <p className="text-xs text-muted-foreground">Numeric</p>
                    <p className="text-lg font-bold">{sheet.statistics.numericColumns}</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                    <p className="text-xs text-muted-foreground">Text</p>
                    <p className="text-lg font-bold">{sheet.statistics.textColumns}</p>
                  </div>
                  <div className="text-center p-2 bg-pink-50 dark:bg-pink-950 rounded">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-lg font-bold">{sheet.statistics.dateColumns}</p>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {sheet.columns.map((col, i) => (
                          <th key={i} className="px-4 py-2 text-left font-medium">
                            {col}
                            {sheet.mapping[col] && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                <Lightbulb className="w-3 h-3 mr-1" />
                                {sheet.mapping[col]}
                              </Badge>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.preview.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t hover:bg-muted/50">
                          {sheet.columns.map((col, j) => (
                            <td key={j} className="px-4 py-2">
                              {row[col]?.toString() || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Showing 5 of {sheet.rowCount} rows
                </p>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('upload')}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep('mapping')}>
              Next: Configure Mapping
            </Button>
          </div>
        </div>
      )}

      {/* Mapping Step */}
      {currentStep === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mapping</CardTitle>
            <CardDescription>
              Map your Excel columns to system fields (auto-suggested based on column names)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sheets.filter(s => s.selected).map((sheet) => (
              <div key={sheet.name} className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  {sheet.name}
                </h4>
                <div className="grid gap-3">
                  {sheet.columns.map((col) => (
                    <div key={col} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Badge variant="outline">{col}</Badge>
                      </div>
                      <div className="flex-1">
                        <Select
                          value={sheet.mapping[col] || 'none'}
                          onValueChange={(value) => updateMapping(sheet.name, col, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Don't import</SelectItem>
                            <SelectItem value="state">State</SelectItem>
                            <SelectItem value="capacity">Capacity (MW)</SelectItem>
                            <SelectItem value="generation">Generation</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="price">Price</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep('preview')}>
                Back
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading... {uploadProgress.toFixed(0)}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {sheets.filter(s => s.selected).length} Sheet(s)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
