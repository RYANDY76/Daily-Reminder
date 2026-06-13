import { useState, useCallback, useEffect, useRef } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { getTasksForDate } from '../database'
import { getTodayDate, getTomorrowDate } from '../dates'

const CHECK_INTERVAL = 60_000
const STORAGE_KEY = 'daily_reminder_notif_prefs'

export interface NotifPrefs {
  enabled: boolean
  taskReminders: boolean
  dailySummary: boolean
  summaryHour: number
  summaryMinute: number
}

const defaultPrefs: NotifPrefs = {
  enabled: false,
  taskReminders: true,
  dailySummary: true,
  summaryHour: 7,
  summaryMinute: 0
}

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPrefs
    return { ...defaultPrefs, ...JSON.parse(raw) }
  } catch {
    if (import.meta.env.DEV) console.warn('[Notif] prefs parse failed')
    return defaultPrefs
  }
}

function savePrefs(prefs: NotifPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function useNotifications() {
  const [prefs, setPrefsState] = useState<NotifPrefs>(loadPrefs)
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const lastNotifiedRef = useRef<Set<string>>(new Set())

  const updatePrefs = useCallback((updates: Partial<NotifPrefs>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...updates }
      savePrefs(next)
      return next
    })
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  const showNotif = useCallback((title: string, body: string, tag?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    if (tag && lastNotifiedRef.current.has(tag)) return
    if (tag) lastNotifiedRef.current.add(tag)
    try {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, { body, tag, icon: '/icon-192.png' })
      }).catch(() => {
        new Notification(title, { body, tag })
      })
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[Notif] show notification failed:', e)
      new Notification(title, { body, tag })
    }
  }, [])

  const checkAndNotify = useCallback(async (tasks: any[]) => {
    if (!prefs.enabled || !('Notification' in window) || Notification.permission !== 'granted') return
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    for (const task of tasks) {
      if (task.done) continue
      const [h, m] = (task.time || '00:00').split(':').map(Number)
      const taskMinutes = h * 60 + m
      const diff = taskMinutes - currentMinutes
      if (diff >= 0 && diff <= 5) {
        showNotif('Tugas akan segera dimulai', `"${task.title}" pukul ${task.time}`, `task-${task.id}-${getTodayDate()}`)
      }
    }
  }, [prefs.enabled, showNotif])

  useEffect(() => {
    if (!prefs.enabled || !prefs.taskReminders) return

    const check = async () => {
      const profile = useProfileStore.getState().currentProfile
      if (!profile) return
      const today = getTodayDate()
      const tasks = await getTasksForDate(profile.id, today)
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      for (const task of tasks) {
        if (task.done) continue
        const [h, m] = task.time.split(':').map(Number)
        const taskMinutes = h * 60 + m
        const diff = taskMinutes - currentMinutes

        if (diff >= 0 && diff <= 5) {
          showNotif(
            'Tugas akan segera dimulai',
            `"${task.title}" pukul ${task.time}`,
            `task-${task.id}-${today}`
          )
        }
      }
    }

    check()
    intervalRef.current = setInterval(check, CHECK_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [prefs.enabled, prefs.taskReminders, showNotif])

  useEffect(() => {
    if (!prefs.enabled || !prefs.dailySummary) return

    const checkSummary = async () => {
      const profile = useProfileStore.getState().currentProfile
      if (!profile) return
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const summaryMinutes = prefs.summaryHour * 60 + prefs.summaryMinute
      const diff = currentMinutes - summaryMinutes

      if (diff >= 0 && diff <= 2) {
        const today = getTodayDate()
        const tasks = await getTasksForDate(profile.id, today)
        const pending = tasks.filter(t => !t.done)
        const done = tasks.filter(t => t.done)
        const tomorrow = getTomorrowDate()
        const tomorrowTasks = await getTasksForDate(profile.id, tomorrow)

        showNotif(
          'Ringkasan Harian',
          `${done.length} selesai · ${pending.length} tersisa · ${tomorrowTasks.length} untuk besok`,
          `summary-${today}`
        )
      }
    }

    checkSummary()
    const summaryTimer = setInterval(checkSummary, 60000)
    return () => clearInterval(summaryTimer)
  }, [prefs.enabled, prefs.dailySummary, prefs.summaryHour, prefs.summaryMinute, showNotif])

  return { prefs, updatePrefs, permission, requestPermission, checkAndNotify }
}
