/* eslint-disable no-restricted-globals */
/**
 * Service worker notification checker for Daily Reminder PWA.
 * Reads cached tasks & habits from IndexedDB and fires notifications when due.
 */

const DB_NAME = 'DailyReminderNotifications'
const STORE = 'tasks'
const CHECK_MS = 60000
const HABIT_REMINDER_TIME = '09:00'
const notifiedKeys = new Map() // key -> timestamp

function cleanupOldKeys() {
  const now = Date.now()
  for (const [key, ts] of notifiedKeys) {
    if (now - ts > 24 * 60 * 60 * 1000) notifiedKeys.delete(key)
  }
}

let checkTimer = null

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAllCachedTasks() {
  let db
  try {
    db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('[SW] Failed to read cached tasks:', err)
    return []
  } finally {
    if (db) db.close()
  }
}

function t(lang, key, vars) {
  const id = {
    taskTime: 'Daily Reminder',
    taskBody: 'Waktunya: {title}',
    deadlineClose: 'Deadline Mendekat',
    deadlineCloseBody: '"{title}" akan berakhir dalam {time} menit',
    deadlineToday: 'Deadline Hari Ini',
    deadlineTodayBody: '"{title}" belum selesai',
    habitReminder: 'Pengingat Kebiasaan',
    habitBody: 'Jangan lupa: {name}'
  }
  const en = {
    taskTime: 'Daily Reminder',
    taskBody: 'Time for: {title}',
    deadlineClose: 'Deadline Approaching',
    deadlineCloseBody: '"{title}" will end in {time} minutes',
    deadlineToday: 'Deadline Today',
    deadlineTodayBody: '"{title}" is not yet completed',
    habitReminder: 'Habit Reminder',
    habitBody: "Don't forget: {name}"
  }
  const dict = lang === 'en' ? en : id
  let str = dict[key] || key
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replace('{' + k + '}', vars[k])
    })
  }
  return str
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

async function checkDueNotifications() {
  cleanupOldKeys()
  if (Notification.permission !== 'granted') return

  const caches = await getAllCachedTasks()
  const now = new Date()
  const today = todayStr()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  for (const cache of caches) {
    const lang = cache.lang || 'id'

    for (const habit of cache.habits || []) {
      if ((habit.completedDates || []).includes(today)) continue
      const rt = habit.reminderTime || HABIT_REMINDER_TIME
      const rp = rt.split(':').map(Number)
      const habitMin = rp[0] * 60 + rp[1]
      const habitKey = 'habit-' + habit.id + '-' + today
      if (currentMinutes >= habitMin && currentMinutes <= habitMin + 30 && !notifiedKeys.has(habitKey)) {
        self.registration.showNotification(t(lang, 'habitReminder'), {
          body: t(lang, 'habitBody', { name: habit.name }),
          icon: '/icons/icon-192x192.png',
          tag: habitKey
        })
        notifiedKeys.set(habitKey, Date.now())
      }
    }

    for (const task of cache.tasks || []) {
      if (task.done) continue

      const parts = (task.time || '00:00').split(':').map(Number)
      const taskMinutes = parts[0] * 60 + parts[1]
      const timeKey = 'time-' + task.id + '-' + today

      if (Math.abs(currentMinutes - taskMinutes) <= 2 && !notifiedKeys.has(timeKey)) {
        self.registration.showNotification(t(lang, 'taskTime'), {
          body: t(lang, 'taskBody', { title: task.title }),
          icon: '/icons/icon-192x192.png',
          tag: timeKey
        })
        notifiedKeys.set(timeKey, Date.now())
      }

      if (task.dueDate && !task.done && task.dueDate <= today) {
        const dueDateTime = new Date(task.dueDate + 'T' + (task.time || '23:59') + ':00')
        const diffHours = (dueDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (diffHours > 0 && diffHours <= 1) {
          const warnKey = 'deadline-1h-' + task.id
          if (!notifiedKeys.has(warnKey)) {
            self.registration.showNotification(t(lang, 'deadlineClose'), {
              body: t(lang, 'deadlineCloseBody', { title: task.title, time: String(Math.ceil(diffHours * 60)) }),
              icon: '/icons/icon-192x192.png',
              tag: warnKey
            })
            notifiedKeys.set(warnKey, Date.now())
          }
        }
      }
    }
  }
}

function startCheckLoop() {
  try {
    if (checkTimer) clearInterval(checkTimer)
    checkDueNotifications()
    checkTimer = setInterval(checkDueNotifications, CHECK_MS)
  } catch (err) {
    console.error('[SW] Failed to start check loop:', err)
  }
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim().then(startCheckLoop))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'START_NOTIFICATION_CHECK' || event.data?.type === 'UPDATE_NOTIFICATION_TASKS') {
    startCheckLoop()
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload = { title: 'Daily Reminder', body: '' }
  try {
    payload = event.data.json()
  } catch {
    payload.body = event.data.text()
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Daily Reminder', {
      body: payload.body || '',
      icon: '/icons/icon-192x192.png',
      tag: 'web-push-' + Date.now()
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus()
      return self.clients.openWindow('/')
    })
  )
})
