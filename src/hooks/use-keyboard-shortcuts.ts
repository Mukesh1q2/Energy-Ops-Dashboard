"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ShortcutHandler {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(handlers: ShortcutHandler[] = []) {
  const router = useRouter()

  useEffect(() => {
    const defaultHandlers: ShortcutHandler[] = [
      {
        key: 'u',
        ctrl: true,
        description: 'Upload Data',
        action: () => {
          // Trigger upload modal or navigate to upload page
          const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'upload' } })
          window.dispatchEvent(event)
        }
      },
      {
        key: 'o',
        ctrl: true,
        description: 'Run Optimization',
        action: () => {
          const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'optimize' } })
          window.dispatchEvent(event)
        }
      },
      {
        key: 'k',
        ctrl: true,
        description: 'Create Chart',
        action: () => {
          const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'create-chart' } })
          window.dispatchEvent(event)
        }
      },
      {
        key: 'r',
        ctrl: true,
        description: 'View Reports',
        action: () => {
          const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'reports' } })
          window.dispatchEvent(event)
        }
      },
      {
        key: 'e',
        ctrl: true,
        description: 'Export Data',
        action: () => {
          const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'export' } })
          window.dispatchEvent(event)
        }
      },
      {
        key: '/',
        ctrl: true,
        description: 'Search',
        action: () => {
          const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'search' } })
          window.dispatchEvent(event)
        }
      },
      {
        key: 'h',
        ctrl: true,
        description: 'Go to Home',
        action: () => {
          router.push('/')
        }
      },
      {
        key: 's',
        ctrl: true,
        description: 'Go to Sandbox',
        action: () => {
          router.push('/sandbox')
        }
      },
      {
        key: '?',
        ctrl: true,
        shift: true,
        description: 'Show Keyboard Shortcuts',
        action: () => {
          const event = new CustomEvent('keyboard-shortcut', { detail: { action: 'show-shortcuts' } })
          window.dispatchEvent(event)
        }
      }
    ]

    const allHandlers = [...defaultHandlers, ...handlers]

    const handleKeyDown = (event: KeyboardEvent) => {
      // Find matching handler
      const handler = allHandlers.find(h => {
        const keyMatches = h.key.toLowerCase() === event.key.toLowerCase()
        const ctrlMatches = h.ctrl === undefined || h.ctrl === (event.ctrlKey || event.metaKey)
        const shiftMatches = h.shift === undefined || h.shift === event.shiftKey
        const altMatches = h.alt === undefined || h.alt === event.altKey

        return keyMatches && ctrlMatches && shiftMatches && altMatches
      })

      if (handler) {
        event.preventDefault()
        handler.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers, router])
}

// Helper to show all available shortcuts
export function getAvailableShortcuts(): ShortcutHandler[] {
  return [
    { key: 'Ctrl+U', description: 'Upload Data', action: () => {}, ctrl: true },
    { key: 'Ctrl+O', description: 'Run Optimization', action: () => {}, ctrl: true },
    { key: 'Ctrl+K', description: 'Create Chart', action: () => {}, ctrl: true },
    { key: 'Ctrl+R', description: 'View Reports', action: () => {}, ctrl: true },
    { key: 'Ctrl+E', description: 'Export Data', action: () => {}, ctrl: true },
    { key: 'Ctrl+/', description: 'Search', action: () => {}, ctrl: true },
    { key: 'Ctrl+H', description: 'Go to Home', action: () => {}, ctrl: true },
    { key: 'Ctrl+S', description: 'Go to Sandbox', action: () => {}, ctrl: true },
    { key: 'Ctrl+Shift+?', description: 'Show Shortcuts', action: () => {}, ctrl: true, shift: true }
  ]
}
