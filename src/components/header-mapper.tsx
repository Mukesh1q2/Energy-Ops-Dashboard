"use client"
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface HeaderMapperProps {
  dataSourceId: string;
}

interface ColumnSchema {
  id: string;
  column_name: string;
  label: string;
  expose_as_filter: boolean;
  ui_filter_type: string;
}

export function HeaderMapper({ dataSourceId }: HeaderMapperProps) {
  const [schema, setSchema] = useState<ColumnSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchema() {
      const response = await fetch(`/api/data-sources/${dataSourceId}/schema`);
      if (response.ok) {
        const data = await response.json();
        setSchema(data.data.map((col: any) => ({
            ...col,
            label: col.label || col.column_name,
            ui_filter_type: col.ui_filter_type || 'text'
        })));
      }
      setLoading(false);
    }
    fetchSchema();
  }, [dataSourceId]);

  const handleMappingChange = (id: string, key: keyof ColumnSchema, value: any) => {
    setSchema(prev =>
      prev.map(col => (col.id === id ? { ...col, [key]: value } : col))
    );
  };

  const handleSaveChanges = async () => {
    await fetch(`/api/data-sources/${dataSourceId}/schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mappings: schema }),
    });
  };

  if (loading) {
    return <div>Loading schema...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Header Mapper</CardTitle>
        <CardDescription>Configure how your data columns are used in the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Name</TableHead>
              <TableHead>Display Label</TableHead>
              <TableHead>Expose as Filter</TableHead>
              <TableHead>Filter UI Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schema.map(col => (
              <TableRow key={col.id}>
                <TableCell>{col.column_name}</TableCell>
                <TableCell>
                  <Input
                    value={col.label}
                    onChange={(e) => handleMappingChange(col.id, 'label', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={col.expose_as_filter}
                    onCheckedChange={(checked) => handleMappingChange(col.id, 'expose_as_filter', checked)}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={col.ui_filter_type}
                    onValueChange={(value) => handleMappingChange(col.id, 'ui_filter_type', value)}
                    disabled={!col.expose_as_filter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="date_range">Date Range</SelectItem>
                      <SelectItem value="numeric_range">Numeric Range</SelectItem>
                      <SelectItem value="multi_select">Multi-Select</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button onClick={handleSaveChanges} className="mt-4">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}