import type { SessionType } from './types'

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function getTomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export function getSessionFromHour(hour: number): SessionType {
  if (hour < 12) return 'pagi'
  if (hour < 15) return 'siang'
  if (hour < 18) return 'sore'
  return 'malam'
}

export function getSessionFromTime(time: string): SessionType {
  const [h] = time.split(':').map(Number)
  return getSessionFromHour(h)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long' })
}

export function getDayIndex(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay()
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDate()
}

export function isPast(dateStr: string): boolean {
  return dateStr < getTodayDate()
}

export function isFuture(dateStr: string): boolean {
  return dateStr > getTodayDate()
}

export function getTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const hour = h.toString().padStart(2, '0')
  const min = m.toString().padStart(2, '0')
  return `${hour}.${min}`
}

export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (current <= end) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function getLast7Days(): string[] {
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2
}

export function getTimeGreeting(t: (key: string) => string): string {
  const h = new Date().getHours()
  if (h < 12) return t('greeting.morning')
  if (h < 15) return t('greeting.afternoon')
  if (h < 18) return t('greeting.evening')
  return t('greeting.night')
}
