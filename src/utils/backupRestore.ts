import { db } from '../database'
import { exportCoupleData, importCoupleData, type CoupleBackupData } from '../database-couple'
import type { Task, Profile, DailyHistory, Habit, MoodLog, PomodoroSession, Goal } from '../types'

export interface BackupData {
  version: number
  createdAt: string
  app: string
  profiles: Profile[]
  tasks: Task[]
  history: DailyHistory[]
  habits: Habit[]
  moodLogs: MoodLog[]
  pomodoroSessions: PomodoroSession[]
  goals: Goal[]
  couple?: CoupleBackupData
}

export async function exportBackup(): Promise<void> {
  const [profiles, tasks, history, habits, moodLogs, pomodoroSessions, goals, couple] = await Promise.all([
    db.profiles.toArray(),
    db.tasks.toArray(),
    db.history.toArray(),
    db.habits.toArray(),
    db.moodLogs.toArray(),
    db.pomodoroSessions.toArray(),
    db.goals.toArray(),
    exportCoupleData()
  ])

  const backup: BackupData = {
    version: 3,
    createdAt: new Date().toISOString(),
    app: 'daily-reminder',
    profiles,
    tasks,
    history,
    habits,
    moodLogs,
    pomodoroSessions,
    goals,
    couple
  }

  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `daily-reminder-backup-${date}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if (obj.app !== 'daily-reminder') return false
  if (typeof obj.version !== 'number') return false
  if (!Array.isArray(obj.profiles)) return false
  if (!Array.isArray(obj.tasks)) return false
  if (!Array.isArray(obj.history)) return false
  return true
}

export async function importBackup(data: BackupData, mode: 'merge' | 'replace'): Promise<{ profiles: number; tasks: number; history: number }> {
  let profilesImported = 0
  let tasksImported = 0
  let historyImported = 0

  if (mode === 'replace') {
    await db.tasks.clear()
    await db.profiles.clear()
    await db.history.clear()
    await db.habits.clear()
    await db.moodLogs.clear()
    await db.pomodoroSessions.clear()
    await db.goals.clear()
  }

  for (const profile of data.profiles) {
    await db.profiles.put(profile)
    profilesImported++
  }

  for (const task of data.tasks) {
    await db.tasks.put(task)
    tasksImported++
  }

  for (const h of data.history) {
    await db.history.put({ ...h, id: `${h.profileId}_${h.date}` })
    historyImported++
  }

  if (data.habits) {
    for (const habit of data.habits) await db.habits.put(habit)
  }
  if (data.moodLogs) {
    for (const log of data.moodLogs) await db.moodLogs.put(log)
  }
  if (data.pomodoroSessions) {
    for (const session of data.pomodoroSessions) await db.pomodoroSessions.put(session)
  }
  if (data.goals) {
    for (const goal of data.goals) await db.goals.put(goal)
  }
  if (data.couple) {
    await importCoupleData(data.couple, mode)
  }

  return { profiles: profilesImported, tasks: tasksImported, history: historyImported }
}

export function readFileAsJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string))
      } catch {
        reject(new Error('File bukan JSON valid'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsText(file)
  })
}
