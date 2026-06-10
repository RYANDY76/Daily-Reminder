/**
 * Toast Hook
 * Global toast notification management
 */

import { useCallback } from 'react'
import { useAppStore } from '../stores/useAppStore'
import type { ToastType } from '../components/Toast'

export function useToast() {
  const addToast = useAppStore((s) => s.addToast)
  const removeToast = useAppStore((s) => s.removeToast)

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7)
    addToast({ id, message, type, duration })
    return id
  }, [addToast])

  const success = useCallback((message: string, duration?: number) => {
    return show(message, 'success', duration)
  }, [show])

  const error = useCallback((message: string, duration?: number) => {
    return show(message, 'error', duration)
  }, [show])

  const warning = useCallback((message: string, duration?: number) => {
    return show(message, 'warning', duration)
  }, [show])

  const info = useCallback((message: string, duration?: number) => {
    return show(message, 'info', duration)
  }, [show])

  return {
    show,
    success,
    error,
    warning,
    info,
    remove: removeToast
  }
}
