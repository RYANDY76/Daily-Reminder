import type { Task, SessionType } from '../types'
import { getTodayDate } from '../dates'
import { getPomodoroSessionsRange, getLastNDaysHistory } from '../database'

export interface ProductivityPattern {
  hourScores: number[]
  sessionScores: Record<SessionType, number>
  averageFocusMinutes: number
  peakHour: number
  optimalStartHour: number
  optimalEndHour: number
}

export interface ScheduledTask {
  task: Task
  suggestedTime: string
  suggestedSession: SessionType
  estimatedMinutes: number
  reason: string
}

export interface DailyPlan {
  date: string
  scheduledTasks: ScheduledTask[]
  totalEstimatedMinutes: number
  confidence: 'high' | 'medium' | 'low'
}

const SESSION_HOURS: Record<SessionType, [number, number]> = {
  pagi: [6, 11],
  siang: [12, 14],
  sore: [15, 17],
  malam: [18, 22],
}

function getSessionForHour(hour: number): SessionType {
  if (hour < 12) return 'pagi'
  if (hour < 15) return 'siang'
  if (hour < 18) return 'sore'
  return 'malam'
}

function scoreByPriority(priority: string): number {
  if (priority === 'high') return 100
  if (priority === 'medium') return 60
  return 20
}

function scoreByUrgency(dueDate: string, today: string): number {
  if (!dueDate) return 0
  const diff = Math.max(0, Math.floor((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000))
  if (dueDate === today) return 80
  if (diff <= 1) return 60
  if (diff <= 3) return 40
  if (diff <= 7) return 20
  return 0
}

function formatTime(hour: number, minute = 0): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export async function analyzeProductivityPatterns(profileId: string): Promise<ProductivityPattern> {
  const today = getTodayDate()
  const d = new Date()
  d.setDate(d.getDate() - 28)
  const start = d.toISOString().split('T')[0]

  const [sessions, history] = await Promise.all([
    getPomodoroSessionsRange(profileId, start, today),
    getLastNDaysHistory(profileId, 28),
  ])

  const hourScores = new Array(24).fill(0)
  const hourCounts = new Array(24).fill(0)
  let totalFocusMinutes = 0
  let focusCount = 0

  for (const s of sessions) {
    if (s.type === 'work' && s.completed) {
      const hour = new Date(s.startedAt).getHours()
      const mins = s.duration / 60
      hourScores[hour] += mins
      hourCounts[hour]++
      totalFocusMinutes += mins
      focusCount++
    }
  }

  for (let i = 0; i < 24; i++) {
    if (hourCounts[i] > 0) {
      hourScores[i] = hourScores[i] / hourCounts[i]
    }
  }

  const historyByHour: number[] = new Array(24).fill(0)
  let historyCount = 0
  for (const h of history) {
    const score = h.completionPercentage || h.dailyProductivityScore
    if (score > 0) {
      const hour = 9
      historyByHour[hour] += score
      historyCount++
    }
  }

  for (let i = 0; i < 24; i++) {
    if (historyCount > 0) {
      const historyAvg = historyByHour[i] / Math.max(historyCount / 24, 1)
      hourScores[i] = Math.max(hourScores[i], historyAvg)
    }
  }

  const maxScore = Math.max(...hourScores, 1)
  const normalized = hourScores.map(s => s / maxScore)

  let peakHour = 9
  let peakScore = 0
  for (let i = 0; i < 24; i++) {
    if (normalized[i] > peakScore) {
      peakScore = normalized[i]
      peakHour = i
    }
  }

  const sessionScores: Record<SessionType, number> = { pagi: 0, siang: 0, sore: 0, malam: 0 }
  for (let i = 0; i < 24; i++) {
    const session = getSessionForHour(i)
    sessionScores[session] += normalized[i]
  }

  const sorted = Array.from({ length: 24 }, (_, i) => i).sort((a, b) => normalized[b] - normalized[a])
  const optimalStartHour = sorted[0] || 8
  const optimalEndHour = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.3))] || 12
  const averageFocusMinutes = focusCount > 0 ? Math.round(totalFocusMinutes / focusCount) : 25

  return {
    hourScores: normalized,
    sessionScores,
    averageFocusMinutes,
    peakHour,
    optimalStartHour: Math.min(optimalStartHour, optimalEndHour),
    optimalEndHour: Math.max(optimalStartHour, optimalEndHour),
  }
}

export async function generateDailyPlan(tasks: Task[], profileId: string): Promise<DailyPlan> {
  const pending = tasks.filter(t => !t.done && !t.snoozedUntil)
  if (pending.length === 0) {
    return { date: getTodayDate(), scheduledTasks: [], totalEstimatedMinutes: 0, confidence: 'high' }
  }

  const pattern = await analyzeProductivityPatterns(profileId)
  const today = getTodayDate()

  const scored = pending.map(task => {
    let score = scoreByPriority(task.priority)
    score += scoreByUrgency(task.dueDate, today)

    const taskHour = parseInt(task.time.split(':')[0], 10)
    const taskSession = getSessionForHour(taskHour)
    score += Math.round(pattern.sessionScores[taskSession] * 30)

    return { task, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const scheduled: ScheduledTask[] = []
  const usedHours = new Set<number>()

  const bestHours = Array.from({ length: 24 }, (_, i) => i)
    .sort((a, b) => pattern.hourScores[b] - pattern.hourScores[a])

  for (const { task, score } of scored) {
    const taskHour = parseInt(task.time.split(':')[0], 10)
    const taskSession = getSessionForHour(taskHour)
    const [sessionStart, sessionEnd] = SESSION_HOURS[taskSession]

    let bestHour = taskHour
    let reason = ''

    if (usedHours.has(taskHour)) {
      for (const h of bestHours) {
        if (!usedHours.has(h) && h >= sessionStart && h <= sessionEnd) {
          bestHour = h
          break
        }
      }
      if (usedHours.has(bestHour)) {
        for (let h = sessionStart; h <= sessionEnd; h++) {
          if (!usedHours.has(h)) { bestHour = h; break }
        }
      }
    }

    usedHours.add(bestHour)

    const estimated = task.subtasks && task.subtasks.length > 0
      ? Math.max(15, task.subtasks.length * 10 + 15)
      : pattern.averageFocusMinutes

    if (bestHour === taskHour) {
      reason = 'optimal'
    } else if (score >= 80) {
      reason = 'priority'
    } else {
      reason = 'balanced'
    }

    scheduled.push({
      task,
      suggestedTime: formatTime(bestHour),
      suggestedSession: getSessionForHour(bestHour),
      estimatedMinutes: estimated,
      reason,
    })
  }

  const totalEstimatedMinutes = scheduled.reduce((sum, s) => sum + s.estimatedMinutes, 0)
  const hasHistory = pattern.averageFocusMinutes !== 25
  const confidence = hasHistory ? 'high' : pending.length <= 3 ? 'high' : 'medium'

  return {
    date: today,
    scheduledTasks: scheduled,
    totalEstimatedMinutes,
    confidence,
  }
}

export async function suggestOptimalTime(
  priority: string,
  existingTasks: Task[],
  profileId: string,
): Promise<{ suggestedTime: string; suggestedSession: SessionType; reason: string }> {
  const pattern = await analyzeProductivityPatterns(profileId)
  const pendingToday = existingTasks.filter(t => !t.done)
  const usedHours = new Set(pendingToday.map(t => parseInt(t.time.split(':')[0], 10)))

  const currentHour = new Date().getHours()

  let bestHour = -1
  let bestScore = -1

  for (let h = currentHour; h < 23; h++) {
    if (usedHours.has(h)) continue
    const session = getSessionForHour(h)
    let score = pattern.hourScores[h] * 50
    score += pattern.sessionScores[session] * 20
    if (priority === 'high') score += 20
    if (score > bestScore) {
      bestScore = score
      bestHour = h
    }
  }

  if (bestHour === -1) {
    for (let h = 6; h < 23; h++) {
      if (usedHours.has(h)) continue
      bestHour = h
      break
    }
  }

  if (bestHour === -1) {
    bestHour = currentHour + 1
  }

  const suggestedSession = getSessionForHour(bestHour)
  const isPeak = pattern.hourScores[bestHour] >= 0.7
  const reason = isPeak ? 'peak' : 'available'

  return {
    suggestedTime: formatTime(bestHour),
    suggestedSession,
    reason,
  }
}
