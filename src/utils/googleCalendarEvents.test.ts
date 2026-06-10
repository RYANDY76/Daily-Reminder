import { describe, it, expect } from 'vitest'
import {
  parseGoogleApiEvents,
  eventsForDate,
  eventTimeLabel
} from './googleCalendarEvents'

describe('googleCalendarEvents', () => {
  it('parses Google API event items', () => {
    const events = parseGoogleApiEvents([
      {
        id: 'abc',
        summary: 'Meeting',
        start: { dateTime: '2026-06-10T09:00:00+07:00' },
        end: { dateTime: '2026-06-10T10:00:00+07:00' }
      },
      {
        id: 'def',
        summary: 'Holiday',
        start: { date: '2026-06-11' },
        end: { date: '2026-06-12' }
      }
    ])

    expect(events).toHaveLength(2)
    expect(events[0].summary).toBe('Meeting')
    expect(events[0].allDay).toBe(false)
    expect(events[1].allDay).toBe(true)
  })

  it('filters events by date', () => {
    const events = parseGoogleApiEvents([
      {
        id: '1',
        summary: 'A',
        start: { dateTime: '2026-06-10T09:00:00+07:00' },
        end: { dateTime: '2026-06-10T10:00:00+07:00' }
      }
    ])
    expect(eventsForDate(events, '2026-06-10')).toHaveLength(1)
    expect(eventsForDate(events, '2026-06-11')).toHaveLength(0)
  })

  it('formats all-day label', () => {
    const ev = {
      id: '1',
      summary: 'X',
      start: '2026-06-10',
      end: '2026-06-11',
      allDay: true
    }
    expect(eventTimeLabel(ev)).toBe('All day')
  })
})
