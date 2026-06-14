import { useEffect, useRef } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { useAppStore } from '../stores/useAppStore'

const NUDGE_INTERVAL = 30 * 60 * 1000

export default function SmartNudge() {
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    const nudge = () => {
      const tasks = useTaskStore.getState().tasks
      const pending = tasks.filter(t => !t.done && !t.snoozedUntil)
      if (pending.length === 0) return
      const now = new Date()
      const hour = now.getHours()
      if (hour >= 7 && hour < 22) {
        useAppStore.getState().addToast({
          id: crypto.randomUUID(),
          message: `Masih ada ${pending.length} tugas yang belum selesai.`,
          type: 'info',
          duration: 4000
        })
      }
    }
    timerRef.current = setInterval(nudge, NUDGE_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [])

  return null
}
