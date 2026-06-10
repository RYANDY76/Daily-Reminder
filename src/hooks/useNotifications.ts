import { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { getTodayDate } from '../dates'
import { t } from '../i18n'
import type { Habit, Task } from '../types'
import { cacheTasksForNotifications, requestNotificationPermissionViaSW, HABIT_REMINDER_TIME } from '../utils/notificationCache'

const CHECK_INTERVAL = 30_000

export function useNotifications() {
  const intervalRef = useRef<number | null>(null)
  const notifiedTasks = useRef<Set<string>>(new Set())

  const checkAndNotify = useCallback(async (tasks: Task[], profileId?: string, habits: Habit[] = []) => {
    const enabled = useAppStore.getState().notificationEnabled
    const lang = useAppStore.getState().lang
    const leadMinutes = useAppStore.getState().reminderLeadMinutes

    if (profileId) {
      await cacheTasksForNotifications(profileId, tasks, lang, habits)
    }

    if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') return

    const now = new Date()
    const today = getTodayDate()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    for (const habit of habits) {
      if (habit.completedDates.includes(today)) continue
      const reminderTime = habit.reminderTime || HABIT_REMINDER_TIME
      const [hh, hm] = reminderTime.split(':').map(Number)
      const habitReminderMinutes = hh * 60 + hm
      const habitKey = `habit-${habit.id}-${today}`
      if (currentMinutes >= habitReminderMinutes && currentMinutes <= habitReminderMinutes + 30 && !notifiedTasks.current.has(habitKey)) {
        new Notification(t('notification.habitReminder'), {
          body: t('notification.habitBody', { name: habit.name }),
          icon: '/icons/icon-192x192.png',
          tag: habitKey
        })
        notifiedTasks.current.add(habitKey)
      }
    }

    for (const task of tasks) {
      if (task.done) continue

      const [h, m] = task.time.split(':').map(Number)
      const taskMinutes = h * 60 + m
      const timeKey = `time-${task.id}-${today}-${leadMinutes}`
      const reminderStart = taskMinutes - leadMinutes

      if (currentMinutes >= reminderStart && currentMinutes <= taskMinutes + 2 && !notifiedTasks.current.has(timeKey)) {
        new Notification(t('notification.taskTime'), {
          body: leadMinutes > 0
            ? t('notification.taskBodyLead', { title: task.title, mins: leadMinutes })
            : t('notification.taskBody', { title: task.title }),
          icon: '/icons/icon-192x192.png',
          tag: timeKey
        })
        notifiedTasks.current.add(timeKey)
      }

      if (task.dueDate && task.dueDate >= today) {
        const dueDateTime = new Date(`${task.dueDate}T${task.time || '23:59'}:00`)
        const diffMs = dueDateTime.getTime() - now.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        if (diffHours > 0 && diffHours <= 1) {
          const warnKey = `deadline-1h-${task.id}`
          if (!notifiedTasks.current.has(warnKey)) {
            new Notification(t('notification.deadlineClose'), {
              body: t('notification.deadlineCloseBody', { title: task.title, time: String(Math.ceil(diffHours * 60)) }),
              icon: '/icons/icon-192x192.png',
              tag: warnKey
            })
            notifiedTasks.current.add(warnKey)
          }
        }

        if (task.dueDate === today && currentMinutes >= 18 * 60 && currentMinutes <= 20 * 60) {
          const tonightKey = `deadline-tonight-${task.id}`
          if (!notifiedTasks.current.has(tonightKey)) {
            new Notification(t('notification.deadlineToday'), {
              body: t('notification.deadlineTodayBody', { title: task.title }),
              icon: '/icons/icon-192x192.png',
              tag: tonightKey
            })
            notifiedTasks.current.add(tonightKey)
          }
        }
      }
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') {
      useAppStore.getState().setNotificationEnabled(true)
      await requestNotificationPermissionViaSW()
      return true
    }
    if (Notification.permission === 'denied') return false

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      useAppStore.getState().setNotificationEnabled(true)
      await requestNotificationPermissionViaSW()
      return true
    }
    return false
  }, [])

  const toggleNotifications = useCallback(async () => {
    const enabled = useAppStore.getState().notificationEnabled
    if (enabled) {
      useAppStore.getState().setNotificationEnabled(false)
      return false
    }
    return await requestPermission()
  }, [requestPermission])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      useAppStore.getState().setNotificationEnabled(true)
      requestNotificationPermissionViaSW()
    }
  }, [])

  const notificationEnabled = useAppStore((s) => s.notificationEnabled)

  useEffect(() => {
    if (!notificationEnabled) return

    intervalRef.current = window.setInterval(() => {
      window.dispatchEvent(new CustomEvent('check-notifications'))
    }, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [notificationEnabled])

  return { checkAndNotify, requestPermission, toggleNotifications }
}
