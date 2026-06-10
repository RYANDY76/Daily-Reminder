import { useProfileStore } from '../stores/useProfileStore'
import { encryptToken, decryptToken } from '../crypto'
import { requestGoogleAccessToken } from '../utils/googleToken'
import { parseGoogleApiEvents, saveGoogleCalendarEvents, type GoogleCalendarEvent } from '../utils/googleCalendarEvents'
import { saveTask, getAllTasksForProfile } from '../database'
import { getSessionFromTime, getTodayDate } from '../dates'
import type { Task } from '../types'

async function getAccessToken(): Promise<string | null> {
  const profile = useProfileStore.getState().currentProfile
  if (!profile?.googleAccessToken || !profile.googleCalendarConnected) return null

  let token = await decryptToken(profile.googleAccessToken)
  if (!token) return null

  const probe = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(token)}`
  )
  if (probe.ok) return token

  const fresh = await requestGoogleAccessToken()
  if (!fresh) return null

  const encrypted = await encryptToken(fresh)
  await useProfileStore.getState().updateProfile({ googleAccessToken: encrypted, lastSyncAt: Date.now() })
  return fresh
}

function taskToEventTimes(task: Task): { start: string; end: string } {
  const [h, m] = task.time.split(':').map(Number)
  const start = new Date(`${task.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function createGoogleEventForTask(task: Task): Promise<string | null> {
  const token = await getAccessToken()
  if (!token) return null

  const { start, end } = taskToEventTimes(task)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: task.title,
      description: task.notes || undefined,
      start: { dateTime: start, timeZone: tz },
      end: { dateTime: end, timeZone: tz }
    })
  })

  if (!response.ok) return null
  const data = await response.json()
  return data.id || null
}

export async function updateGoogleEventForTask(task: Task): Promise<boolean> {
  if (!task.googleEventId) return false
  const token = await getAccessToken()
  if (!token) return false

  const { start, end } = taskToEventTimes(task)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(task.googleEventId)}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: task.title,
        description: task.notes || undefined,
        start: { dateTime: start, timeZone: tz },
        end: { dateTime: end, timeZone: tz }
      })
    }
  )
  return response.ok
}

export async function deleteGoogleEventForTask(task: Task): Promise<boolean> {
  if (!task.googleEventId) return false
  const token = await getAccessToken()
  if (!token) return false

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(task.googleEventId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  )
  return response.ok || response.status === 404
}

export async function fetchGoogleCalendarEvents(days = 14): Promise<GoogleCalendarEvent[]> {
  const profile = useProfileStore.getState().currentProfile
  const token = await getAccessToken()
  if (!token || !profile) return []

  const now = new Date()
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) return []

  const data = await response.json()
  const events = parseGoogleApiEvents(data.items || [])
  saveGoogleCalendarEvents(profile.id, events)
  await useProfileStore.getState().updateProfile({ lastSyncAt: Date.now() })
  window.dispatchEvent(new CustomEvent('google-calendar-updated'))
  return events
}

export async function importGoogleEventsAsTasks(importAll = false): Promise<number> {
  const profile = useProfileStore.getState().currentProfile
  if (!profile) return 0

  const events = await fetchGoogleCalendarEvents(14)
  const existing = await getAllTasksForProfile(profile.id)
  const linkedIds = new Set(existing.map(t => t.googleEventId).filter(Boolean))
  let imported = 0

  for (const ev of events) {
    if (linkedIds.has(ev.id)) continue
    if (!importAll && ev.allDay) continue

    const date = ev.start.slice(0, 10)
    const time = ev.allDay
      ? '09:00'
      : new Date(ev.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

    const task: Task = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      title: ev.summary,
      time,
      session: getSessionFromTime(time),
      notes: 'Imported from Google Calendar',
      color: '#3B82F6',
      done: false,
      status: 'pending',
      priority: 'medium',
      tags: ['google'],
      dueDate: date,
      subtasks: [],
      timeTracking: null,
      recurring: null,
      isRecurring: false,
      recurringId: null,
      date,
      sortOrder: existing.length + imported,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      googleEventId: ev.id,
      syncedToGoogle: true,
      snoozedUntil: null
    }

    await saveTask(task)
    linkedIds.add(ev.id)
    imported++
  }

  return imported
}

export async function syncTaskWithGoogle(task: Task, mode: 'create' | 'update' | 'delete'): Promise<Task | null> {
  const profile = useProfileStore.getState().currentProfile
  if (!profile?.googleCalendarConnected) return task

  if (mode === 'delete') {
    await deleteGoogleEventForTask(task)
    return null
  }

  if (mode === 'update' && task.googleEventId) {
    await updateGoogleEventForTask(task)
    return task
  }

  if (mode === 'create' || (mode === 'update' && !task.googleEventId)) {
    const eventId = await createGoogleEventForTask(task)
    if (eventId) {
      return { ...task, googleEventId: eventId, syncedToGoogle: true, updatedAt: Date.now() }
    }
  }

  return task
}
