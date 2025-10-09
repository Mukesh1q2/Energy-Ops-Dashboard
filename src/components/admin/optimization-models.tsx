"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  FileCode,
  Upload,
  Trash2,
  Play,
  Search,
  RefreshCw,
  MoreVertical,
  Download,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OptimizationModel {
  id: string;
  name: string;
  type: 'DMO' | 'RMO' | 'SO';
  version: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  uploadedAt: string;
  lastRun?: string;
  runCount?: number;
}

export default function OptimizationModels() {
  const [models, setModels] = useState<OptimizationModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: '',
    type: 'DMO' as 'DMO' | 'RMO' | 'SO',
    version: '1.0.0',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/optimization-models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load optimization models',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadData.name);
      formData.append('type', uploadData.type);
      formData.append('version', uploadData.version);

      const response = await fetch('/api/admin/optimization-models/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload model');

      toast({
        title: 'Success',
        description: 'Model uploaded successfully',
      });

      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setUploadData({ name: '', type: 'DMO', version: '1.0.0' });
      fetchModels();
    } catch (error) {
      console.error('Error uploading model:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload model',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const response = await fetch(`/api/admin/optimization-models/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete model');

      toast({
        title: 'Success',
        description: 'Model deleted successfully',
      });

      fetchModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete model',
        variant: 'destructive',
      });
    }
  };

  const handleRunModel = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/admin/optimization-models/${id}/run`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to run model');

      toast({
        title: 'Success',
        description: `Model "${name}" is now running`,
      });

      fetchModels();
    } catch (error) {
      console.error('Error running model:', error);
      toast({
        title: 'Error',
        description: 'Failed to run model',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, any> = {
      DMO: 'default',
      RMO: 'secondary',
      SO: 'outline',
    };
    return <Badge variant={colors[type] || 'outline'}>{type}</Badge>;
  };

  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Optimization Models
              </CardTitle>
              <CardDescription>
                Manage Python optimization model files
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchModels} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Model
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Models Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Run Count</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : filteredModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No optimization models found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>{getTypeBadge(model.type)}</TableCell>
                      <TableCell>{model.version}</TableCell>
                      <TableCell>{getStatusBadge(model.status)}</TableCell>
                      <TableCell>{model.runCount || 0}</TableCell>
                      <TableCell>
                        {model.lastRun
                          ? new Date(model.lastRun).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRunModel(model.id, model.name)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Run Model
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(model.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Models</div>
              <div className="text-2xl font-bold">{models.length}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Active Models</div>
              <div className="text-2xl font-bold">
                {models.filter((m) => m.status === 'ACTIVE').length}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Runs</div>
              <div className="text-2xl font-bold">
                {models.reduce((acc, m) => acc + (m.runCount || 0), 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Optimization Model</DialogTitle>
            <DialogDescription>
              Upload a Python model file for optimization tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modelName">Model Name</Label>
              <Input
                id="modelName"
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                placeholder="e.g., Enhanced DMO Model"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelType">Model Type</Label>
              <select
                id="modelType"
                value={uploadData.type}
                onChange={(e) =>
                  setUploadData({ ...uploadData, type: e.target.value as 'DMO' | 'RMO' | 'SO' })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="DMO">DMO (Day-Ahead Market Optimization)</option>
                <option value="RMO">RMO (Real-Time Market Optimization)</option>
                <option value="SO">SO (Storage Optimization)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelVersion">Version</Label>
              <Input
                id="modelVersion"
                value={uploadData.version}
                onChange={(e) => setUploadData({ ...uploadData, version: e.target.value })}
                placeholder="e.g., 1.0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelFile">Model File (.py)</Label>
              <Input
                id="modelFile"
                type="file"
                accept=".py"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>Upload Model</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
