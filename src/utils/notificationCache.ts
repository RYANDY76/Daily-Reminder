import type { Habit, Task } from '../types'

const DB_NAME = 'DailyReminderNotifications'
const DB_VERSION = 1
const STORE = 'tasks'

export const HABIT_REMINDER_TIME = '09:00'

interface CachedNotificationData {
  id: string
  tasks: Task[]
  habits: Habit[]
  lang: string
  updatedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function cacheTasksForNotifications(
  profileId: string,
  tasks: Task[],
  lang: string,
  habits: Habit[] = []
): Promise<void> {
  const db = await openDB()
  const today = new Date().toISOString().split('T')[0]
  const data: CachedNotificationData = {
    id: profileId,
    tasks: tasks.filter(t => !t.done),
    habits: habits.filter(h => !h.completedDates.includes(today)),
    lang,
    updatedAt: Date.now()
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(data)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_NOTIFICATION_TASKS', profileId })
  }
}

export async function requestNotificationPermissionViaSW(): Promise<void> {
  const reg = await navigator.serviceWorker?.ready
  reg?.active?.postMessage({ type: 'START_NOTIFICATION_CHECK' })
}
