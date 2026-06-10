/**
 * Pull-to-Refresh Hook
 * Native-like pull to refresh functionality for mobile
 */

import { useEffect, useRef, useState } from 'react'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  enabled?: boolean
}

export function usePullToRefresh({ onRefresh, threshold = 80, enabled = true }: PullToRefreshOptions) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  // Use refs for values needed inside event handlers to avoid stale closures
  const pullDistanceRef = useRef(0)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    let isDragging = false

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return
      startY.current = e.touches[0].clientY
      isDragging = true
      setPulling(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || window.scrollY > 0) return

      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - startY.current)

      if (distance > 0) {
        // Damping effect
        const dampedDistance = Math.min(distance * 0.5, threshold * 1.5)
        pullDistanceRef.current = dampedDistance
        setPullDistance(dampedDistance)

        if (dampedDistance > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (!isDragging) return
      isDragging = false
      setPulling(false)

      if (pullDistanceRef.current >= threshold) {
        setRefreshing(true)
        setPullDistance(0)
        pullDistanceRef.current = 0
        try {
          await onRefreshRef.current()
        } finally {
          setRefreshing(false)
        }
      } else {
        setPullDistance(0)
        pullDistanceRef.current = 0
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold]) // removed onRefresh & pullDistance from deps — handled via refs

  return {
    containerRef,
    pulling,
    pullDistance,
    refreshing,
    isActive: pulling || refreshing
  }
}
