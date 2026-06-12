import type { Table } from 'dexie'
import { db } from '../database'
import { getSupabase } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useProfileStore } from '../stores/useProfileStore'
import type { DailyHistory, Goal, Habit, MoodLog, PomodoroSession, Profile, Task } from '../types'

type SyncEntity = Profile | Task | DailyHistory | Habit | MoodLog | PomodoroSession | Goal

interface SyncTableConfig<T extends SyncEntity> {
  cloudTable: string
  localTable: Table<T, string>
  getRows: (profileId: string) => Promise<T[]>
}

const syncTables: SyncTableConfig<SyncEntity>[] = [
  {
    cloudTable: 'app_profiles',
    localTable: db.profiles as Table<Profile, string>,
    getRows: async (profileId) => {
      const profile = await db.profiles.get(profileId)
      return profile ? [profile] : []
    }
  },
  {
    cloudTable: 'app_tasks',
    localTable: db.tasks as Table<Task, string>,
    getRows: (profileId) => db.tasks.where('profileId').equals(profileId).toArray()
  },
  {
    cloudTable: 'app_daily_history',
    localTable: db.history as Table<DailyHistory, string>,
    getRows: (profileId) => db.history.where('profileId').equals(profileId).toArray()
  },
  {
    cloudTable: 'app_habits',
    localTable: db.habits as Table<Habit, string>,
    getRows: (profileId) => db.habits.where('profileId').equals(profileId).toArray()
  },
  {
    cloudTable: 'app_mood_logs',
    localTable: db.moodLogs as Table<MoodLog, string>,
    getRows: (profileId) => db.moodLogs.where('profileId').equals(profileId).toArray()
  },
  {
    cloudTable: 'app_pomodoro_sessions',
    localTable: db.pomodoroSessions as Table<PomodoroSession, string>,
    getRows: (profileId) => db.pomodoroSessions.where('profileId').equals(profileId).toArray()
  },
  {
    cloudTable: 'app_goals',
    localTable: db.goals as Table<Goal, string>,
    getRows: (profileId) => db.goals.where('profileId').equals(profileId).toArray()
  }
]

function getEntityUpdatedAt(entity: SyncEntity): number {
  const maybeUpdated = (entity as { updatedAt?: number; createdAt?: number }).updatedAt
  if (typeof maybeUpdated === 'number') return maybeUpdated
  const maybeCreated = (entity as { createdAt?: number }).createdAt
  return typeof maybeCreated === 'number' ? maybeCreated : Date.now()
}

function getActiveSyncContext() {
  const sb = getSupabase()
  const user = useAuthStore.getState().user
  const profile = useProfileStore.getState().currentProfile
  if (!sb) throw new Error('Supabase not configured')
  if (!user) throw new Error('Please login to cloud first')
  if (!profile) throw new Error('No profile selected')
  return { sb, user, profile }
}

export async function pushCurrentProfileToCloud(): Promise<number> {
  const { sb, user, profile } = getActiveSyncContext()
  let pushed = 0

  for (const config of syncTables) {
    const rows = await config.getRows(profile.id)
    if (rows.length === 0) continue

    const payload = rows.map((row) => ({
      id: row.id,
      profile_id: profile.id,
      auth_user_id: user.id,
      data: row,
      updated_at: getEntityUpdatedAt(row)
    }))

    const { error } = await sb.from(config.cloudTable).upsert(payload, { onConflict: 'id' })
    if (error) throw error
    pushed += payload.length
  }

  await useProfileStore.getState().updateProfile({ lastSyncAt: Date.now() })
  return pushed
}

export async function pullCurrentProfileFromCloud(): Promise<number> {
  const { sb, profile } = getActiveSyncContext()
  let pulled = 0

  for (const config of syncTables) {
    const { data, error } = await sb
      .from(config.cloudTable)
      .select('id, data, updated_at')
      .eq('profile_id', profile.id)

    if (error) throw error
    if (!data) continue

    for (const row of data) {
      const remote = row.data as SyncEntity
      const local = await config.localTable.get(row.id)
      const localUpdatedAt = local ? getEntityUpdatedAt(local) : 0
      const remoteUpdatedAt = typeof row.updated_at === 'number' ? row.updated_at : getEntityUpdatedAt(remote)

      if (!local || remoteUpdatedAt >= localUpdatedAt) {
        await config.localTable.put(remote as never)
        pulled++
      }
    }
  }

  await useProfileStore.getState().updateProfile({ lastSyncAt: Date.now() })
  return pulled
}

export async function syncCurrentProfileBidirectional(): Promise<{ pushed: number; pulled: number }> {
  const pushed = await pushCurrentProfileToCloud()
  const pulled = await pullCurrentProfileFromCloud()
  return { pushed, pulled }
}
