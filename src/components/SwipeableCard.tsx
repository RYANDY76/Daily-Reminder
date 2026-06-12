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
  const [swipeX, setSwipeX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [resetting, setResetting] = useState(false)
  const startX = useRef(0)
  const triggeredRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const resetSwipe = () => {
    setResetting(true)
    setSwipeX(0)
    triggeredRef.current = false
    setTimeout(() => setResetting(false), 300)
  }

  useEffect(() => {
    if (triggeredRef.current || Math.abs(swipeX) <= threshold) return
    triggeredRef.current = true

    if (swipeX > 0 && onSwipeRight) {
      onSwipeRight()
      setTimeout(resetSwipe, 200)
    } else if (swipeX < 0 && onSwipeLeft) {
      onSwipeLeft()
      setTimeout(resetSwipe, 200)
    }
  }, [swipeX, threshold, onSwipeLeft, onSwipeRight])

  const handleDragStart = (clientX: number) => {
    if (triggeredRef.current) return
    setIsDragging(true)
    startX.current = clientX
  }

  const handleDragMove = (clientX: number, clientY?: number) => {
    if (!isDragging || triggeredRef.current) return
    const diff = clientX - startX.current
    if (clientY !== undefined && Math.abs(diff) <= Math.abs(clientY - startX.current)) return
    if (Math.abs(diff) > 0) {
      setSwipeX(Math.max(-100, Math.min(100, diff)))
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (Math.abs(swipeX) > threshold && !triggeredRef.current) {
      setSwipeX(swipeX > 0 ? 100 : -100)
    } else {
      resetSwipe()
    }
  }

  const handleMouseStart = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX)
  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
  }

  const transClass = isDragging ? 'duration-75' : 'duration-200 ease-out'

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDragEnd}
      onMouseDown={handleMouseStart}
      onMouseMove={handleMouseMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {leftAction && (
        <div className="absolute inset-y-0 left-0 bg-red-500 flex items-center pl-4">
          {leftAction}
        </div>
      )}

      {rightAction && (
        <div className="absolute inset-y-0 right-0 bg-green-500 flex items-center pr-4">
          {rightAction}
        </div>
      )}

      <div
        className={`relative z-10 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border transition-transform ${transClass} ${resetting ? 'duration-300' : ''}`}
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
