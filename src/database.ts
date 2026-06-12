import Dexie, { type EntityTable } from 'dexie'
import type { Task, Profile, DailyHistory, Habit, MoodLog, PomodoroSession, Goal } from './types'
import type { CoupleConnection, SharedTask, CoupleGoal, LoveNote, ActivityFeedItem, TaskComment } from './types-couple'
import { AppErrorHandler } from './utils/errorHandler'
import { encryptToken, decryptToken } from './crypto'

class DailyReminderDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  profiles!: EntityTable<Profile, 'id'>
  history!: EntityTable<DailyHistory, 'id'>
  habits!: EntityTable<Habit, 'id'>
  moodLogs!: EntityTable<MoodLog, 'id'>
  pomodoroSessions!: EntityTable<PomodoroSession, 'id'>
  goals!: EntityTable<Goal, 'id'>
  
  // Couple stores
  connections!: EntityTable<CoupleConnection, 'id'>
  sharedTasks!: EntityTable<SharedTask, 'id'>
  coupleGoals!: EntityTable<CoupleGoal, 'id'>
  loveNotes!: EntityTable<LoveNote, 'id'>
  activityFeed!: EntityTable<ActivityFeedItem, 'id'>
  taskComments!: EntityTable<TaskComment, 'id'>

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
    this.version(7).stores({
      tasks: 'id, profileId, date, session, done, recurringId, sortOrder',
      profiles: 'id, name, googleId, supabaseUserId',
      history: 'id, profileId, date',
      habits: 'id, profileId',
      moodLogs: 'id, profileId, date',
      pomodoroSessions: 'id, profileId, date, taskId',
      goals: 'id, profileId',
      connections: 'id, profile1Id, profile2Id, inviteCode',
      sharedTasks: 'id, coupleId, date, sharedWith',
      coupleGoals: 'id, coupleId, completed',
      loveNotes: 'id, coupleId, toProfileId, taskId',
      activityFeed: 'id, coupleId, timestamp',
      taskComments: 'id, coupleId, taskId'
    })
  }
}

export const db = new DailyReminderDB()

// Request persistent storage to protect database from being cleared automatically by the browser
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (!persistent && import.meta.env.DEV) {
      console.warn('[Storage] Dexie IndexedDB might be evicted under storage pressure.')
    }
  }).catch(() => {})
}

async function dbCall<T>(fn: () => Promise<T>, fallback: T, context?: string): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    AppErrorHandler.logError('DB_ERROR', `${context || 'unknown'}: ${error.message}`, 'high', { error })
    return fallback
  }
}

export async function saveTask(task: Task): Promise<void> {
  return dbCall(() => db.tasks.put(task).then(), undefined, 'saveTask')
}

export async function getTasksForDate(profileId: string, date: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where({ profileId, date }).toArray(),
    [],
    'getTasksForDate'
  )
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  return dbCall(() => db.tasks.get(id), undefined, 'getTaskById')
}

export async function deleteTask(id: string): Promise<void> {
  return dbCall(() => db.tasks.delete(id).then(), undefined, 'deleteTask')
}

export async function getAllTasksForProfile(profileId: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where('profileId').equals(profileId).toArray(),
    [],
    'getAllTasksForProfile'
  )
}

export async function getTasksForDateRange(profileId: string, startDate: string, endDate: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where({ profileId }).filter(t => t.date >= startDate && t.date <= endDate).toArray(),
    [],
    'getTasksForDateRange'
  )
}

export async function getRecurringTasks(profileId: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where({ profileId }).filter(t => t.isRecurring && t.recurring !== null).toArray(),
    [],
    'getRecurringTasks'
  )
}

export async function getTasksByRecurringId(recurringId: string): Promise<Task[]> {
  return dbCall(
    () => db.tasks.where('recurringId').equals(recurringId).toArray(),
    [],
    'getTasksByRecurringId'
  )
}

export async function saveProfile(profile: Profile): Promise<void> {
  const toSave = { ...profile }
  if (toSave.googleAccessToken) {
    toSave.googleAccessToken = await encryptToken(toSave.googleAccessToken)
  }
  if (toSave.googleRefreshToken) {
    toSave.googleRefreshToken = await encryptToken(toSave.googleRefreshToken)
  }
  return dbCall(() => db.profiles.put(toSave).then(), undefined, 'saveProfile')
}

async function decryptProfile(profile: Profile | undefined): Promise<Profile | undefined> {
  if (!profile) return profile
  return {
    ...profile,
    googleAccessToken: profile.googleAccessToken ? await decryptToken(profile.googleAccessToken) : null,
    googleRefreshToken: profile.googleRefreshToken ? await decryptToken(profile.googleRefreshToken) : null,
  }
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const profile = await dbCall(() => db.profiles.get(id), undefined, 'getProfile')
  return decryptProfile(profile)
}

export async function getProfileByGoogleId(googleId: string): Promise<Profile | undefined> {
  const profile = await dbCall(
    () => db.profiles.where('googleId').equals(googleId).first(),
    undefined,
    'getProfileByGoogleId'
  )
  return decryptProfile(profile)
}

export async function getProfileBySupabaseId(supabaseUserId: string): Promise<Profile | undefined> {
  const profile = await dbCall(
    () => db.profiles.where('supabaseUserId').equals(supabaseUserId).first(),
    undefined,
    'getProfileBySupabaseId'
  )
  return decryptProfile(profile)
}

export async function getAllProfiles(): Promise<Profile[]> {
  const profiles = await dbCall(() => db.profiles.toArray(), [], 'getAllProfiles')
  return Promise.all(profiles.map(p => decryptProfile(p).then(r => r!)))
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
    undefined,
    'deleteProfile'
  )
}

export async function saveDailyHistory(history: DailyHistory): Promise<void> {
  return dbCall(
    () => db.history.put({ ...history, id: `${history.profileId}_${history.date}` }).then(),
    undefined,
    'saveDailyHistory'
  )
}

function dateToStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export async function getDailyHistory(profileId: string, date: string): Promise<DailyHistory | undefined> {
  return dbCall(
    () => db.history.where('profileId').equals(profileId).filter(h => h.date === date).first(),
    undefined,
    'getDailyHistory'
  )
}

export async function getHistoryRange(profileId: string, startDate: string, endDate: string): Promise<DailyHistory[]> {
  return dbCall(
    () => db.history.where({ profileId }).filter(h => h.date >= startDate && h.date <= endDate).toArray(),
    [],
    'getHistoryRange'
  )
}

export async function getLast7DaysHistory(profileId: string): Promise<DailyHistory[]> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  return getHistoryRange(profileId, dateToStr(start), dateToStr(end))
}

export async function getLastNDaysHistory(profileId: string, n: number): Promise<DailyHistory[]> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (n - 1))
  return getHistoryRange(profileId, dateToStr(start), dateToStr(end))
}

export async function saveHabit(habit: Habit): Promise<void> {
  await dbCall(async () => { await db.habits.put(habit) }, undefined, 'saveHabit')
}

export async function getHabitsForProfile(profileId: string): Promise<Habit[]> {
  return dbCall(async () => {
    return await db.habits.where('profileId').equals(profileId).toArray()
  }, [], 'getHabitsForProfile')
}

export async function deleteHabit(id: string): Promise<void> {
  await dbCall(async () => { await db.habits.delete(id) }, undefined, 'deleteHabit')
}

// ─── Mood Logs ────────────────────────────────────────────────────────────────

export async function saveMoodLog(log: MoodLog): Promise<void> {
  return dbCall(() => db.moodLogs.put(log).then(), undefined, 'saveMoodLog')
}

export async function getMoodLog(profileId: string, date: string): Promise<MoodLog | undefined> {
  return dbCall(
    () => db.moodLogs.where({ profileId }).filter(m => m.date === date).first(),
    undefined,
    'getMoodLog'
  )
}

// ─── Pomodoro Sessions ────────────────────────────────────────────────────────

export async function savePomodoroSession(session: PomodoroSession): Promise<void> {
  return dbCall(() => db.pomodoroSessions.put(session).then(), undefined, 'savePomodoroSession')
}

export async function getPomodoroSessionsRange(profileId: string, startDate: string, endDate: string): Promise<PomodoroSession[]> {
  return dbCall(
    () => db.pomodoroSessions.where({ profileId }).filter(s => s.date >= startDate && s.date <= endDate).toArray(),
    [],
    'getPomodoroSessionsRange'
  )
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function saveGoal(goal: Goal): Promise<void> {
  return dbCall(() => db.goals.put(goal).then(), undefined, 'saveGoal')
}

export async function getGoalsForProfile(profileId: string): Promise<Goal[]> {
  return dbCall(
    () => db.goals.where('profileId').equals(profileId).toArray(),
    [],
    'getGoalsForProfile'
  )
}

export async function deleteGoal(id: string): Promise<void> {
  return dbCall(() => db.goals.delete(id).then(), undefined, 'deleteGoal')
}


