import { getTodayDate } from '../dates'
import type { SessionType } from '../types'

interface ParsedTask {
  title: string
  time: string
  date: string
  session: SessionType
}

const TIME_PATTERNS = [
  { regex: /jam\s+(\d{1,2})[:.](\d{2})/i, handler: (m: RegExpMatchArray) => `${m[1].padStart(2, '0')}:${m[2]}` },
  { regex: /jam\s+(\d{1,2})/i, handler: (m: RegExpMatchArray) => `${m[1].padStart(2, '0')}:00` },
  { regex: /(\d{1,2})[:.](\d{2})\s*(pagi|siang|sore|malam)/i, handler: (m: RegExpMatchArray) => {
    let h = parseInt(m[1])
    const period = m[3].toLowerCase()
    if (period === 'sore' && h < 12) h += 12
    if (period === 'malam' && h < 12) h += 12
    return `${h.toString().padStart(2, '0')}:${m[2]}`
  }},
  { regex: /pukul\s+(\d{1,2})[:.](\d{2})/i, handler: (m: RegExpMatchArray) => `${m[1].padStart(2, '0')}:${m[2]}` },
  { regex: /pukul\s+(\d{1,2})/i, handler: (m: RegExpMatchArray) => `${m[1].padStart(2, '0')}:00` },
]

const DATE_PATTERNS = [
  { regex: /\bhari\s+ini\b/i, handler: () => getTodayDate() },
  { regex: /\bbesok\b/i, handler: () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }},
  { regex: /\blusa\b/i, handler: () => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  }},
  { regex: /\b(senin|selasa|rabu|kamis|jumat|sabtu|minggu)\b/i, handler: (m: RegExpMatchArray) => {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
    const target = days.indexOf(m[1].toLowerCase())
    const d = new Date()
    const current = d.getDay()
    let diff = target - current
    if (diff <= 0) diff += 7
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  }},
  { regex: /(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)/i, handler: (m: RegExpMatchArray) => {
    const months = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember']
    const month = months.indexOf(m[2].toLowerCase())
    const year = new Date().getFullYear()
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }},
]

function getSessionFromTime(time: string): SessionType {
  const h = parseInt(time.split(':')[0])
  if (h < 12) return 'pagi'
  if (h < 15) return 'siang'
  if (h < 18) return 'sore'
  return 'malam'
}

export function parseNaturalLanguage(input: string): ParsedTask {
  let title = input.trim()
  let time = '08:00'
  let date = getTodayDate()

  for (const pattern of TIME_PATTERNS) {
    const match = title.match(pattern.regex)
    if (match) {
      time = pattern.handler(match)
      title = title.replace(match[0], '').trim()
      break
    }
  }

  for (const pattern of DATE_PATTERNS) {
    const match = title.match(pattern.regex)
    if (match) {
      date = pattern.handler(match)
      title = title.replace(match[0], '').trim()
      break
    }
  }

  title = title.replace(/\s+/g, ' ').trim()

  return {
    title: title || 'Tugas baru',
    time,
    date,
    session: getSessionFromTime(time)
  }
}

export function hasTimeIndicator(input: string): boolean {
  return TIME_PATTERNS.some(p => p.regex.test(input))
}

export function hasDateIndicator(input: string): boolean {
  return DATE_PATTERNS.some(p => p.regex.test(input))
}
