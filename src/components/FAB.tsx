/**
 * Floating Action Button (FAB)
 * Material Design inspired floating action button
 */

import { Plus } from 'lucide-react'
import { useHaptic } from '../hooks/useHaptic'

interface FABProps {
  onClick: () => void
  label?: string
  icon?: React.ReactNode
  className?: string
}

export default function FAB({ onClick, label, icon = <Plus className="w-6 h-6" />, className = '' }: FABProps) {
  const { trigger } = useHaptic()

  const handleClick = () => {
    trigger('medium')
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 active:scale-95 group ${className}`}
      style={{
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
      }}
      aria-label={label}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="transform group-hover:rotate-90 transition-transform duration-300">
          {icon}
        </div>
        {label && (
          <span className="font-semibold text-sm hidden md:inline whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
      
      {/* Ripple effect container */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-100 transition-transform duration-300 rounded-full" />
      </div>
    </button>
  )
}
