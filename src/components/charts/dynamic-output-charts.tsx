'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import TechnologyGenerationChart from './technology-generation-chart';

interface OutputFile {
  name: string;
  path: string;
  size: number;
  modified: Date | string;
  type: 'excel' | 'other';
}

interface DynamicOutputChartsProps {
  outputDir?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function DynamicOutputCharts({ 
  outputDir = '202504031402',
  autoRefresh = true,
  refreshInterval = 3000
}: DynamicOutputChartsProps) {
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Helper function to safely format timestamp
  const formatTimestamp = (timestamp: Date | string): string => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return 'Unknown';
    }
  };

  // Check for output files
  const checkOutputFiles = async () => {
    try {
      const response = await fetch(`/api/charts/output-files?outputDir=${outputDir}`);
      
      if (!response.ok) {
        throw new Error('Failed to check output files');
      }

      const data = await response.json();
      // Convert modified timestamps back to Date objects
      const filesWithDates = (data.files || []).map((file: any) => ({
        ...file,
        modified: new Date(file.modified)
      }));
      setOutputFiles(filesWithDates);
      setError(null);
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check output files');
      console.error('Error checking output files:', err);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    checkOutputFiles();

    if (autoRefresh) {
      const interval = setInterval(checkOutputFiles, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [outputDir, autoRefresh, refreshInterval]);

  const excelFiles = outputFiles.filter(file => file.type === 'excel');
  const hasResultsFile = excelFiles.some(file => file.name === 'results_long_df.xlsx');

  return (
    <div className="space-y-6">
      {/* Charts Section */}
      {hasResultsFile ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Interactive Generation Charts
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Charts are automatically generated from the DDART output files
            </p>
          </CardHeader>
          
          <CardContent>
            <TechnologyGenerationChart 
              outputDir={outputDir}
              autoRefresh={autoRefresh}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Chart Data Available</h3>
              <p className="text-gray-600 mb-4">
                Run the DDART model to generate results_long_df.xlsx and view interactive charts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
