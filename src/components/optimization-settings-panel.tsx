"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Save, 
  RotateCcw, 
  TrendingUp, 
  Zap, 
  Battery,
  DollarSign,
  Clock,
  Target,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"

interface OptimizationConfig {
  dmo: {
    price_ceiling: number
    price_floor: number
    volume_min: number
    volume_max: number
    time_window_start: string
    time_window_end: string
    convergence_threshold: number
    max_iterations: number
    enable_constraints: boolean
    penalty_factor: number
  }
  rmo: {
    price_ceiling: number
    price_floor: number
    response_time_ms: number
    update_interval_sec: number
    volume_step: number
    enable_real_time_pricing: boolean
    deviation_tolerance: number
    emergency_reserve: number
  }
  so: {
    charge_rate_max: number
    discharge_rate_max: number
    soc_min: number
    soc_max: number
    cycle_limit_per_day: number
    efficiency: number
    degradation_factor: number
    enable_peak_shaving: boolean
  }
}

const DEFAULT_CONFIG: OptimizationConfig = {
  dmo: {
    price_ceiling: 12000,
    price_floor: 2000,
    volume_min: 100,
    volume_max: 5000,
    time_window_start: "00:00",
    time_window_end: "23:59",
    convergence_threshold: 0.001,
    max_iterations: 1000,
    enable_constraints: true,
    penalty_factor: 1.5
  },
  rmo: {
    price_ceiling: 15000,
    price_floor: 1500,
    response_time_ms: 500,
    update_interval_sec: 1800,
    volume_step: 50,
    enable_real_time_pricing: true,
    deviation_tolerance: 5,
    emergency_reserve: 200
  },
  so: {
    charge_rate_max: 100,
    discharge_rate_max: 100,
    soc_min: 20,
    soc_max: 90,
    cycle_limit_per_day: 2,
    efficiency: 95,
    degradation_factor: 0.05,
    enable_peak_shaving: true
  }
}

export function OptimizationSettingsPanel() {
  const [config, setConfig] = useState<OptimizationConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const updateDMOConfig = (key: keyof OptimizationConfig['dmo'], value: any) => {
    setConfig(prev => ({
      ...prev,
      dmo: { ...prev.dmo, [key]: value }
    }))
    setHasChanges(true)
  }

  const updateRMOConfig = (key: keyof OptimizationConfig['rmo'], value: any) => {
    setConfig(prev => ({
      ...prev,
      rmo: { ...prev.rmo, [key]: value }
    }))
    setHasChanges(true)
  }

  const updateSOConfig = (key: keyof OptimizationConfig['so'], value: any) => {
    setConfig(prev => ({
      ...prev,
      so: { ...prev.so, [key]: value }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/optimization/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast.success('Configuration saved successfully')
        setHasChanges(false)
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
    setHasChanges(false)
    toast.info('Configuration reset to defaults')
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Optimization Configuration
            </CardTitle>
            <CardDescription>
              Advanced settings for DMO, RMO, and SO optimization models
            </CardDescription>
          </div>
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dmo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dmo" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              DMO
            </TabsTrigger>
            <TabsTrigger value="rmo" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              RMO
            </TabsTrigger>
            <TabsTrigger value="so" className="flex items-center gap-2">
              <Battery className="w-4 h-4" />
              SO
            </TabsTrigger>
          </TabsList>

          {/* DMO Configuration */}
          <TabsContent value="dmo" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price Limits
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price Ceiling (₹/MWh)</Label>
                  <Input
                    type="number"
                    value={config.dmo.price_ceiling}
                    onChange={(e) => updateDMOConfig('price_ceiling', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price Floor (₹/MWh)</Label>
                  <Input
                    type="number"
                    value={config.dmo.price_floor}
                    onChange={(e) => updateDMOConfig('price_floor', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                Volume Constraints
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Volume (MW)</Label>
                  <Input
                    type="number"
                    value={config.dmo.volume_min}
                    onChange={(e) => updateDMOConfig('volume_min', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Volume (MW)</Label>
                  <Input
                    type="number"
                    value={config.dmo.volume_max}
                    onChange={(e) => updateDMOConfig('volume_max', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Window
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={config.dmo.time_window_start}
                    onChange={(e) => updateDMOConfig('time_window_start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={config.dmo.time_window_end}
                    onChange={(e) => updateDMOConfig('time_window_end', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold">Algorithm Parameters</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Convergence Threshold: {config.dmo.convergence_threshold}</Label>
                  <Slider
                    value={[config.dmo.convergence_threshold * 1000]}
                    onValueChange={([value]) => updateDMOConfig('convergence_threshold', value / 1000)}
                    min={0.1}
                    max={10}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">Lower values = higher precision</p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Iterations</Label>
                  <Input
                    type="number"
                    value={config.dmo.max_iterations}
                    onChange={(e) => updateDMOConfig('max_iterations', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Penalty Factor: {config.dmo.penalty_factor.toFixed(1)}x</Label>
                  <Slider
                    value={[config.dmo.penalty_factor * 10]}
                    onValueChange={([value]) => updateDMOConfig('penalty_factor', value / 10)}
                    min={10}
                    max={30}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">Penalty multiplier for constraint violations</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Constraints</Label>
                    <p className="text-sm text-muted-foreground">Apply volume and price limits</p>
                  </div>
                  <Switch
                    checked={config.dmo.enable_constraints}
                    onCheckedChange={(checked) => updateDMOConfig('enable_constraints', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* RMO Configuration */}
          <TabsContent value="rmo" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price Limits
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price Ceiling (₹/MWh)</Label>
                  <Input
                    type="number"
                    value={config.rmo.price_ceiling}
                    onChange={(e) => updateRMOConfig('price_ceiling', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price Floor (₹/MWh)</Label>
                  <Input
                    type="number"
                    value={config.rmo.price_floor}
                    onChange={(e) => updateRMOConfig('price_floor', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold">Real-Time Parameters</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Response Time (ms)</Label>
                  <Input
                    type="number"
                    value={config.rmo.response_time_ms}
                    onChange={(e) => updateRMOConfig('response_time_ms', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Target response time for updates</p>
                </div>
                <div className="space-y-2">
                  <Label>Update Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={config.rmo.update_interval_sec}
                    onChange={(e) => updateRMOConfig('update_interval_sec', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">30 min = 1800 sec</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Volume Step Size (MW)</Label>
                <Input
                  type="number"
                  value={config.rmo.volume_step}
                  onChange={(e) => updateRMOConfig('volume_step', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Minimum adjustment increment</p>
              </div>

              <div className="space-y-2">
                <Label>Deviation Tolerance: {config.rmo.deviation_tolerance}%</Label>
                <Slider
                  value={[config.rmo.deviation_tolerance]}
                  onValueChange={([value]) => updateRMOConfig('deviation_tolerance', value)}
                  min={1}
                  max={20}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">Acceptable forecast deviation</p>
              </div>

              <div className="space-y-2">
                <Label>Emergency Reserve (MW)</Label>
                <Input
                  type="number"
                  value={config.rmo.emergency_reserve}
                  onChange={(e) => updateRMOConfig('emergency_reserve', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Reserved capacity for emergencies</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Real-Time Pricing</Label>
                  <p className="text-sm text-muted-foreground">Adjust prices based on market conditions</p>
                </div>
                <Switch
                  checked={config.rmo.enable_real_time_pricing}
                  onCheckedChange={(checked) => updateRMOConfig('enable_real_time_pricing', checked)}
                />
              </div>
            </div>
          </TabsContent>

          {/* SO Configuration */}
          <TabsContent value="so" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Charge/Discharge Rates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Charge Rate (MW)</Label>
                  <Input
                    type="number"
                    value={config.so.charge_rate_max}
                    onChange={(e) => updateSOConfig('charge_rate_max', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Discharge Rate (MW)</Label>
                  <Input
                    type="number"
                    value={config.so.discharge_rate_max}
                    onChange={(e) => updateSOConfig('discharge_rate_max', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold">State of Charge (SoC) Limits</h4>
              <div className="space-y-2">
                <Label>SoC Range: {config.so.soc_min}% - {config.so.soc_max}%</Label>
                <div className="pt-2">
                  <Slider
                    value={[config.so.soc_min, config.so.soc_max]}
                    onValueChange={([min, max]) => {
                      updateSOConfig('soc_min', min)
                      updateSOConfig('soc_max', max)
                    }}
                    min={0}
                    max={100}
                    step={5}
                    minStepsBetweenThumbs={2}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Operating range for battery SoC</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold">Battery Performance</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Round-Trip Efficiency: {config.so.efficiency}%</Label>
                  <Slider
                    value={[config.so.efficiency]}
                    onValueChange={([value]) => updateSOConfig('efficiency', value)}
                    min={80}
                    max={98}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cycle Limit per Day</Label>
                  <Input
                    type="number"
                    value={config.so.cycle_limit_per_day}
                    onChange={(e) => updateSOConfig('cycle_limit_per_day', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum charge/discharge cycles</p>
                </div>

                <div className="space-y-2">
                  <Label>Degradation Factor: {config.so.degradation_factor}% per cycle</Label>
                  <Slider
                    value={[config.so.degradation_factor * 100]}
                    onValueChange={([value]) => updateSOConfig('degradation_factor', value / 100)}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Peak Shaving</Label>
                    <p className="text-sm text-muted-foreground">Discharge during peak demand</p>
                  </div>
                  <Switch
                    checked={config.so.enable_peak_shaving}
                    onCheckedChange={(checked) => updateSOConfig('enable_peak_shaving', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
