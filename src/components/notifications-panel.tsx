"use client"

import { useState, useEffect } from "react"
import { Bell, X, Check, AlertTriangle, Info, AlertCircle, Zap, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: 'alert' | 'warning' | 'update' | 'info'
  category: string
  title: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  is_read: boolean
  action_url?: string
  action_label?: string
  created_at: string
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=20')
      const result = await response.json()
      
      if (result.success) {
        setNotifications(result.data)
        setUnreadCount(result.counts.unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (ids: string[]) => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, is_read: true })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - ids.length))
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  const archiveNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?ids=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        fetchNotifications() // Refresh counts
      }
    } catch (error) {
      console.error('Error archiving notification:', error)
    }
  }

  const getNotificationIcon = (type: string, severity: string) => {
    if (severity === 'critical' || type === 'alert') {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    }
    if (type === 'warning') {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
    if (type === 'update') {
      return <Zap className="w-5 h-5 text-blue-500" />
    }
    return <Info className="w-5 h-5 text-gray-500" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300'
      case 'high': return 'bg-orange-100 border-orange-300'
      case 'medium': return 'bg-yellow-100 border-yellow-300'
      default: return 'bg-blue-100 border-blue-300'
    }
  }

  const filterNotifications = (type: string) => {
    if (type === 'all') return notifications
    return notifications.filter(n => n.type === type)
  }

  const filteredNotifications = filterNotifications(activeTab)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={loading}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="all" className="relative">
              All
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alert" className="relative">
              Alerts
              {notifications.filter(n => n.type === 'alert' && !n.is_read).length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                  {notifications.filter(n => n.type === 'alert' && !n.is_read).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="warning">Warnings</TabsTrigger>
            <TabsTrigger value="update">Updates</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <TabsContent value={activeTab} className="m-0">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                        !notification.is_read && "bg-blue-50/50"
                      )}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead([notification.id])
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type, notification.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1 flex items-center gap-2">
                                {notification.title}
                                {!notification.is_read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                archiveNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            {notification.action_label && (
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                {notification.action_label}
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <Button variant="link" className="w-full text-sm" onClick={() => setOpen(false)}>
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
