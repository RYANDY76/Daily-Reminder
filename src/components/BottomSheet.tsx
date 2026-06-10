/**
 * Bottom Sheet Component
 * Native iOS/Android style bottom sheet modal
 */

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoints?: number[] // e.g., [0.5, 0.9] for 50% and 90% of screen height
  initialSnap?: number
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.9],
  initialSnap = 0
}: BottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [translateY, setTranslateY] = useState(0)
  const [currentSnap, setCurrentSnap] = useState(initialSnap)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const startTranslate = useRef(0)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    startY.current = e.touches[0].clientY
    startTranslate.current = translateY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    // Only allow downward drag
    if (diff > 0) {
      setTranslateY(startTranslate.current + diff)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    const threshold = window.innerHeight * 0.2
    
    if (translateY > threshold) {
      onClose()
    } else {
      setTranslateY(0)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const maxHeight = window.innerHeight * snapPoints[currentSnap]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full md:w-full md:max-w-2xl bg-white dark:bg-dark-surface rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-in-up overflow-hidden"
        style={{
          maxHeight: `${maxHeight}px`,
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        {/* Drag Handle */}
        <div
          className="md:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-border">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: `calc(${maxHeight}px - 80px)` }}>
          {children}
        </div>
      </div>
    </div>
  )
}
