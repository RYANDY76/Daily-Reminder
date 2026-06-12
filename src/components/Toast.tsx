/**
 * Modern Toast Notification Component
 * Instagram/iOS style toast notifications
 */

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X, XCircle } from 'lucide-react'
import { useT } from '../i18n'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
  action?: string
  onAction?: () => void
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info
}

const styles = {
  success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
}

export default function Toast({ message, type = 'info', duration, onClose, action, onAction }: ToastProps) {
  const t = useT()
  const [isExiting, setIsExiting] = useState(false)
  const Icon = icons[type]
  const effectiveDuration = duration ?? (action ? 6000 : 3000)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300)
    }, effectiveDuration)

    return () => clearTimeout(timer)
  }, [effectiveDuration, onClose])

  return (
    <div
      role="alert"
      className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] ${
        isExiting ? 'animate-toast-exit' : 'animate-toast-enter'
      }`}
    >
      <div className={`${styles[type]} border rounded-2xl shadow-2xl backdrop-blur-xl px-4 py-3 flex items-center gap-3`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
        {action && onAction && (
          <button
            onClick={() => {
              onAction()
              setIsExiting(true)
              setTimeout(onClose, 300)
            }}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
          >
            {action}
          </button>
        )}
        <button
          onClick={() => {
            setIsExiting(true)
            setTimeout(onClose, 300)
          }}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Toast Container Component
interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: string
  onAction?: () => void
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div aria-live="polite" className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="space-y-2 pointer-events-auto pt-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
            action={toast.action}
            onAction={toast.onAction}
          />
        ))}
      </div>
    </div>
  )
}
