"use client"

import { ResponsiveSankey } from '@nivo/sankey'
import { ResponsiveTreeMap } from '@nivo/treemap'
import { ResponsiveHeatMap } from '@nivo/heatmap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, BarChart3, Grid3x3 } from 'lucide-react'

// Sankey Chart - Energy Flow Visualization
interface SankeyData {
  nodes: { id: string; nodeColor?: string }[]
  links: { source: string; target: string; value: number }[]
}

const ENERGY_FLOW_DATA: SankeyData = {
  nodes: [
    { id: 'Coal', nodeColor: '#64748b' },
    { id: 'Hydro', nodeColor: '#3b82f6' },
    { id: 'Nuclear', nodeColor: '#f59e0b' },
    { id: 'Solar', nodeColor: '#eab308' },
    { id: 'Wind', nodeColor: '#10b981' },
    { id: 'Generation', nodeColor: '#8b5cf6' },
    { id: 'Transmission', nodeColor: '#ec4899' },
    { id: 'Industrial', nodeColor: '#06b6d4' },
    { id: 'Residential', nodeColor: '#14b8a6' },
    { id: 'Commercial', nodeColor: '#f43f5e' },
    { id: 'Losses', nodeColor: '#ef4444' }
  ],
  links: [
    { source: 'Coal', target: 'Generation', value: 180000 },
    { source: 'Hydro', target: 'Generation', value: 45000 },
    { source: 'Nuclear', target: 'Generation', value: 6780 },
    { source: 'Solar', target: 'Generation', value: 58000 },
    { source: 'Wind', target: 'Generation', value: 40000 },
    { source: 'Generation', target: 'Transmission', value: 329780 },
    { source: 'Transmission', target: 'Industrial', value: 160000 },
    { source: 'Transmission', target: 'Residential', value: 110000 },
    { source: 'Transmission', target: 'Commercial', value: 40000 },
    { source: 'Transmission', target: 'Losses', value: 19780 }
  ]
}

export function EnergySankeyChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Energy Flow Diagram
        </CardTitle>
        <CardDescription>
          Power generation, transmission, and consumption flow (MW)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveSankey
            data={ENERGY_FLOW_DATA}
            margin={{ top: 20, right: 160, bottom: 20, left: 20 }}
            align="justify"
            colors={{ scheme: 'category10' }}
            nodeOpacity={1}
            nodeHoverOthersOpacity={0.35}
            nodeThickness={18}
            nodeSpacing={24}
            nodeBorderWidth={0}
            nodeBorderRadius={3}
            linkOpacity={0.5}
            linkHoverOthersOpacity={0.1}
            linkContract={3}
            enableLinkGradient={true}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={16}
            labelTextColor={{
              from: 'color',
              modifiers: [['darker', 1]]
            }}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                translateX: 130,
                itemWidth: 100,
                itemHeight: 14,
                itemDirection: 'right-to-left',
                itemsSpacing: 2,
                itemTextColor: '#999',
                symbolSize: 14,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
              }
            ]}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// TreeMap Chart - Capacity Distribution
interface TreeMapData {
  name: string
  color?: string
  children?: TreeMapData[]
  loc?: number
}

const CAPACITY_DATA: TreeMapData = {
  name: 'India Power Capacity',
  color: '#3b82f6',
  children: [
    {
      name: 'Thermal',
      color: '#64748b',
      children: [
        { name: 'Coal', color: '#475569', loc: 210000 },
        { name: 'Gas', color: '#64748b', loc: 24900 },
        { name: 'Diesel', color: '#94a3b8', loc: 510 }
      ]
    },
    {
      name: 'Renewable',
      color: '#10b981',
      children: [
        { name: 'Solar', color: '#eab308', loc: 58000 },
        { name: 'Wind', color: '#10b981', loc: 40000 },
        { name: 'Biomass', color: '#84cc16', loc: 10170 }
      ]
    },
    {
      name: 'Hydro',
      color: '#3b82f6',
      children: [
        { name: 'Large Hydro', color: '#2563eb', loc: 46510 },
        { name: 'Small Hydro', color: '#60a5fa', loc: 4800 }
      ]
    },
    {
      name: 'Nuclear',
      color: '#f59e0b',
      loc: 6780
    }
  ]
}

export function CapacityTreeMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5" />
          Power Capacity Distribution
        </CardTitle>
        <CardDescription>
          Hierarchical view of installed capacity by technology type (MW)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveTreeMap
            data={CAPACITY_DATA}
            identity="name"
            value="loc"
            valueFormat=".02s"
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            labelSkipSize={12}
            labelTextColor={{
              from: 'color',
              modifiers: [['darker', 1.2]]
            }}
            parentLabelPosition="left"
            parentLabelTextColor={{
              from: 'color',
              modifiers: [['darker', 2]]
            }}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 0.1]]
            }}
            colors={{ scheme: 'nivo' }}
            animate={true}
            motionConfig="gentle"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// HeatMap Chart - Temporal Patterns
const DEMAND_HEATMAP_DATA = [
  {
    id: 'Monday',
    data: [
      { x: '00:00', y: 65 },
      { x: '04:00', y: 58 },
      { x: '08:00', y: 85 },
      { x: '12:00', y: 95 },
      { x: '16:00', y: 92 },
      { x: '20:00', y: 88 },
      { x: '23:00', y: 72 }
    ]
  },
  {
    id: 'Tuesday',
    data: [
      { x: '00:00', y: 63 },
      { x: '04:00', y: 56 },
      { x: '08:00', y: 87 },
      { x: '12:00', y: 97 },
      { x: '16:00', y: 94 },
      { x: '20:00', y: 90 },
      { x: '23:00', y: 74 }
    ]
  },
  {
    id: 'Wednesday',
    data: [
      { x: '00:00', y: 64 },
      { x: '04:00', y: 57 },
      { x: '08:00', y: 86 },
      { x: '12:00', y: 96 },
      { x: '16:00', y: 93 },
      { x: '20:00', y: 89 },
      { x: '23:00', y: 73 }
    ]
  },
  {
    id: 'Thursday',
    data: [
      { x: '00:00', y: 66 },
      { x: '04:00', y: 59 },
      { x: '08:00', y: 88 },
      { x: '12:00', y: 98 },
      { x: '16:00', y: 95 },
      { x: '20:00', y: 91 },
      { x: '23:00', y: 75 }
    ]
  },
  {
    id: 'Friday',
    data: [
      { x: '00:00', y: 67 },
      { x: '04:00', y: 60 },
      { x: '08:00', y: 89 },
      { x: '12:00', y: 99 },
      { x: '16:00', y: 96 },
      { x: '20:00', y: 92 },
      { x: '23:00', y: 80 }
    ]
  },
  {
    id: 'Saturday',
    data: [
      { x: '00:00', y: 70 },
      { x: '04:00', y: 62 },
      { x: '08:00', y: 82 },
      { x: '12:00', y: 88 },
      { x: '16:00', y: 90 },
      { x: '20:00', y: 93 },
      { x: '23:00', y: 85 }
    ]
  },
  {
    id: 'Sunday',
    data: [
      { x: '00:00', y: 68 },
      { x: '04:00', y: 61 },
      { x: '08:00', y: 75 },
      { x: '12:00', y: 82 },
      { x: '16:00', y: 85 },
      { x: '20:00', y: 87 },
      { x: '23:00', y: 78 }
    ]
  }
]

export function DemandHeatMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Weekly Demand Pattern
        </CardTitle>
        <CardDescription>
          Heat map showing demand intensity by day and time (% of peak)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveHeatMap
            data={DEMAND_HEATMAP_DATA}
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            valueFormat=">-.0f"
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: '',
              legendOffset: 46
            }}
            axisRight={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Day of Week',
              legendPosition: 'middle',
              legendOffset: 70
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Day of Week',
              legendPosition: 'middle',
              legendOffset: -72
            }}
            colors={{
              type: 'diverging',
              scheme: 'red_yellow_green',
              divergeAt: 0.5,
              minValue: 50,
              maxValue: 100
            }}
            emptyColor="#555555"
            legends={[
              {
                anchor: 'bottom',
                translateX: 0,
                translateY: 30,
                length: 400,
                thickness: 8,
                direction: 'row',
                tickPosition: 'after',
                tickSize: 3,
                tickSpacing: 4,
                tickOverlap: false,
                tickFormat: '>-.0s',
                title: 'Demand % →',
                titleAlign: 'start',
                titleOffset: 4
              }
            ]}
            animate={true}
            motionConfig="gentle"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Combined export for all advanced charts
export function AdvancedChartsShowcase() {
  return (
    <div className="space-y-6">
      <EnergySankeyChart />
      <CapacityTreeMap />
      <DemandHeatMap />
    </div>
  )
}
