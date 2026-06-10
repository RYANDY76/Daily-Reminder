import { getTodayDate, getSessionFromTime } from '../dates'
import type { TaskPriority, SessionType } from '../types'

interface ParsedTask {
  title: string
  time: string
  session: SessionType
  date: string
  priority: TaskPriority
  tags: string[]
}

const PRIORITY_KEYWORDS = {
  urgent: ['urgent', 'penting', 'darurat', 'mendesak', 'asap', 'segera'],
  high: ['high', 'tinggi', 'prio', 'prioritas'],
  low: ['low', 'rendah', 'santai', 'slow']
}

const TIME_KEYWORDS = {
  pagi: ['pagi', 'morning', 'subuh', 'fajar'],
  siang: ['siang', 'noon', 'afternoon', 'tengah hari'],
  sore: ['sore', 'evening', 'petang'],
  malam: ['malam', 'night', 'maghrib', 'isya']
}

const DATE_KEYWORDS = {
  today: ['hari ini', 'today', 'sekarang', 'now'],
  tomorrow: ['besok', 'tomorrow', 'esok'],
  dayAfterTomorrow: ['lusa', 'day after tomorrow']
}

export function parseNaturalLanguage(input: string): Partial<ParsedTask> {
  const result: Partial<ParsedTask> = {
    title: input.trim(),
    date: getTodayDate(),
    time: '09:00',
    session: 'pagi',
    priority: 'medium',
    tags: []
  }

  const lowerInput = input.toLowerCase()

  // Extract time
  const timeMatch = lowerInput.match(/(\d{1,2})[:\.]?(\d{2})?\s?(am|pm|pagi|siang|sore|malam)?/i)
  if (timeMatch) {
    let hour = parseInt(timeMatch[1])
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0
    const period = timeMatch[3]?.toLowerCase()

    if (period === 'pm' && hour < 12) hour += 12
    if (period === 'am' && hour === 12) hour = 0
    
    if (period === 'pagi' && hour < 12 && hour > 6) hour = hour
    if (period === 'siang' && hour < 12) hour += 12
    if (period === 'sore' && hour < 18) hour = hour + 12
    if (period === 'malam' && hour < 24) hour = hour > 12 ? hour : hour + 12

    result.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    result.session = getSessionFromTime(result.time)
    
    // Remove time from title
    result.title = input.replace(timeMatch[0], '').trim()
  } else {
    // Check for time-of-day keywords
    for (const [session, keywords] of Object.entries(TIME_KEYWORDS)) {
      if (keywords.some(kw => lowerInput.includes(kw))) {
        switch (session) {
          case 'pagi':
            result.time = '08:00'
            result.session = 'pagi'
            break
          case 'siang':
            result.time = '13:00'
            result.session = 'siang'
            break
          case 'sore':
            result.time = '17:00'
            result.session = 'sore'
            break
          case 'malam':
            result.time = '20:00'
            result.session = 'malam'
            break
        }
        break
      }
    }
  }

  // Extract date
  for (const [key, keywords] of Object.entries(DATE_KEYWORDS)) {
    if (keywords.some(kw => lowerInput.includes(kw))) {
      const today = new Date()
      switch (key) {
        case 'tomorrow':
          today.setDate(today.getDate() + 1)
          break
        case 'dayAfterTomorrow':
          today.setDate(today.getDate() + 2)
          break
      }
      result.date = today.toISOString().split('T')[0]
      
      // Remove date keywords from title
      keywords.forEach(kw => {
        result.title = result.title?.replace(new RegExp(kw, 'gi'), '').trim()
      })
      break
    }
  }

  // Extract priority
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some(kw => lowerInput.includes(kw))) {
      result.priority = priority as TaskPriority
      
      // Remove priority keywords from title
      keywords.forEach(kw => {
        result.title = result.title?.replace(new RegExp(kw, 'gi'), '').trim()
      })
      break
    }
  }

  // Extract tags (words starting with #)
  const tagMatches = input.match(/#[\w]+/g)
  if (tagMatches) {
    result.tags = tagMatches.map(tag => tag.substring(1))
    // Remove tags from title
    result.title = result.title?.replace(/#[\w]+/g, '').trim()
  }

  // Clean up title - remove extra spaces and special characters at the start
  result.title = result.title
    ?.replace(/^[\s,\-:]+/, '')
    .replace(/[\s,\-:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim() || input.trim()

  return result
}

// Examples:
// "Meeting dengan tim besok jam 9 pagi" → { title: "Meeting dengan tim", time: "09:00", date: tomorrow }
// "Urgent: Review dokumen sore ini" → { title: "Review dokumen", priority: "urgent", time: "17:00" }
// "Beli groceries #shopping malam ini jam 8" → { title: "Beli groceries", tags: ["shopping"], time: "20:00" }
