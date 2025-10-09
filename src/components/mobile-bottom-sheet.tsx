"use client"

import { Drawer } from "vaul"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}

export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children
}: MobileBottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-y-auto">
            {/* Handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <Drawer.Title className="text-lg font-semibold">{title}</Drawer.Title>
                {description && (
                  <Drawer.Description className="text-sm text-muted-foreground mt-1">
                    {description}
                  </Drawer.Description>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="pb-8">{children}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
