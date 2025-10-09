"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Upload, 
  Zap, 
  BarChart3, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  User,
  ArrowRight
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type: string
  action: string
  title: string
  description?: string
  status: string
  created_at: string
  last_viewed?: string
  kuch_kuch?: string
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities?limit=10')
      const result = await response.json()
      
      if (result.success) {
        setActivities(result.data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'data_upload':
        return <Upload className="w-4 h-4" />
      case 'optimization':
        return <Zap className="w-4 h-4" />
      case 'chart':
        return <BarChart3 className="w-4 h-4" />
      case 'system':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'data_upload':
        return 'bg-blue-100 text-blue-700'
      case 'optimization':
        return 'bg-yellow-100 text-yellow-700'
      case 'chart':
        return 'bg-purple-100 text-purple-700'
      case 'system':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Report Activity</CardTitle>
            <CardDescription>Latest report generation and access logs</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  className="grid grid-cols-4 gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="col-span-1">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Report Name
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Date/Time Created
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm">
                      {activity.last_viewed ? new Date(activity.last_viewed).toLocaleString() : 'Not viewed'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last Viewed
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm line-clamp-2">
                      {activity.kuch_kuch || 'No notes'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kuch Kuch
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {activities.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Button variant="link" className="w-full text-sm">
              View all activity
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
