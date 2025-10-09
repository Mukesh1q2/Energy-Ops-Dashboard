"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw, Settings2, Key, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
  };
  api: {
    rateLimitEnabled: boolean;
    maxRequestsPerMinute: number;
    apiTimeout: number;
  };
  storage: {
    maxUploadSize: number;
    allowedFileTypes: string;
    autoDeleteOldFiles: boolean;
    retentionDays: number;
  };
  optimization: {
    defaultModelTimeout: number;
    maxConcurrentJobs: number;
    autoRetryFailed: boolean;
  };
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'OptiBid Dashboard',
      siteDescription: 'Energy Operations Management System',
      maintenanceMode: false,
      allowRegistration: true,
    },
    api: {
      rateLimitEnabled: true,
      maxRequestsPerMinute: 60,
      apiTimeout: 30000,
    },
    storage: {
      maxUploadSize: 50,
      allowedFileTypes: '.xlsx,.xls,.csv,.json',
      autoDeleteOldFiles: false,
      retentionDays: 90,
    },
    optimization: {
      defaultModelTimeout: 300000,
      maxConcurrentJobs: 5,
      autoRetryFailed: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateGeneralSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      general: { ...settings.general, [key]: value },
    });
  };

  const updateApiSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      api: { ...settings.api, [key]: value },
    });
  };

  const updateStorageSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      storage: { ...settings.storage, [key]: value },
    });
  };

  const updateOptimizationSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      optimization: { ...settings.optimization, [key]: value },
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure global system parameters and preferences</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="api">API & Rate Limits</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateGeneralSetting('siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateGeneralSetting('siteDescription', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable access for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => updateGeneralSetting('maintenanceMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label>Allow User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable new user sign-ups
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.allowRegistration}
                    onCheckedChange={(checked) => updateGeneralSetting('allowRegistration', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label>Enable Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Protect API from abuse
                    </p>
                  </div>
                  <Switch
                    checked={settings.api.rateLimitEnabled}
                    onCheckedChange={(checked) => updateApiSetting('rateLimitEnabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRequests">Max Requests Per Minute</Label>
                  <Input
                    id="maxRequests"
                    type="number"
                    value={settings.api.maxRequestsPerMinute}
                    onChange={(e) => updateApiSetting('maxRequestsPerMinute', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiTimeout">API Timeout (milliseconds)</Label>
                  <Input
                    id="apiTimeout"
                    type="number"
                    value={settings.api.apiTimeout}
                    onChange={(e) => updateApiSetting('apiTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="storage" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                  <Input
                    id="maxUploadSize"
                    type="number"
                    value={settings.storage.maxUploadSize}
                    onChange={(e) => updateStorageSetting('maxUploadSize', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                  <Input
                    id="allowedFileTypes"
                    value={settings.storage.allowedFileTypes}
                    onChange={(e) => updateStorageSetting('allowedFileTypes', e.target.value)}
                    placeholder=".xlsx,.csv,.json"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label>Auto-Delete Old Files</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically remove old uploaded files
                    </p>
                  </div>
                  <Switch
                    checked={settings.storage.autoDeleteOldFiles}
                    onCheckedChange={(checked) => updateStorageSetting('autoDeleteOldFiles', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Retention Period (days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={settings.storage.retentionDays}
                    onChange={(e) => updateStorageSetting('retentionDays', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modelTimeout">Default Model Timeout (milliseconds)</Label>
                  <Input
                    id="modelTimeout"
                    type="number"
                    value={settings.optimization.defaultModelTimeout}
                    onChange={(e) => updateOptimizationSetting('defaultModelTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxJobs">Max Concurrent Jobs</Label>
                  <Input
                    id="maxJobs"
                    type="number"
                    value={settings.optimization.maxConcurrentJobs}
                    onChange={(e) => updateOptimizationSetting('maxConcurrentJobs', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label>Auto-Retry Failed Jobs</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically retry failed optimization jobs
                    </p>
                  </div>
                  <Switch
                    checked={settings.optimization.autoRetryFailed}
                    onCheckedChange={(checked) => updateOptimizationSetting('autoRetryFailed', checked)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
