"use client"

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false
}: UseIntersectionObserverOptions = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry>()
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<Element | null>(null)
  const frozen = useRef(false)

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry)
    setIsVisible(entry.isIntersecting)
    
    if (freezeOnceVisible && entry.isIntersecting) {
      frozen.current = true
    }
  }

  useEffect(() => {
    const node = elementRef.current
    const hasIOSupport = !!window.IntersectionObserver

    if (!hasIOSupport || frozen.current || !node) return

    const observerParams = { threshold, root, rootMargin }
    const observer = new IntersectionObserver(updateEntry, observerParams)

    observer.observe(node)

    return () => observer.disconnect()
  }, [threshold, root, rootMargin, freezeOnceVisible])

  return { ref: elementRef, entry, isVisible }
}

// Component wrapper for lazy loading
interface LazyLoadProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  className?: string
  rootMargin?: string
}

export function LazyLoad({
  children,
  placeholder,
  className = '',
  rootMargin = '200px'
}: LazyLoadProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0,
    rootMargin,
    freezeOnceVisible: true
  })

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : placeholder || <div className="h-64 animate-pulse bg-muted rounded" />}
    </div>
  )
}
