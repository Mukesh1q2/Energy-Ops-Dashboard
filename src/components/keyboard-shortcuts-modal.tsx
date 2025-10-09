"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Keyboard, Command } from "lucide-react"
import { getAvailableShortcuts } from "@/hooks/use-keyboard-shortcuts"

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)
  const shortcuts = getAvailableShortcuts()

  useEffect(() => {
    const handleShortcutEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.action === 'show-shortcuts') {
        setOpen(true)
      }
    }

    window.addEventListener('keyboard-shortcut', handleShortcutEvent)
    return () => window.removeEventListener('keyboard-shortcut', handleShortcutEvent)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm font-medium">{shortcut.description}</span>
              <Badge variant="secondary" className="font-mono text-xs">
                <Command className="w-3 h-3 mr-1" />
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Press <Badge variant="outline" className="font-mono">Ctrl+Shift+?</Badge> anytime to see these shortcuts
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
