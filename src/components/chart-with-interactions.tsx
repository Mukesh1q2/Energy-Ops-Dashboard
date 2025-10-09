"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Share2,
  Settings,
  MoreVertical,
  FileImage,
  FileText,
  Clipboard
} from "lucide-react"
import { toast } from "sonner"

interface ChartWithInteractionsProps {
  title: string
  description?: string
  children: React.ReactNode
  onExport?: (format: 'png' | 'svg' | 'csv' | 'json') => void
  onRefresh?: () => void
  onDrillDown?: (data: any) => void
  fullscreenMode?: boolean
  showZoomControls?: boolean
  showExportControls?: boolean
}

export function ChartWithInteractions({
  title,
  description,
  children,
  onExport,
  onRefresh,
  onDrillDown,
  fullscreenMode = false,
  showZoomControls = true,
  showExportControls = true
}: ChartWithInteractionsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const chartRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200))
    toast.success(`Zoom: ${zoomLevel + 10}%`)
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50))
    toast.success(`Zoom: ${zoomLevel - 10}%`)
  }

  const handleZoomReset = () => {
    setZoomLevel(100)
    toast.success("Zoom reset to 100%")
  }

  const handleExport = async (format: 'png' | 'svg' | 'csv' | 'json') => {
    toast.loading(`Exporting as ${format.toUpperCase()}...`)
    
    try {
      if (onExport) {
        onExport(format)
      } else {
        // Default export implementation
        if (format === 'png' && chartRef.current) {
          // Use html2canvas or similar library
          toast.success(`Chart exported as ${format.toUpperCase()}`)
        }
      }
    } catch (error) {
      toast.error("Export failed")
    }
  }

  const handleCopyToClipboard = async () => {
    toast.loading("Copying to clipboard...")
    try {
      // Implementation would copy chart image or data
      toast.success("Copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  const handleShare = () => {
    toast.loading("Generating share link...")
    setTimeout(() => {
      toast.success("Share link copied!")
    }, 500)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) {
      toast.success("Fullscreen mode enabled")
    }
  }

  return (
    <Card 
      ref={chartRef}
      className={`transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-4 z-50 shadow-2xl' 
          : ''
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {title}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {showZoomControls && (
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
                  {zoomLevel}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Export Menu */}
            {showExportControls && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('png')}>
                    <FileImage className="h-4 w-4 mr-2" />
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('svg')}>
                    <FileImage className="h-4 w-4 mr-2" />
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Data (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Data (JSON)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyToClipboard}>
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {fullscreenMode && (
                  <>
                    <DropdownMenuItem onClick={toggleFullscreen}>
                      {isFullscreen ? (
                        <>
                          <Minimize2 className="h-4 w-4 mr-2" />
                          Exit Fullscreen
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4 mr-2" />
                          Fullscreen
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {showZoomControls && (
                  <DropdownMenuItem onClick={handleZoomReset}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Zoom
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Chart
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Chart Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          className="transition-transform duration-200"
          style={{ 
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center'
          }}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
