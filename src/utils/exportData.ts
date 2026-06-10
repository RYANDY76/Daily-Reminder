import type { Task } from '../types'
import { t } from '../i18n'

export function exportToCSV(tasks: Task[]): void {
  const headers = [t('export.title'), t('export.time'), t('export.session'), t('export.priority'), t('export.tag'), t('export.deadline'), t('export.date'), t('export.status'), t('export.notes'), t('export.color')]
  const rows = tasks.map(task => [
    escapeCSV(task.title),
    task.time,
    task.session,
    task.priority || 'medium',
    (task.tags || []).join('; '),
    task.dueDate || '',
    task.date,
    task.done ? t('export.completed') : t('export.notCompleted'),
    escapeCSV(task.notes || ''),
    task.color
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadFile(csv, `daily-reminder-${tasks[0]?.date || 'data'}.csv`, 'text/csv')
}

export function exportToJSON(tasks: Task[]): void {
  const data = tasks.map(task => ({
    judul: task.title,
    waktu: task.time,
    sesi: task.session,
    prioritas: task.priority || 'medium',
    tags: task.tags || [],
    deadline: task.dueDate || null,
    tanggal: task.date,
    selesai: task.done,
    catatan: task.notes || null,
    warna: task.color
  }))
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, `daily-reminder-${tasks[0]?.date || 'data'}.json`, 'application/json')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
