import { saveTask } from '../database'
import { getSessionFromTime, getTodayDate } from '../dates'
import type { Task, TaskPriority } from '../types'

const MAX_ROWS = 5000
const MAX_FIELD_LENGTH = 500

function sanitizeField(value: string): string {
  return value.replace(/[\0\r\n]/g, ' ').trim().slice(0, MAX_FIELD_LENGTH)
}

export interface CsvImportResult {
  imported: number
  skipped: number
  errors: string[]
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else current += ch
  }
  result.push(current.trim())
  return result
}

export async function importTasksFromCsv(csvText: string, profileId: string): Promise<CsvImportResult> {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { imported: 0, skipped: 0, errors: ['CSV kosong atau tidak valid'] }

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
  const titleIdx = headers.findIndex(h => ['title', 'judul', 'task', 'tugas'].includes(h))
  const dateIdx = headers.findIndex(h => ['date', 'tanggal'].includes(h))
  const timeIdx = headers.findIndex(h => ['time', 'waktu', 'jam'].includes(h))
  const priorityIdx = headers.findIndex(h => ['priority', 'prioritas'].includes(h))

  if (titleIdx === -1) return { imported: 0, skipped: 0, errors: ['Kolom title/judul tidak ditemukan'] }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  const dataLines = lines.slice(1)
  if (dataLines.length > MAX_ROWS) {
    return { imported: 0, skipped: 0, errors: [`Maksimal ${MAX_ROWS} baris per import`] }
  }

  for (let i = 0; i < dataLines.length; i++) {
    const cols = parseCsvLine(dataLines[i])
    const title = sanitizeField(cols[titleIdx] || '')
    if (!title) { skipped++; continue }

    const date = dateIdx >= 0 ? sanitizeField(cols[dateIdx]) || getTodayDate() : getTodayDate()
    const time = timeIdx >= 0 ? sanitizeField(cols[timeIdx]) || '09:00' : '09:00'
    const priority = (priorityIdx >= 0 ? sanitizeField(cols[priorityIdx]) : 'medium') as TaskPriority

    try {
      const task: Task = {
        id: crypto.randomUUID(),
        profileId,
        title,
        time,
        session: getSessionFromTime(time),
        notes: '',
        color: '#1D9E75',
        done: false,
        status: 'pending',
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        tags: ['import'],
        dueDate: date,
        subtasks: [],
        timeTracking: null,
        recurring: null,
        isRecurring: false,
        recurringId: null,
        date,
        sortOrder: i,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        snoozedUntil: null
      }
      await saveTask(task)
      imported++
    } catch (err) {
      errors.push(`Baris ${i + 2}: ${(err as Error).message}`)
      skipped++
    }
  }

  return { imported, skipped, errors }
}
