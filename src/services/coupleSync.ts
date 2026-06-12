/**
 * Cloud sync for couple features via Supabase.
 * Configure via .env or Settings → Supabase.
 */

import type { CoupleConnection, CoupleGoal, LoveNote, ActivityFeedItem, SharedTask, TaskComment } from '../types-couple'
import { isSupabaseConfigured } from '../lib/supabaseConfig'
import { getSupabase } from '../lib/supabase'
import {
  isValidCoupleId,
  isValidProfileId,
  isValidString,
  isValidInviteCode,
  sanitizeString,
  validateCoupleConnection,
  validateCoupleData
} from '../utils/validation'
import { AppErrorHandler } from '../utils/errorHandler'

export function isCoupleSyncEnabled(): boolean {
  return isSupabaseConfigured()
}

async function getAuthUserId(): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return null

  const { data, error } = await sb.auth.getUser()
  if (error) {
    AppErrorHandler.logError('COUPLE_SYNC_AUTH', error.message, 'low')
    return null
  }
  return data.user?.id ?? null
}

function toRow(conn: CoupleConnection, authUserId?: string | null) {
  return {
    id: conn.id,
    invite_code: conn.inviteCode || null,
    ...(authUserId ? { auth_user1_id: authUserId } : {}),
    profile1_id: conn.profile1Id,
    profile1_name: sanitizeString(conn.profile1Name, 100),
    profile2_id: conn.profile2Id || null,
    profile2_name: conn.profile2Name ? sanitizeString(conn.profile2Name, 100) : null,
    status: conn.status,
    connected_at: conn.connectedAt,
    points: conn.points || 0,
    level: conn.level || 1
  }
}

function fromRow(row: Record<string, unknown>): CoupleConnection {
  return {
    id: row.id as string,
    inviteCode: (row.invite_code as string) || undefined,
    profile1Id: row.profile1_id as string,
    profile1Name: row.profile1_name as string,
    profile2Id: (row.profile2_id as string) || '',
    profile2Name: (row.profile2_name as string) || '',
    status: row.status as CoupleConnection['status'],
    connectedAt: row.connected_at as number,
    points: (row.points as number) || 0,
    level: (row.level as number) || 1
  }
}

export async function syncCreateConnection(conn: CoupleConnection): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  const authUserId = await getAuthUserId()
  if (!authUserId) {
    AppErrorHandler.logError('COUPLE_SYNC_CREATE', 'login required for cloud couple sync', 'low')
    return
  }

  // Validate before write
  const validationError = validateCoupleConnection({
    id: conn.id,
    inviteCode: conn.inviteCode,
    profile1Id: conn.profile1Id,
    profile1Name: conn.profile1Name,
    status: conn.status
  })
  if (validationError) {
    AppErrorHandler.logError('COUPLE_SYNC_CREATE_VALIDATION', `create validation failed: ${validationError}`, 'medium')
    return
  }

  const { error } = await sb.from('couple_connections').insert(toRow(conn, authUserId))
  if (error) AppErrorHandler.logError('COUPLE_SYNC_CREATE', error.message, 'low')
}

export async function syncJoinConnection(
  inviteCode: string,
  profile2Id: string,
  profile2Name: string
): Promise<CoupleConnection | null> {
  const sb = getSupabase()
  if (!sb) return null
  const authUserId = await getAuthUserId()
  if (!authUserId) {
    AppErrorHandler.logError('COUPLE_SYNC_JOIN', 'login required for cloud couple sync', 'low')
    return null
  }

  // Validate inputs
  if (!isValidInviteCode(inviteCode)) {
    AppErrorHandler.logError('COUPLE_SYNC_JOIN', 'invalid invite code', 'medium')
    return null
  }
  if (!isValidProfileId(profile2Id)) {
    AppErrorHandler.logError('COUPLE_SYNC_JOIN', 'invalid profile2 ID', 'medium')
    return null
  }
  if (!isValidString(profile2Name, 100)) {
    AppErrorHandler.logError('COUPLE_SYNC_JOIN', 'invalid profile2 name', 'medium')
    return null
  }

  const { data: rows, error: findErr } = await sb
    .rpc('lookup_by_invite_code', { code: inviteCode })

  if (findErr || !rows?.length) return null

  const { data: updated, error: updateErr } = await sb
    .from('couple_connections')
    .update({
      auth_user2_id: authUserId,
      profile2_id: profile2Id,
      profile2_name: sanitizeString(profile2Name, 100),
      status: 'active',
      invite_code: null
    })
    .eq('id', rows[0].id)
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')
    .select()
    .single()

  if (updateErr || !updated) return null
  return fromRow(updated)
}

export async function syncGetConnectionByProfile(profileId: string): Promise<CoupleConnection | null> {
  const sb = getSupabase()
  if (!sb) return null

  // Validate profileId
  if (!isValidProfileId(profileId)) {
    AppErrorHandler.logError('COUPLE_SYNC_GET', 'invalid profile ID', 'low')
    return null
  }

  const queries = [
    () => sb.from('couple_connections').select('*').eq('profile1_id', profileId).eq('status', 'active').maybeSingle(),
    () => sb.from('couple_connections').select('*').eq('profile2_id', profileId).eq('status', 'active').maybeSingle(),
    () => sb.from('couple_connections').select('*').eq('profile1_id', profileId).eq('status', 'pending').maybeSingle()
  ]

  for (const run of queries) {
    const { data } = await run()
    if (data) return fromRow(data)
  }
  return null
}

export async function syncUpdateConnectionGamification(connectionId: string, points: number, level: number): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  if (!isValidString(connectionId, 100)) return

  const { error } = await sb
    .from('couple_connections')
    .update({ points, level })
    .eq('id', connectionId)

  if (error) AppErrorHandler.logError('COUPLE_SYNC_GAMIFICATION', error.message, 'low')
}

export async function syncDeleteConnection(connectionId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  if (!isValidString(connectionId, 100)) {
    AppErrorHandler.logError('COUPLE_SYNC_DELETE', 'invalid connection ID', 'medium')
    return
  }

  await Promise.all([
    sb.from('couple_goals').delete().eq('couple_id', connectionId),
    sb.from('couple_love_notes').delete().eq('couple_id', connectionId),
    sb.from('couple_activity').delete().eq('couple_id', connectionId),
    sb.from('couple_shared_tasks').delete().eq('couple_id', connectionId),
    sb.from('couple_task_comments').delete().eq('couple_id', connectionId)
  ])

  await sb.from('couple_connections').delete().eq('id', connectionId)
}

async function upsertEntity(table: string, id: string, coupleId: string, data: unknown): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  // Validate before every write
  const validationError = validateCoupleData({ id, coupleId, data, updatedAt: Date.now() })
  if (validationError) {
    AppErrorHandler.logError(`COUPLE_SYNC_${table.toUpperCase()}`, `${table} validation failed: ${validationError}`, 'medium')
    return
  }

  const { error } = await sb.from(table).upsert({ id, couple_id: coupleId, data, updated_at: Date.now() })
  if (error) AppErrorHandler.logError(`COUPLE_SYNC_${table.toUpperCase()}`, error.message, 'low')
}

export async function syncGoal(goal: CoupleGoal): Promise<void> {
  await upsertEntity('couple_goals', goal.id, goal.coupleId, goal)
}

export async function syncDeleteGoal(goalId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  if (!isValidString(goalId, 100)) {
    AppErrorHandler.logError('COUPLE_SYNC_DELETE_GOAL', 'invalid goal ID', 'medium')
    return
  }

  await sb.from('couple_goals').delete().eq('id', goalId)
}

export async function syncLoveNote(note: LoveNote): Promise<void> {
  await upsertEntity('couple_love_notes', note.id, note.coupleId, note)
}

export async function syncActivity(item: ActivityFeedItem): Promise<void> {
  await upsertEntity('couple_activity', item.id, item.coupleId, item)
}

export async function syncSharedTask(task: SharedTask, coupleId: string): Promise<void> {
  await upsertEntity('couple_shared_tasks', task.id, coupleId, task)
}

export async function syncTaskComment(comment: TaskComment): Promise<void> {
  await upsertEntity('couple_task_comments', comment.id, comment.coupleId, comment)
}

export async function pullCoupleData(coupleId: string): Promise<{
  goals: CoupleGoal[]
  loveNotes: LoveNote[]
  activity: ActivityFeedItem[]
  sharedTasks: SharedTask[]
  taskComments: TaskComment[]
}> {
  const sb = getSupabase()
  if (!sb) return { goals: [], loveNotes: [], activity: [], sharedTasks: [], taskComments: [] }

  // Validate coupleId before querying
  if (!isValidCoupleId(coupleId)) {
    AppErrorHandler.logError('COUPLE_SYNC_PULL', 'invalid couple ID', 'medium')
    return { goals: [], loveNotes: [], activity: [], sharedTasks: [], taskComments: [] }
  }

  const [goalsRes, notesRes, activityRes, tasksRes, commentsRes] = await Promise.all([
    sb.from('couple_goals').select('data').eq('couple_id', coupleId),
    sb.from('couple_love_notes').select('data').eq('couple_id', coupleId),
    sb.from('couple_activity').select('data').eq('couple_id', coupleId).order('updated_at', { ascending: false }).limit(100),
    sb.from('couple_shared_tasks').select('data').eq('couple_id', coupleId),
    sb.from('couple_task_comments').select('data').eq('couple_id', coupleId)
  ])

  return {
    goals: goalsRes.data?.map(r => r.data as CoupleGoal) || [],
    loveNotes: notesRes.data?.map(r => r.data as LoveNote) || [],
    activity: activityRes.data?.map(r => r.data as ActivityFeedItem) || [],
    sharedTasks: tasksRes.data?.map(r => r.data as SharedTask) || [],
    taskComments: commentsRes.data?.map(r => r.data as TaskComment) || []
  }
}
