"use client"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DynamicFilterPanelProps {
  dataSourceId: string;
  onFilterChange: (filters: any) => void;
}

interface FilterConfig {
  id: string;
  column_name: string;
  label: string;
  ui_filter_type: string;
}

export function DynamicFilterPanel({ dataSourceId, onFilterChange }: DynamicFilterPanelProps) {
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchFilters() {
      if (!dataSourceId) return;
      const response = await fetch(`/api/data-sources/${dataSourceId}/schema`);
      if (response.ok) {
        const data = await response.json();
        setFilters(data.data.filter((col: any) => col.expose_as_filter));
      }
    }
    fetchFilters();
  }, [dataSourceId]);

  const handleValueChange = (key: string, value: any) => {
    const newValues = { ...filterValues, [key]: value };
    setFilterValues(newValues);
    onFilterChange(newValues);
  };

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.ui_filter_type) {
      case 'text':
        return (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id}>{filter.label}</Label>
            <Input
              id={filter.id}
              onChange={(e) => handleValueChange(filter.normalized_name, e.target.value)}
            />
          </div>
        );
      case 'multi_select':
        return (
            <div key={filter.id} className="space-y-2">
                <Label htmlFor={filter.id}>{filter.label}</Label>
                <Select onValueChange={(value) => handleValueChange(filter.normalized_name, value)}>
                    <SelectTrigger id={filter.id}>
                        <SelectValue placeholder={`Select ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Sample values would be loaded here */}
                        <SelectItem value="sample1">Sample 1</SelectItem>
                        <SelectItem value="sample2">Sample 2</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        );
      // Add cases for date_range and numeric_range
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filters.map(renderFilter)}
        <Button onClick={() => onFilterChange(filterValues)}>Apply Filters</Button>
      </CardContent>
    </Card>
  );
}