"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Download,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  FileSpreadsheet,
  MoreVertical,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DataSource {
  id: string;
  name: string;
  type: 'EXCEL' | 'CSV' | 'JSON';
  size: number;
  rowCount?: number;
  columnCount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  uploadedAt: string;
  lastAccessed?: string;
  uploadedBy?: string;
}

export default function DataSourcesManagement() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/data-sources');
      if (!response.ok) throw new Error('Failed to fetch data sources');
      const data = await response.json();
      setDataSources(data.dataSources || []);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data sources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this data source? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/data-sources/${id}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete data source');

      toast({
        title: 'Success',
        description: 'Data source deleted successfully',
      });

      fetchDataSources();
    } catch (error) {
      console.error('Error deleting data source:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete data source',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/data-sources/${id}/download`);
      if (!response.ok) throw new Error('Failed to download file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'File downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async (dataSource: DataSource) => {
    try {
      setSelectedDataSource(dataSource);
      const response = await fetch(`/api/data-sources/${dataSource.id}/preview`);
      if (!response.ok) throw new Error('Failed to fetch preview');
      
      const data = await response.json();
      setPreviewData(data.preview || []);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to load preview',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

  const getFileIcon = (type: string) => {
    return <FileSpreadsheet className="h-4 w-4" />;
  };

  const filteredDataSources = dataSources.filter(
    (ds) =>
      ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ds.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Sources Management
              </CardTitle>
              <CardDescription>
                View and manage uploaded data files
              </CardDescription>
            </div>
            <Button onClick={fetchDataSources} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Data Sources Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Rows/Cols</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
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
                ) : filteredDataSources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No data sources found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDataSources.map((ds) => (
                    <TableRow key={ds.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getFileIcon(ds.type)}
                          {ds.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ds.type}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(ds.size)}</TableCell>
                      <TableCell>
                        {ds.rowCount && ds.columnCount
                          ? `${ds.rowCount} × ${ds.columnCount}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(ds.status)}</TableCell>
                      <TableCell>
                        {new Date(ds.uploadedAt).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => handlePreview(ds)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(ds.id, ds.name)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(ds.id)}
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
              <div className="text-sm text-muted-foreground">Total Files</div>
              <div className="text-2xl font-bold">{dataSources.length}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Size</div>
              <div className="text-2xl font-bold">
                {formatFileSize(dataSources.reduce((acc, ds) => acc + ds.size, 0))}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Active Sources</div>
              <div className="text-2xl font-bold">
                {dataSources.filter((ds) => ds.status === 'ACTIVE').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Data Preview: {selectedDataSource?.name}</DialogTitle>
            <DialogDescription>
              Showing first {previewData.length} rows
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            {previewData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0]).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.values(row).map((value: any, cellIdx) => (
                        <TableCell key={cellIdx}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No preview data available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
