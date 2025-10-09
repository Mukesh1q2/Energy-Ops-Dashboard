"use client"
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, LineChart, PieChart, ScatterChart } from "lucide-react";

interface OneClickPlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataSourceId: string;
}

interface ChartSuggestion {
  chart_type: string;
  label: string;
  confidence: number;
  chart_config: any;
}

export function OneClickPlotModal({ isOpen, onClose, dataSourceId }: OneClickPlotModalProps) {
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!dataSourceId) return;
      setLoading(true);
      const response = await fetch('/api/autoplot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_source_id: dataSourceId }),
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data);
      }
      setLoading(false);
    }
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen, dataSourceId]);

  const handleSelectSuggestion = (label: string) => {
    setSelectedSuggestions(prev =>
      prev.includes(label)
        ? prev.filter(s => s !== label)
        : [...prev, label]
    );
  };

  const handleAddCharts = async () => {
    try {
      // Get selected chart configurations
      const selectedCharts = suggestions.filter(s => 
        selectedSuggestions.includes(s.label)
      );

      // Save each chart to dashboard
      const savePromises = selectedCharts.map(async (chart) => {
        const response = await fetch('/api/dashboard/charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dashboard_id: 'default',
            data_source_id: dataSourceId,
            name: chart.label,
            chart_config: chart.chart_config,
            created_by: 'system'
          })
        });
        return response.json();
      });

      await Promise.all(savePromises);
      
      alert(`Successfully added ${selectedCharts.length} chart(s) to dashboard!`);
      onClose();
    } catch (error) {
      console.error('Error adding charts:', error);
      alert('Failed to add charts. Please try again.');
    }
  };

  const getChartIcon = (type: string) => {
      switch (type) {
          case 'line': return <LineChart className="h-8 w-8 text-muted-foreground" />;
          case 'bar': return <BarChart className="h-8 w-8 text-muted-foreground" />;
          case 'pie': return <PieChart className="h-8 w-8 text-muted-foreground" />;
          case 'scatter': return <ScatterChart className="h-8 w-8 text-muted-foreground" />;
          default: return <BarChart className="h-8 w-8 text-muted-foreground" />;
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>🪄 One-Click Plot</DialogTitle>
          <DialogDescription>
            AI-generated chart suggestions based on your data structure. Select charts to add to your dashboard.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-destructive font-medium">⚠️ {error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Analyzing your data...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {suggestions.length} chart suggestion{suggestions.length !== 1 ? 's' : ''} found
              </p>
              {selectedSuggestions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedSuggestions.length === suggestions.length) {
                      setSelectedSuggestions([]);
                    } else {
                      setSelectedSuggestions(suggestions.map(s => s.label));
                    }
                  }}
                >
                  {selectedSuggestions.length === suggestions.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {suggestions.map(suggestion => (
                <Card 
                  key={suggestion.label} 
                  className={`flex flex-col cursor-pointer transition-all hover:shadow-md ${
                    selectedSuggestions.includes(suggestion.label) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : ''
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion.label)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm leading-tight pr-2">{suggestion.label}</CardTitle>
                      <Checkbox
                        checked={selectedSuggestions.includes(suggestion.label)}
                        onCheckedChange={() => handleSelectSuggestion(suggestion.label)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col items-center justify-center">
                    {getChartIcon(suggestion.chart_type)}
                    <p className="text-xs text-muted-foreground mt-2">
                      Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {suggestion.chart_type} chart
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium mb-2">No chart suggestions available</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Make sure your data source has properly mapped columns with appropriate data types.
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedSuggestions.length > 0 && (
              <span>{selectedSuggestions.length} selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCharts} 
              disabled={selectedSuggestions.length === 0 || saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                `Add ${selectedSuggestions.length} Chart${selectedSuggestions.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}