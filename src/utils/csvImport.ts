import { saveTask } from '../database'
import { getSessionFromTime, getTodayDate } from '../dates'
import type { Task, TaskPriority } from '../types'

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

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const title = cols[titleIdx]?.trim()
    if (!title) { skipped++; continue }

    const date = dateIdx >= 0 ? cols[dateIdx] || getTodayDate() : getTodayDate()
    const time = timeIdx >= 0 ? cols[timeIdx] || '09:00' : '09:00'
    const priority = (priorityIdx >= 0 ? cols[priorityIdx] : 'medium') as TaskPriority

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
        googleEventId: null,
        syncedToGoogle: false,
        snoozedUntil: null
      }
      await saveTask(task)
      imported++
    } catch (err) {
      errors.push(`Baris ${i + 1}: ${(err as Error).message}`)
      skipped++
    }
  }

  return { imported, skipped, errors }
}
