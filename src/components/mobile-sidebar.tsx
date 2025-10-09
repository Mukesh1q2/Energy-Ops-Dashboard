"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, X, Power } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface MobileSidebarProps {
  children: React.ReactNode
  logo?: React.ReactNode
}

export function MobileSidebar({ children, logo }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <>
      {/* Mobile Header with Menu Button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b h-14 flex items-center px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="p-6 border-b">
              <SheetTitle className="flex items-center gap-3">
                {logo || (
                  <>
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Power className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">OptiBid Dashboard</h1>
                      <p className="text-sm text-muted-foreground">Power Market Intelligence</p>
                    </div>
                  </>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(100vh-5rem)]">{children}</div>
          </SheetContent>
        </Sheet>

        {/* Logo in mobile header */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-lg font-bold">OptiBid Dashboard</h1>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-14 md:hidden" />
    </>
  )
}
