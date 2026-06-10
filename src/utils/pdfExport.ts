import { jsPDF } from 'jspdf'
import type { Task, SessionType, Profile, DailyHistory } from '../types'
import { SESSION_ORDER } from '../types'
import { formatDate, getTimeDisplay, getLast7Days } from '../dates'
import { t } from '../i18n'

export interface PDFOptions {
  scope: 'today' | 'weekly' | 'custom'
  startDate?: string
  endDate?: string
  orientation: 'portrait' | 'landscape'
  theme: 'standard' | 'compact'
}

export async function generatePDF(
  profile: Profile,
  tasks: Task[],
  history: DailyHistory[],
  options: PDFOptions
): Promise<void> {
  const { scope, startDate, endDate, orientation, theme } = options

  const doc = new jsPDF({
    orientation: orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: 'a4'
  })

  const pageW = orientation === 'landscape' ? 297 : 210
  const margin = 15
  const contentW = pageW - margin * 2
  let y = margin

  const isDark = theme === 'compact'
  const primaryColor = profile.accentColor || '#1D9E75'
  const textColor = isDark ? '#333333' : '#1A1A1A'
  const secondaryText = isDark ? '#666666' : '#6B6B6B'
  const bgColor = isDark ? '#F5F5F5' : '#FFFFFF'

  doc.setFillColor(isDark ? '#F0F0F0' : '#FFFFFF')
  doc.rect(0, 0, pageW, 297, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(primaryColor)
  doc.text('Daily Reminder', margin, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(secondaryText)
  doc.text(`Profil: ${profile.name}`, margin, y)
  y += 4
  const dateLabel = scope === 'today'
    ? formatDate(new Date().toISOString().split('T')[0])
    : scope === 'weekly'
      ? `${formatDate(getLast7Days()[0])} - ${formatDate(getLast7Days()[6])}`
      : `${formatDate(startDate || '')} - ${formatDate(endDate || '')}`
  doc.text(`Periode: ${dateLabel}`, margin, y)
  y += 4
  doc.text(`Diekspor: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y)
  y += 10

  doc.setDrawColor(primaryColor)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  const grouped = groupTasksBySessionAndDate(tasks)
  const sortedDates = Object.keys(grouped).sort()

  for (const dateStr of sortedDates) {
    if (y > 250) {
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(primaryColor)
    doc.text(formatDate(dateStr), margin, y)
    y += 6

    const sessions = grouped[dateStr]
    for (const session of SESSION_ORDER) {
      const sessionTasks = sessions[session] || []
      if (sessionTasks.length === 0) continue

      if (y > 260) {
        doc.addPage()
        y = margin
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(textColor)
      const doneCount = sessionTasks.filter(t => t.done).length
      doc.text(`${t('session.' + session)} (${doneCount}/${sessionTasks.length})`, margin + 3, y)
      y += 5

      for (const task of sessionTasks) {
        if (y > 265) {
          doc.addPage()
          y = margin
        }

        const statusSymbol = task.done ? '✓' : task.status === 'missed' ? '!' : '✗'
        const statusColor = task.done ? '#1D9E75' : task.status === 'missed' ? '#EF4444' : secondaryText
        const timeStr = getTimeDisplay(task.time)
        const recurringMark = task.isRecurring ? ' ↻' : ''

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(theme === 'compact' ? 8 : 9)
        doc.setTextColor(statusColor)
        doc.text(`${statusSymbol}`, margin + 3, y)
        doc.setTextColor(textColor)
        doc.text(`${timeStr}  ${task.title}${recurringMark}`, margin + 10, y)

        if (task.notes && theme === 'standard') {
          doc.setFontSize(7)
          doc.setTextColor(secondaryText)
          doc.text(`  ${task.notes}`, margin + 10, y + 3)
          y += 3
        }
        y += (task.notes && theme === 'standard') ? 7 : 5
      }
      y += 2
    }
    y += 4
  }

  if (history.length > 0) {
    if (y > 230) {
      doc.addPage()
      y = margin
    }

    y += 4
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageW - margin, y)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(primaryColor)
    doc.text('Ringkasan Statistik', margin, y)
    y += 8

    const totalDone = history.reduce((sum, h) => sum + h.tasksDone, 0)
    const totalTasks = history.reduce((sum, h) => sum + h.tasksTotal, 0)
    const avgCompletion = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(textColor)
    doc.text(`Total tugas diselesaikan: ${totalDone}`, margin, y)
    y += 5
    doc.text(`Rata-rata penyelesaian: ${avgCompletion}%`, margin, y)
    y += 5

    let bestDay: DailyHistory | null = null
    let bestRate = 0
    for (const h of history) {
      const rate = h.tasksTotal > 0 ? h.tasksDone / h.tasksTotal : 0
      if (rate > bestRate) {
        bestRate = rate
        bestDay = h
      }
    }
    if (bestDay) {
      doc.text(`Hari paling produktif: ${formatDate(bestDay.date)} (${Math.round(bestRate * 100)}%)`, margin, y)
      y += 5
    }

    let streak = 0
    for (const h of [...history].reverse()) {
      const rate = h.tasksTotal > 0 ? (h.tasksDone / h.tasksTotal) : 0
      if (rate >= 0.8) streak++
      else break
    }
    doc.text(`Streak produktif: ${streak} hari`, margin, y)
  }

  doc.save(`DailyReminder_${profile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
}

function groupTasksBySessionAndDate(tasks: Task[]): Record<string, Partial<Record<SessionType, Task[]>>> {
  const grouped: Record<string, Partial<Record<SessionType, Task[]>>> = {}
  for (const task of tasks) {
    if (!grouped[task.date]) grouped[task.date] = {}
    if (!grouped[task.date][task.session]) grouped[task.date][task.session] = []
    grouped[task.date][task.session]!.push(task)
  }
  return grouped
}
