export interface GoogleCalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  allDay: boolean
}

const storageKey = (profileId: string) => `daily_reminder_gcal_${profileId}`

export function saveGoogleCalendarEvents(profileId: string, events: GoogleCalendarEvent[]): void {
  localStorage.setItem(storageKey(profileId), JSON.stringify({ events, updatedAt: Date.now() }))
}

export function getGoogleCalendarEvents(profileId: string): GoogleCalendarEvent[] {
  try {
    const raw = localStorage.getItem(storageKey(profileId))
    if (!raw) return []
    return (JSON.parse(raw).events as GoogleCalendarEvent[]) || []
  } catch {
    return []
  }
}

export function parseGoogleApiEvents(items: any[]): GoogleCalendarEvent[] {
  return (items || []).map((item) => {
    const startRaw = item.start?.dateTime || item.start?.date || ''
    const endRaw = item.end?.dateTime || item.end?.date || ''
    const allDay = !!item.start?.date && !item.start?.dateTime
    return {
      id: item.id,
      summary: item.summary || '(No title)',
      start: startRaw,
      end: endRaw,
      allDay
    }
  })
}

export function eventsForDate(events: GoogleCalendarEvent[], dateStr: string): GoogleCalendarEvent[] {
  return events.filter((ev) => {
    const startDate = ev.start.slice(0, 10)
    return startDate === dateStr
  })
}

export function eventTimeLabel(ev: GoogleCalendarEvent): string {
  if (ev.allDay) return 'All day'
  const d = new Date(ev.start)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
