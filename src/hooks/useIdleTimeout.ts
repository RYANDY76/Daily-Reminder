import { useEffect, useRef } from 'react'
import { useProfileStore } from '../stores/useProfileStore'

const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 menit

export function useIdleTimeout() {
  const timeoutRef = useRef<number | null>(null)
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const pinLocked = useProfileStore((s) => s.pinLocked)
  const lockProfile = useProfileStore((s) => s.lockProfile)

  useEffect(() => {
    if (!currentProfile?.pin || pinLocked) return

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        lockProfile()
      }, IDLE_TIMEOUT)
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => document.addEventListener(event, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      events.forEach((event) => document.removeEventListener(event, resetTimer))
    }
  }, [currentProfile?.pin, pinLocked, lockProfile])
}
