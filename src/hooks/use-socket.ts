"use client"

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      // Match server Socket.IO path
      socket = io({
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      })

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id)
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected')
        setIsConnected(false)
      })

      socket.on('connected', (data) => {
        console.log('📡 Real-time features available:', data.features)
      })
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    }
  }, [])

  const subscribe = (channel: string) => {
    if (socket) {
      socket.emit('subscribe', channel)
    }
  }

  const unsubscribe = (channel: string) => {
    if (socket) {
      socket.emit('unsubscribe', channel)
    }
  }

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, (data) => {
        setLastUpdate(new Date())
        callback(data)
      })
    }
  }

  const off = (event: string) => {
    if (socket) {
      socket.off(event)
    }
  }

  return {
    socket,
    isConnected,
    lastUpdate,
    subscribe,
    unsubscribe,
    on,
    off
  }
}
