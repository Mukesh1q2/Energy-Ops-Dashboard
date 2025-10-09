"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: DashboardSettings) => void
  currentSettings?: DashboardSettings
}

export interface DashboardSettings {
  autoRefresh: boolean
  refreshInterval: number // in seconds
  showGridLines: boolean
  chartTheme: 'light' | 'dark' | 'auto'
  defaultTimeRange: '1h' | '6h' | '12h' | '24h' | '7d' | '30d'
  enableNotifications: boolean
  enableSounds: boolean
  exportFormat: 'csv' | 'excel' | 'json'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  numberFormat: 'comma' | 'period' | 'indian'
}

const defaultSettings: DashboardSettings = {
  autoRefresh: true,
  refreshInterval: 300,
  showGridLines: true,
  chartTheme: 'auto',
  defaultTimeRange: '24h',
  enableNotifications: true,
  enableSounds: false,
  exportFormat: 'csv',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'comma'
}

export function DashboardSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentSettings = defaultSettings
}: DashboardSettingsModalProps) {
  const [settings, setSettings] = useState<DashboardSettings>(currentSettings)

  const handleSave = () => {
    onSave(settings)
    // Save to localStorage
    localStorage.setItem('dashboardSettings', JSON.stringify(settings))
    onClose()
  }

  const handleReset = () => {
    setSettings(defaultSettings)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Customize your dashboard experience and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Refresh Settings</CardTitle>
                <CardDescription>Control how often data is refreshed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-refresh">Auto Refresh</Label>
                  <Switch
                    id="auto-refresh"
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, autoRefresh: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Refresh Interval</Label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value) =>
                      setSettings({ ...settings, refreshInterval: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="refresh-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                      <SelectItem value="1800">30 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-range">Default Time Range</Label>
                  <Select
                    value={settings.defaultTimeRange}
                    onValueChange={(value: any) =>
                      setSettings({ ...settings, defaultTimeRange: value })
                    }
                  >
                    <SelectTrigger id="time-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last 1 hour</SelectItem>
                      <SelectItem value="6h">Last 6 hours</SelectItem>
                      <SelectItem value="12h">Last 12 hours</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <Switch
                    id="notifications"
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, enableNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sounds">Enable Sounds</Label>
                  <Switch
                    id="sounds"
                    checked={settings.enableSounds}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, enableSounds: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chart Display</CardTitle>
                <CardDescription>Customize chart appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid-lines">Show Grid Lines</Label>
                  <Switch
                    id="grid-lines"
                    checked={settings.showGridLines}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, showGridLines: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chart-theme">Chart Theme</Label>
                  <Select
                    value={settings.chartTheme}
                    onValueChange={(value: any) =>
                      setSettings({ ...settings, chartTheme: value })
                    }
                  >
                    <SelectTrigger id="chart-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Formatting</CardTitle>
                <CardDescription>Configure data display formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value: any) =>
                      setSettings({ ...settings, dateFormat: value })
                    }
                  >
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number-format">Number Format</Label>
                  <Select
                    value={settings.numberFormat}
                    onValueChange={(value: any) =>
                      setSettings({ ...settings, numberFormat: value })
                    }
                  >
                    <SelectTrigger id="number-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comma">Comma (1,234.56)</SelectItem>
                      <SelectItem value="period">Period (1.234,56)</SelectItem>
                      <SelectItem value="indian">Indian (1,23,456.78)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings</CardTitle>
                <CardDescription>Configure default export options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="export-format">Default Export Format</Label>
                  <Select
                    value={settings.exportFormat}
                    onValueChange={(value: any) =>
                      setSettings({ ...settings, exportFormat: value })
                    }
                  >
                    <SelectTrigger id="export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel (XLSX)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
