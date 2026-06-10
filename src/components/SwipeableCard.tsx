/**
 * Swipeable Card Component
 * iOS/Android style swipe to reveal actions
 */

import { useState, useRef, useEffect } from 'react'

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  threshold?: number
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80
}: SwipeableCardProps) {
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (Math.abs(swipeX) > threshold) {
      if (swipeX > 0 && onSwipeRight) {
        onSwipeRight()
        setSwipeX(threshold)
      } else if (swipeX < 0 && onSwipeLeft) {
        onSwipeLeft()
        setSwipeX(-threshold)
      }
    }
  }, [swipeX, threshold, onSwipeLeft, onSwipeRight])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (Math.abs(swipeX) > 0) return // Already swiped
    setIsDragging(true)
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    
    // Only allow horizontal drag
    if (Math.abs(diff) > Math.abs(e.touches[0].clientY - startX.current)) {
      e.preventDefault()
      setSwipeX(Math.max(-100, Math.min(100, diff)))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    if (Math.abs(swipeX) > threshold) {
      // Swipe completed
      setSwipeX(swipeX > 0 ? 100 : -100)
    } else {
      // Reset
      setSwipeX(0)
    }
  }

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left Action */}
      {leftAction && (
        <div className="absolute inset-y-0 left-0 bg-red-500 flex items-center pl-4">
          {leftAction}
        </div>
      )}

      {/* Right Action */}
      {rightAction && (
        <div className="absolute inset-y-0 right-0 bg-green-500 flex items-center pr-4">
          {rightAction}
        </div>
      )}

      {/* Draggable Card */}
      <div
        className="relative z-10 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border transition-transform duration-150 ease-out"
        style={{
          transform: `translateX(${swipeX}px)`,
          boxShadow: swipeX === 0 ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}
