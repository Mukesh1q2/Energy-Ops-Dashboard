"use client"

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimateSize?: number
  overscan?: number
  className?: string
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 80,
  overscan = 5,
  className = ''
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan
  })

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: '100%', width: '100%' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Virtualized Table Component
interface VirtualizedTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    render?: (item: T) => React.ReactNode
  }[]
  rowHeight?: number
  className?: string
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 48,
  className = ''
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10
  })

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="bg-muted border-b">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((column) => (
            <div
              key={column.key}
              className="px-4 py-3 text-sm font-medium text-left"
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Rows */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '400px' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index]
            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 w-full border-b hover:bg-muted/50 transition-colors"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <div
                  className="grid h-full items-center"
                  style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
                >
                  {columns.map((column) => (
                    <div key={column.key} className="px-4 py-2 text-sm">
                      {column.render ? column.render(row) : row[column.key]}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
