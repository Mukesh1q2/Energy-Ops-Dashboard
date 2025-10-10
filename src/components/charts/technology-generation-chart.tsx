'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, RefreshCw } from 'lucide-react';

interface ChartData {
  timeBlocks: string[];
  series: {
    name: string;
    data: number[];
    color: string;
  }[];
}

interface Metadata {
  type: 'technology' | 'plant';
  technology: string;
  plant?: string;
  totalMW: number;
  recordCount: number;
  availablePlants?: string[];
  availableTechnologies?: string[];
}

interface TechnologyGenerationChartProps {
  outputDir?: string;
  autoRefresh?: boolean;
}

export default function TechnologyGenerationChart({ 
  outputDir = '202504031402',
  autoRefresh = true 
}: TechnologyGenerationChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechnology, setSelectedTechnology] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([]);
  const [availablePlants, setAvailablePlants] = useState<string[]>([]);
  const [showPlantSelector, setShowPlantSelector] = useState(false);

  // Load initial data
  useEffect(() => {
    loadAvailableTechnologies();
  }, [outputDir]);

  // Auto-refresh when technology is selected (disabled for now to prevent excessive refreshing)
  useEffect(() => {
    if (selectedTechnology) {
      loadChartData(selectedTechnology, selectedPlant);
    }
  }, [selectedTechnology, selectedPlant]);

  const loadChartData = async (technology?: string, plant?: string) => {
    setLoading(true);
    setError(null);

    try {
      const tech = technology || selectedTechnology;
      if (!tech) {
        // Load available technologies first
        await loadAvailableTechnologies();
        return;
      }

      const params = new URLSearchParams({
        technology: tech,
        outputDir
      });

      if (plant || selectedPlant) {
        params.append('plant', plant || selectedPlant);
      }

      const response = await fetch(`/api/charts/excel-data?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load chart data');
      }

      const data = await response.json();
      setChartData(data.chartData);
      setMetadata(data.metadata);

      // Update available plants for the selected technology
      if (data.metadata.availablePlants) {
        setAvailablePlants(data.metadata.availablePlants);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
      console.error('Error loading chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTechnologies = async () => {
    try {
      // Load available technologies
      const response = await fetch(`/api/charts/excel-data`);
      if (response.ok) {
        const data = await response.json();
        if (data.metadata.availableTechnologies) {
          setAvailableTechnologies(data.metadata.availableTechnologies);
        }
      }
    } catch (err) {
      console.error('Error loading available technologies:', err);
    }
  };

  const handleTechnologyChange = (technology: string) => {
    setSelectedTechnology(technology);
    setSelectedPlant('');
    setShowPlantSelector(false);
    loadChartData(technology);
  };

  const handlePlantChange = (plant: string) => {
    if (plant === 'all') {
      setSelectedPlant('');
      setShowPlantSelector(false);
      loadChartData(selectedTechnology);
    } else {
      setSelectedPlant(plant);
      setShowPlantSelector(true);
      loadChartData(selectedTechnology, plant);
    }
  };

  const togglePlantSelector = () => {
    if (!showPlantSelector) {
      setSelectedPlant('');
      loadChartData(selectedTechnology);
    }
    setShowPlantSelector(!showPlantSelector);
  };

  const downloadChart = () => {
    if (!chartData || !metadata) return;

    const csvData = chartData.timeBlocks.map((time, index) => ({
      TimeBlock: time,
      [metadata.type === 'technology' ? `${metadata.technology} Total` : metadata.plant || '']: 
        chartData.series[0].data[index]
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.technology}_${metadata.plant || 'total'}_generation.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Prepare data for Recharts
  const chartDataForRecharts = chartData?.timeBlocks.map((timeBlock, index) => ({
    timeBlock,
    value: chartData.series[0].data[index]
  })) || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Technology & Plant Generation Charts
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadChartData()}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            {chartData && (
              <Button variant="outline" size="sm" onClick={downloadChart}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Technology:</label>
            <Select value={selectedTechnology} onValueChange={handleTechnologyChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select technology" />
              </SelectTrigger>
              <SelectContent>
                {availableTechnologies.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTechnology && availablePlants.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Plant:</label>
              <Select value={selectedPlant || 'all'} onValueChange={handlePlantChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select plant (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants (Total)</SelectItem>
                  {availablePlants.map((plant) => (
                    <SelectItem key={plant} value={plant}>
                      {plant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {metadata && (
            <div className="flex gap-2">
              <Badge variant="outline">
                {metadata.type === 'technology' ? 'Technology Total' : 'Individual Plant'}
              </Badge>
              <Badge variant="secondary">
                Max: {metadata.totalMW.toFixed(1)} MW
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading chart data...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-2">Error loading chart data</p>
              <p className="text-sm text-gray-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadChartData()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {chartData && !loading && !error && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartDataForRecharts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timeBlock" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={7} // Show every 8th tick (every 2 hours)
                />
                <YAxis 
                  label={{ value: 'MW', angle: -90, position: 'insideLeft' }}
                  domain={[0, 'dataMax + 10']}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)} MW`, 
                    metadata?.type === 'technology' ? `${metadata.technology} Total` : metadata?.plant || name
                  ]}
                  labelFormatter={(timeBlock: string) => `Time: ${timeBlock}`}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name={metadata?.type === 'technology' ? `${metadata.technology} Total` : metadata?.plant || 'Generation'}
                  fill={chartData.series[0].color}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="text-sm text-gray-600">
              <p>
                <strong>Chart Type:</strong> {metadata?.type === 'technology' ? 'Technology Total' : 'Individual Plant'} |
                <strong> Data Points:</strong> {metadata?.recordCount} time blocks |
                <strong> Time Range:</strong> 00:00 - 23:45 (15-minute intervals)
              </p>
            </div>
          </div>
        )}

        {!chartData && !loading && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500">Select a technology to view generation chart</p>
              <p className="text-sm text-gray-400 mt-1">
                Chart will show generation data from the DDART model output
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
