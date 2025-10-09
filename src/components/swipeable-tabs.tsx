"use client"

import { useState } from "react"
import { motion, PanInfo, useMotionValue } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SwipeableTabsProps {
  tabs: {
    value: string
    label: string
    content: React.ReactNode
  }[]
  defaultValue?: string
  className?: string
}

export function SwipeableTabs({
  tabs,
  defaultValue,
  className = ''
}: SwipeableTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0].value)
  const x = useMotionValue(0)

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50 // Minimum swipe distance
    const currentIndex = tabs.findIndex(tab => tab.value === activeTab)

    if (info.offset.x > threshold && currentIndex > 0) {
      // Swipe right - previous tab
      setActiveTab(tabs[currentIndex - 1].value)
    } else if (info.offset.x < -threshold && currentIndex < tabs.length - 1) {
      // Swipe left - next tab
      setActiveTab(tabs[currentIndex + 1].value)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={className}>
      <TabsList className="w-full">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className="cursor-grab active:cursor-grabbing"
          >
            {tab.content}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

// Simplified version for touch devices
interface TouchSwipeProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function TouchSwipe({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50
}: TouchSwipeProps) {
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className="touch-pan-y"
    >
      {children}
    </motion.div>
  )
}
