"use client"

import { SandboxEnhanced } from "@/components/sandbox-enhanced"
import { ModelUploadCard } from "@/components/optimization/model-upload-card"
import { OptimizationControlPanel } from "@/components/optimization/control-panel"
import { LogNotificationPanel } from "@/components/optimization/log-notification-panel"
import { UnifiedSandbox } from "@/components/sandbox/unified-sandbox"
import TechnologyGenerationChart from "@/components/charts/technology-generation-chart"
import DynamicOutputCharts from "@/components/charts/dynamic-output-charts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Rocket, TestTube, FlaskConical, BarChart3 } from "lucide-react"

export default function SandboxPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sandbox Environment</h1>
        <p className="text-muted-foreground">
          Test and run optimization models in an isolated environment
        </p>
      </div>

      <Tabs defaultValue="optimization" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="test-scripts" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Test Scripts
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="space-y-6 mt-6">
          {/* Upload and Control Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModelUploadCard />
            <OptimizationControlPanel />
          </div>

          {/* Live Logs Section */}
          <LogNotificationPanel />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6 mt-6">
          {/* Dynamic Output Charts */}
          <DynamicOutputCharts 
            outputDir="202504031402" 
            autoRefresh={false}
            refreshInterval={30000}
          />
        </TabsContent>

        <TabsContent value="test-scripts" className="space-y-6 mt-6">
          {/* Unified Sandbox Component */}
          <UnifiedSandbox />
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          <SandboxEnhanced />
        </TabsContent>
      </Tabs>
    </div>
  )
}
