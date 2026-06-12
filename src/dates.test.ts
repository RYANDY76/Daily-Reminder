import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getTodayDate,
  getTomorrowDate,
  getSessionFromHour,
  getSessionFromTime,
  formatDate,
  formatDateShort,
  getDayName,
  getDayIndex,
  isToday,
  isPast,
  isFuture,
  getTimeDisplay,
  generateDateRange,
  getLast7Days,
  isSameDay,
  getTimeGreeting
} from './dates'

vi.mock('./i18n', () => ({
  t: (key: string) => key,
  useT: () => (key: string) => key
}))

describe('dates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-12T10:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('getTodayDate returns current date', () => {
    expect(getTodayDate()).toBe('2026-06-12')
  })

  it('getTomorrowDate returns next date', () => {
    expect(getTomorrowDate()).toBe('2026-06-13')
  })

  it('getSessionFromHour returns correct session', () => {
    expect(getSessionFromHour(8)).toBe('pagi')
    expect(getSessionFromHour(12)).toBe('siang')
    expect(getSessionFromHour(15)).toBe('sore')
    expect(getSessionFromHour(20)).toBe('malam')
  })

  it('getSessionFromTime parses time string', () => {
    expect(getSessionFromTime('08:00')).toBe('pagi')
    expect(getSessionFromTime('12:00')).toBe('siang')
    expect(getSessionFromTime('15:00')).toBe('sore')
    expect(getSessionFromTime('20:00')).toBe('malam')
  })

  it('isToday checks correctly', () => {
    expect(isToday('2026-06-12')).toBe(true)
    expect(isToday('2026-06-13')).toBe(false)
  })

  it('isPast checks correctly', () => {
    expect(isPast('2026-06-11')).toBe(true)
    expect(isPast('2026-06-12')).toBe(false)
  })

  it('isFuture checks correctly', () => {
    expect(isFuture('2026-06-13')).toBe(true)
    expect(isFuture('2026-06-12')).toBe(false)
  })

  it('getTimeDisplay formats time', () => {
    expect(getTimeDisplay('08:00')).toBe('08.00')
    expect(getTimeDisplay('14:30')).toBe('14.30')
  })

  it('generateDateRange returns correct dates', () => {
    const range = generateDateRange('2026-06-10', '2026-06-12')
    expect(range).toHaveLength(3)
    expect(range[0]).toBe('2026-06-10')
    expect(range[1]).toBe('2026-06-11')
    expect(range[2]).toBe('2026-06-12')
  })

  it('getLast7Days returns 7 dates', () => {
    const days = getLast7Days()
    expect(days).toHaveLength(7)
    expect(days[6]).toBe('2026-06-12')
  })

  it('isSameDay compares dates', () => {
    expect(isSameDay('2026-06-12', '2026-06-12')).toBe(true)
    expect(isSameDay('2026-06-12', '2026-06-13')).toBe(false)
  })

  it('getTimeGreeting returns correct greeting based on hour', () => {
    expect(getTimeGreeting((k) => k === 'greeting.morning' ? 'pagi' : k)).toBe('pagi')
    // Morning hour (10 AM)
    const morningGreeting = getTimeGreeting((k) => k)
    expect(morningGreeting).toBe('greeting.morning')
  })

  it('formatDate formats date string', () => {
    const formatted = formatDate('2026-06-12')
    expect(formatted).toContain('Juni')
    expect(formatted).toContain('2026')
  })
})
