import Dexie, { type EntityTable } from 'dexie'
import type { Task, Profile, DailyHistory, Habit, MoodLog, PomodoroSession, Goal } from './types'

class DailyReminderDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  profiles!: EntityTable<Profile, 'id'>
  history!: EntityTable<DailyHistory, 'id'>
  habits!: EntityTable<Habit, 'id'>
  moodLogs!: EntityTable<MoodLog, 'id'>
  pomodoroSessions!: EntityTable<PomodoroSession, 'id'>
  goals!: EntityTable<Goal, 'id'>

  constructor() {
    super('DailyReminderDB')
    this.version(5).stores({
      tasks: 'id, profileId, date, session, done, recurringId, sortOrder',
      profiles: 'id, name, googleId',
      history: 'id, profileId, date',
      habits: 'id, profileId'
    })
    this.version(6).stores({
      tasks: 'id, profileId, date, session, done, recurringId, sortOrder',
      profiles: 'id, name, googleId',
      history: 'id, profileId, date',
      habits: 'id, profileId',
      moodLogs: 'id, profileId, date',
      pomodoroSessions: 'id, profileId, date, taskId',
      goals: 'id, profileId'
    })
  }
}

export const db = new DailyReminderDB()

async function dbCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.error('DB error:', err)
    return fallback
  }
}

export async function saveTask(task: Task): Promise<void> {
  return dbCall(() => db.tasks.put(task).then(), undefined)
}

export async function getTasksForDate(profileId: string, date: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where({ profileId, date }).toArray(),
    []
  )
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  return dbCall(() => db.tasks.get(id), undefined)
}

export async function deleteTask(id: string): Promise<void> {
  return dbCall(() => db.tasks.delete(id).then(), undefined)
}

export async function getAllTasksForProfile(profileId: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where('profileId').equals(profileId).toArray(),
    []
  )
}

export async function getTasksForDateRange(profileId: string, startDate: string, endDate: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where({ profileId }).filter(t => t.date >= startDate && t.date <= endDate).toArray(),
    []
  )
}

export async function getRecurringTasks(profileId: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where({ profileId }).filter(t => t.isRecurring && t.recurring !== null).toArray(),
    []
  )
}

export async function getTasksByRecurringId(recurringId: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where('recurringId').equals(recurringId).toArray(),
    []
  )
}

export async function saveProfile(profile: Profile): Promise<void> {
  return dbCall(() => db.profiles.put(profile).then(), undefined)
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  return dbCall(() => db.profiles.get(id), undefined)
}

export async function getProfileByGoogleId(googleId: string): Promise<Profile | undefined> {
  return dbCall(
    () => db.profiles.where('googleId').equals(googleId).first(),
    undefined
  )
}

export async function getAllProfiles(): Promise<Profile[]> {
  return dbCall(() => db.profiles.toArray(), [])
}

export async function deleteProfile(id: string): Promise<void> {
  return dbCall(
    async () => {
      // First transaction
      await db.transaction('rw', db.tasks, db.history, db.habits, db.moodLogs, async () => {
        await db.tasks.where('profileId').equals(id).delete()
        await db.history.where('profileId').equals(id).delete()
        await db.habits.where('profileId').equals(id).delete()
        await db.moodLogs.where('profileId').equals(id).delete()
      })
      
      // Second transaction
      await db.transaction('rw', db.pomodoroSessions, db.goals, db.profiles, async () => {
        await db.pomodoroSessions.where('profileId').equals(id).delete()
        await db.goals.where('profileId').equals(id).delete()
        await db.profiles.delete(id)
      })
    },
    undefined
  )
}

export async function saveDailyHistory(history: DailyHistory): Promise<void> {
  return dbCall(
    () => db.history.put({ ...history, id: `${history.profileId}_${history.date}` }).then(),
    undefined
  )
}

export async function getDailyHistory(profileId: string, date: string): Promise<DailyHistory | undefined> {
  return dbCall(
    () => db.history.where('profileId').equals(profileId).filter(h => h.date === date).first(),
    undefined
  )
}

export async function getHistoryRange(profileId: string, startDate: string, endDate: string): Promise<DailyHistory[]> {
  return dbCall(
    () => db.history.where({ profileId }).filter(h => h.date >= startDate && h.date <= endDate).toArray(),
    []
  )
}

export async function getLast7DaysHistory(profileId: string): Promise<DailyHistory[]> {
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dbCall(
    async () => {
      const results = await Promise.all(dates.map(date => getDailyHistory(profileId, date)))
      return results.filter((h): h is DailyHistory => h !== undefined)
    },
    []
  )
}

export async function saveHabit(habit: Habit): Promise<void> {
  await dbCall(async () => { await db.habits.put(habit) }, undefined)
}

export async function getHabitsForProfile(profileId: string): Promise<Habit[]> {
  return dbCall(async () => {
    return await db.habits.where('profileId').equals(profileId).toArray()
  }, [])
}

export async function deleteHabit(id: string): Promise<void> {
  await dbCall(async () => { await db.habits.delete(id) }, undefined)
}

// ─── Mood Logs ────────────────────────────────────────────────────────────────

export async function saveMoodLog(log: MoodLog): Promise<void> {
  return dbCall(() => db.moodLogs.put(log).then(), undefined)
}

export async function getMoodLog(profileId: string, date: string): Promise<MoodLog | undefined> {
  return dbCall(
    () => db.moodLogs.where({ profileId }).filter(m => m.date === date).first(),
    undefined
  )
}

export async function getMoodLogsRange(profileId: string, startDate: string, endDate: string): Promise<MoodLog[]> {
  return dbCall(
    () => db.moodLogs.where({ profileId }).filter(m => m.date >= startDate && m.date <= endDate).toArray(),
    []
  )
}

// ─── Pomodoro Sessions ────────────────────────────────────────────────────────

export async function savePomodoroSession(session: PomodoroSession): Promise<void> {
  return dbCall(() => db.pomodoroSessions.put(session).then(), undefined)
}

export async function getPomodoroSessionsForProfile(profileId: string): Promise<PomodoroSession[]> {
  return dbCall(
    () => db.pomodoroSessions.where('profileId').equals(profileId).toArray(),
    []
  )
}

export async function getPomodoroSessionsRange(profileId: string, startDate: string, endDate: string): Promise<PomodoroSession[]> {
  return dbCall(
    () => db.pomodoroSessions.where({ profileId }).filter(s => s.date >= startDate && s.date <= endDate).toArray(),
    []
  )
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function saveGoal(goal: Goal): Promise<void> {
  return dbCall(() => db.goals.put(goal).then(), undefined)
}

export async function getGoalsForProfile(profileId: string): Promise<Goal[]> {
  return dbCall(
    () => db.goals.where('profileId').equals(profileId).toArray(),
    []
  )
}

export async function deleteGoal(id: string): Promise<void> {
  return dbCall(() => db.goals.delete(id).then(), undefined)
}

// ─── Extended History ─────────────────────────────────────────────────────────

export async function getLastNDaysHistory(profileId: string, n: number): Promise<DailyHistory[]> {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dbCall(
    async () => {
      const results = await Promise.all(dates.map(date => getDailyHistory(profileId, date)))
      return results.filter((h): h is DailyHistory => h !== undefined)
    },
    []
  )
}
