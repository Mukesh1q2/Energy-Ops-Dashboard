"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Layers, MapPin, Zap, TrendingUp } from 'lucide-react'

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

interface PowerPlant {
  id: string
  name: string
  position: [number, number]
  capacity: number
  type: 'coal' | 'hydro' | 'nuclear' | 'solar' | 'wind'
  status: 'active' | 'maintenance' | 'offline'
}

interface TransmissionLine {
  id: string
  from: [number, number]
  to: [number, number]
  capacity: number
  utilization: number // 0-100%
  status: 'normal' | 'congested' | 'critical'
}

const MOCK_PLANTS: PowerPlant[] = [
  { id: '1', name: 'NTPC Dadri', position: [28.5507, 77.5546], capacity: 1820, type: 'coal', status: 'active' },
  { id: '2', name: 'Tehri Hydro', position: [30.3777, 78.4809], capacity: 2400, type: 'hydro', status: 'active' },
  { id: '3', name: 'Kudankulam Nuclear', position: [8.1783, 77.7066], capacity: 2000, type: 'nuclear', status: 'active' },
  { id: '4', name: 'Bhadla Solar Park', position: [27.5114, 71.1989], capacity: 2245, type: 'solar', status: 'active' },
  { id: '5', name: 'Jaisalmer Wind Park', position: [26.9157, 70.9083], capacity: 1064, type: 'wind', status: 'active' },
  { id: '6', name: 'Mundra Thermal', position: [22.8395, 69.7221], capacity: 4620, type: 'coal', status: 'active' },
  { id: '7', name: 'Tarapur Nuclear', position: [19.8342, 72.6681], capacity: 1400, type: 'nuclear', status: 'maintenance' }
]

const MOCK_TRANSMISSION: TransmissionLine[] = [
  { id: 't1', from: [28.5507, 77.5546], to: [30.3777, 78.4809], capacity: 2000, utilization: 75, status: 'normal' },
  { id: 't2', from: [28.5507, 77.5546], to: [27.5114, 71.1989], capacity: 1500, utilization: 92, status: 'congested' },
  { id: 't3', from: [22.8395, 69.7221], to: [19.8342, 72.6681], capacity: 3000, utilization: 45, status: 'normal' },
  { id: 't4', from: [26.9157, 70.9083], to: [27.5114, 71.1989], capacity: 1000, utilization: 98, status: 'critical' }
]

export function IndiaTransmissionMap() {
  const [selectedLayer, setSelectedLayer] = useState<'plants' | 'transmission' | 'heatmap'>('plants')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getPlantColor = (type: string) => {
    switch (type) {
      case 'coal': return '#64748b'
      case 'hydro': return '#3b82f6'
      case 'nuclear': return '#f59e0b'
      case 'solar': return '#eab308'
      case 'wind': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getLineColor = (status: string) => {
    switch (status) {
      case 'normal': return '#10b981'
      case 'congested': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getLineWeight = (utilization: number) => {
    if (utilization > 90) return 6
    if (utilization > 70) return 4
    return 2
  }

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>India Transmission Network</CardTitle>
          <CardDescription>Loading map...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] flex items-center justify-center bg-muted rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              India Transmission Network Map
            </CardTitle>
            <CardDescription>
              Interactive map showing power plants and transmission corridors
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedLayer === 'plants' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLayer('plants')}
            >
              <Zap className="w-4 h-4 mr-2" />
              Plants
            </Button>
            <Button
              variant={selectedLayer === 'transmission' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLayer('transmission')}
            >
              <Layers className="w-4 h-4 mr-2" />
              Transmission
            </Button>
            <Button
              variant={selectedLayer === 'heatmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLayer('heatmap')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Demand
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] rounded-lg overflow-hidden border">
          <MapContainer
            center={[23.5, 78.9]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Power Plants Layer */}
            {(selectedLayer === 'plants' || selectedLayer === 'heatmap') && MOCK_PLANTS.map((plant) => (
              <Circle
                key={plant.id}
                center={plant.position}
                radius={plant.capacity * 20}
                pathOptions={{
                  color: getPlantColor(plant.type),
                  fillColor: getPlantColor(plant.type),
                  fillOpacity: 0.3
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">{plant.name}</h3>
                    <p className="text-sm">Type: {plant.type.toUpperCase()}</p>
                    <p className="text-sm">Capacity: {plant.capacity} MW</p>
                    <Badge variant={plant.status === 'active' ? 'default' : 'secondary'}>
                      {plant.status}
                    </Badge>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Transmission Lines Layer */}
            {selectedLayer === 'transmission' && MOCK_TRANSMISSION.map((line) => (
              <Polyline
                key={line.id}
                positions={[line.from, line.to]}
                pathOptions={{
                  color: getLineColor(line.status),
                  weight: getLineWeight(line.utilization),
                  opacity: 0.7
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">Transmission Line</h3>
                    <p className="text-sm">Capacity: {line.capacity} MW</p>
                    <p className="text-sm">Utilization: {line.utilization}%</p>
                    <Badge variant={
                      line.status === 'normal' ? 'default' :
                      line.status === 'congested' ? 'secondary' : 'destructive'
                    }>
                      {line.status}
                    </Badge>
                  </div>
                </Popup>
              </Polyline>
            ))}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-3">Legend</h4>
          {selectedLayer === 'plants' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['coal', 'hydro', 'nuclear', 'solar', 'wind'].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getPlantColor(type) }}
                  />
                  <span className="text-sm capitalize">{type}</span>
                </div>
              ))}
            </div>
          )}
          {selectedLayer === 'transmission' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-green-500" />
                <span className="text-sm">Normal (&lt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-orange-500" />
                <span className="text-sm">Congested (70-90%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-red-500" />
                <span className="text-sm">Critical (&gt;90%)</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
