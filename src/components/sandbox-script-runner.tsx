"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Upload, Play, Loader2, FileText, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface ScriptItem {
  id: string
  scriptName: string
  originalFilename: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  status: string
  description?: string
  totalRuns?: number
  lastRunAt?: string | null
}

export function SandboxScriptRunner() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [scripts, setScripts] = useState<ScriptItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchScripts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sandbox/scripts')
      const json = await res.json()
      if (json.success) {
        setScripts(json.data.scripts)
      }
    } catch (e) {
      console.error('Failed to load scripts', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScripts()
  }, [])

  const onUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/sandbox/test-scripts/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        toast.success('Script uploaded')
        setFile(null)
        fetchScripts()
      } else {
        toast.error(json.error || 'Upload failed')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setUploading(false)
    }
  }

  const runScript = async (id: string) => {
    setRunningId(id)
    try {
      const res = await fetch('/api/sandbox/test-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: id })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Script started')
      } else {
        toast.error(json.error || 'Failed to start script')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setRunningId(null)
      fetchScripts()
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Python Test Scripts
            </CardTitle>
            <CardDescription>Upload and run Python scripts with live logging</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchScripts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input type="file" accept=".py" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button onClick={onUpload} disabled={!file || uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </div>

        <div className="space-y-2">
          {scripts.length === 0 && (
            <p className="text-sm text-muted-foreground">No scripts uploaded yet.</p>
          )}
          {scripts.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{s.originalFilename}</span>
                  <Badge variant="secondary" className="text-xs">{Math.round(s.fileSize/1024)} KB</Badge>
                  {s.totalRuns ? (
                    <Badge variant="outline" className="text-xs">Runs: {s.totalRuns}</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">Uploaded: {new Date(s.uploadedAt).toLocaleString()}</p>
              </div>
              <div>
                <Button size="sm" onClick={() => runScript(s.id)} disabled={runningId === s.id}>
                  {runningId === s.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Run
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
