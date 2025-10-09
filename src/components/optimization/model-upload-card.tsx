"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileCode, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function ModelUploadCard() {
  const [modelType, setModelType] = useState<'DMO' | 'RMO' | 'SO'>('DMO')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith('.py')) {
      toast.error('Only Python (.py) files are allowed')
      return
    }

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
    formData.append('modelType', modelType)
    formData.append('description', description)

    try {
      const response = await fetch('/api/optimization/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${modelType} model uploaded successfully!`, {
          description: `File: ${uploadedFile.name}`
        })
        setUploadedFile(null)
        setDescription('')
        
        // Trigger a refresh event
        window.dispatchEvent(new Event('model-uploaded'))
      } else {
        toast.error(result.error || 'Upload failed', {
          description: result.details || result.message
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload model', {
        description: 'Network or server error occurred'
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Optimization Model
        </CardTitle>
        <CardDescription>
          Upload Python (.py) files for DMO, RMO, or SO optimization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Model Type</label>
          <Select value={modelType} onValueChange={(v: any) => setModelType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DMO">
                <div className="flex flex-col items-start">
                  <span className="font-medium">DMO</span>
                  <span className="text-xs text-muted-foreground">Day Ahead Market Optimization</span>
                </div>
              </SelectItem>
              <SelectItem value="RMO">
                <div className="flex flex-col items-start">
                  <span className="font-medium">RMO</span>
                  <span className="text-xs text-muted-foreground">Real Time Market Optimization</span>
                </div>
              </SelectItem>
              <SelectItem value="SO">
                <div className="flex flex-col items-start">
                  <span className="font-medium">SO</span>
                  <span className="text-xs text-muted-foreground">System Optimization</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                <Badge variant="outline">{modelType}</Badge>
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
                  : 'Drag & drop Python file here, or click to browse'
                }
              </p>
              <p className="text-xs text-muted-foreground">Only .py files, max 10MB</p>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this model does..."
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
              Upload Model
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
