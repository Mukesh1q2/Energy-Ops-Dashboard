"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  Settings, 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  RefreshCw,
  Wifi,
  WifiOff,
  Pause,
  Play
} from "lucide-react"

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    callback: () => void
  }
}

interface UserPreference {
  id: string
  category: string
  name: string
  description: string
  value: boolean
  type: 'switch' | 'select'
  options?: string[]
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'error'
  components: {
    database: 'online' | 'offline' | 'degraded'
    api: 'online' | 'offline' | 'degraded'
    realtime: 'online' | 'offline' | 'degraded'
    storage: 'online' | 'offline' | 'degraded'
  }
  metrics: {
    uptime: string
    responseTime: number
    errorRate: number
    activeConnections: number
  }
}

export function RealTimeUpdates() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<UserPreference[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [isRealTimeActive, setIsRealTimeActive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // Initialize preferences
    const initialPreferences: UserPreference[] = [
      {
        id: 'real-time-notifications',
        category: 'Notifications',
        name: 'Real-time Alerts',
        description: 'Receive instant notifications for critical events',
        value: true,
        type: 'switch'
      },
      {
        id: 'email-digest',
        category: 'Notifications',
        name: 'Email Digest',
        description: 'Daily summary of dashboard activities',
        value: false,
        type: 'switch'
      },
      {
        id: 'update-frequency',
        category: 'Updates',
        name: 'Update Frequency',
        description: 'How often data should refresh',
        value: true,
        type: 'select',
        options: ['5 seconds', '30 seconds', '1 minute', '5 minutes']
      },
      {
        id: 'auto-refresh',
        category: 'Updates',
        name: 'Auto Refresh',
        description: 'Automatically refresh dashboard data',
        value: true,
        type: 'switch'
      },
      {
        id: 'sound-alerts',
        category: 'Alerts',
        name: 'Sound Alerts',
        description: 'Play sound for critical notifications',
        value: false,
        type: 'switch'
      },
      {
        id: 'desktop-notifications',
        category: 'Alerts',
        name: 'Desktop Notifications',
        description: 'Show browser notifications for alerts',
        value: true,
        type: 'switch'
      }
    ]
    setPreferences(initialPreferences)

    // Initialize system status
    setSystemStatus({
      overall: 'healthy',
      components: {
        database: 'online',
        api: 'online',
        realtime: 'online',
        storage: 'online'
      },
      metrics: {
        uptime: '99.9%',
        responseTime: 145,
        errorRate: 0.02,
        activeConnections: 1247
      }
    })

    // Generate initial notifications
    const initialNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'System Online',
        message: 'All systems are operational and running normally',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false
      },
      {
        id: '2',
        type: 'info',
        title: 'Data Update Complete',
        message: 'Market data has been successfully updated',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: true
      },
      {
        id: '3',
        type: 'warning',
        title: 'High Load Detected',
        message: 'System load is approaching threshold levels',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        action: {
          label: 'View Details',
          callback: () => console.log('View load details')
        }
      }
    ]
    setNotifications(initialNotifications)

    // Set up real-time simulation
    let interval: NodeJS.Timeout
    if (isRealTimeActive) {
      interval = setInterval(() => {
        setLastUpdate(new Date())
        
        // Simulate random notifications
        if (Math.random() < 0.1) { // 10% chance every interval
          const notificationTypes = ['info', 'warning', 'success', 'error'] as const
          const messages = [
            'New data available for analysis',
            'System performance optimized',
            'Anomaly detected in transmission data',
            'Backup process completed successfully',
            'User activity spike detected'
          ]
          
          const newNotification: Notification = {
            id: Date.now().toString(),
            type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
            title: 'System Alert',
            message: messages[Math.floor(Math.random() * messages.length)],
            timestamp: new Date(),
            read: false
          }
          
          setNotifications(prev => [newNotification, ...prev])
        }
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRealTimeActive])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const updatePreference = (id: string, value: boolean | string) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id ? { ...pref, value: value as boolean } : pref
      )
    )
  }

  const toggleRealTime = () => {
    setIsRealTimeActive(!isRealTimeActive)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'offline':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'degraded':
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'info':
      default:
        return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Real-time Updates & Notifications
              </CardTitle>
              <CardDescription>
                Monitor system status, manage notifications, and configure preferences
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Real-time Updates</span>
                <Switch checked={isRealTimeActive} onCheckedChange={toggleRealTime} />
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                {isRealTimeActive ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
                <span className="text-sm font-medium">Connection</span>
              </div>
              <Badge variant={isRealTimeActive ? "default" : "destructive"}>
                {isRealTimeActive ? 'Live' : 'Paused'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <Badge variant="secondary">{unreadCount} unread</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Update Rate</span>
              </div>
              <Badge variant="outline">5s</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Last Update</span>
              </div>
              <Badge variant="outline">{lastUpdate.toLocaleTimeString()}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System Status
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications Center</CardTitle>
                  <CardDescription>
                    Stay informed with real-time alerts and system updates
                  </CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No notifications</p>
                    <p className="text-muted-foreground">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${notification.read ? 'bg-background' : 'bg-muted/50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{notification.title}</h4>
                              {!notification.read && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{notification.timestamp.toLocaleString()}</span>
                              {notification.action && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={notification.action.callback}
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(systemStatus?.overall || 'healthy')}
                  System Health
                </CardTitle>
                <CardDescription>
                  Overall system status and component health
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemStatus && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(systemStatus.components.database)}
                        <span className="font-medium">Database</span>
                      </div>
                      <Badge variant={systemStatus.components.database === 'online' ? 'default' : 'destructive'}>
                        {systemStatus.components.database}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(systemStatus.components.api)}
                        <span className="font-medium">API Services</span>
                      </div>
                      <Badge variant={systemStatus.components.api === 'online' ? 'default' : 'destructive'}>
                        {systemStatus.components.api}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(systemStatus.components.realtime)}
                        <span className="font-medium">Real-time Engine</span>
                      </div>
                      <Badge variant={systemStatus.components.realtime === 'online' ? 'default' : 'destructive'}>
                        {systemStatus.components.realtime}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(systemStatus.components.storage)}
                        <span className="font-medium">Storage</span>
                      </div>
                      <Badge variant={systemStatus.components.storage === 'online' ? 'default' : 'destructive'}>
                        {systemStatus.components.storage}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  System performance and usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemStatus && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-blue-600">{systemStatus.metrics.uptime}</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-green-600">{systemStatus.metrics.responseTime}ms</div>
                        <div className="text-sm text-muted-foreground">Response Time</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-yellow-600">{systemStatus.metrics.errorRate}%</div>
                        <div className="text-sm text-muted-foreground">Error Rate</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-purple-600">{systemStatus.metrics.activeConnections}</div>
                        <div className="text-sm text-muted-foreground">Active Connections</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your dashboard experience and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(
                  preferences.reduce((acc, pref) => {
                    if (!acc[pref.category]) {
                      acc[pref.category] = []
                    }
                    acc[pref.category].push(pref)
                    return acc
                  }, {} as Record<string, UserPreference[]>)
                ).map(([category, prefs]) => (
                  <div key={category}>
                    <h4 className="font-medium mb-4 text-lg">{category}</h4>
                    <div className="space-y-4">
                      {prefs.map((pref) => (
                        <div key={pref.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium">{pref.name}</h5>
                            <p className="text-sm text-muted-foreground">{pref.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {pref.type === 'switch' ? (
                              <Switch
                                checked={pref.value as boolean}
                                onCheckedChange={(checked) => updatePreference(pref.id, checked)}
                              />
                            ) : (
                              <Select
                                value={pref.value as string}
                                onValueChange={(value) => updatePreference(pref.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {pref.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}