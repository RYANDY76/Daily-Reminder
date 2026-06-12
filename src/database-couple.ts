/**
 * Couple-specific Database Functions
 * Consolidated into DailyReminderDB Dexie instance with automatic migration from old native IndexedDB
 */

import type { CoupleConnection, SharedTask, CoupleGoal, LoveNote, ActivityFeedItem, TaskComment } from './types-couple'
import { db } from './database'
import { recordAttempt, isRateLimited } from './utils/rateLimiter'
import {
  isCoupleSyncEnabled,
  syncCreateConnection,
  syncJoinConnection,
  syncGetConnectionByProfile,
  syncDeleteConnection,
  syncGoal,
  syncDeleteGoal,
  syncLoveNote,
  syncActivity,
  syncSharedTask,
  syncTaskComment,
  pullCoupleData,
  syncUpdateConnectionGamification
} from './services/coupleSync'

let migrationPromise: Promise<void> | null = null

/**
 * Migrates old daily_reminder_couple database records to version 7 DailyReminderDB stores.
 */
export async function migrateOldCoupleDatabase(): Promise<void> {
  if (migrationPromise) return migrationPromise

  migrationPromise = (async () => {
    const oldDBName = 'daily_reminder_couple'
    try {
      if (typeof indexedDB.databases !== 'function') return
      const dbs = await indexedDB.databases()
      const exists = dbs.some(d => d.name === oldDBName)
      if (!exists) return

      const getStoreData = (dbObj: IDBDatabase, storeName: string): Promise<any[]> => {
        return new Promise((resolve, reject) => {
          if (!dbObj.objectStoreNames.contains(storeName)) {
            resolve([])
            return
          }
          const tx = dbObj.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)
          const request = store.getAll()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
      }

      const oldDb: IDBDatabase = await new Promise((resolve, reject) => {
        const req = indexedDB.open(oldDBName)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })

      const connections = await getStoreData(oldDb, 'connections')
      const sharedTasks = await getStoreData(oldDb, 'sharedTasks')
      const coupleGoals = await getStoreData(oldDb, 'coupleGoals')
      const loveNotes = await getStoreData(oldDb, 'loveNotes')
      const activityFeed = await getStoreData(oldDb, 'activityFeed')
      const taskComments = await getStoreData(oldDb, 'taskComments')

      await db.transaction('rw', [
        db.connections, db.sharedTasks, db.coupleGoals,
        db.loveNotes, db.activityFeed, db.taskComments
      ], async () => {
        for (const c of connections) await db.connections.put(c)
        for (const t of sharedTasks) await db.sharedTasks.put(t)
        for (const g of coupleGoals) await db.coupleGoals.put(g)
        for (const n of loveNotes) await db.loveNotes.put(n)
        for (const a of activityFeed) await db.activityFeed.put(a)
        for (const c of taskComments) await db.taskComments.put(c)
      })

      oldDb.close()
      indexedDB.deleteDatabase(oldDBName)
    } catch (e) {
      console.error('Failed to migrate couple DB', e)
    }
  })()

  return migrationPromise
}

export interface CoupleBackupData {
  connections: CoupleConnection[]
  sharedTasks: SharedTask[]
  coupleGoals: CoupleGoal[]
  loveNotes: LoveNote[]
  activityFeed: ActivityFeedItem[]
  taskComments: TaskComment[]
}

export async function exportCoupleData(): Promise<CoupleBackupData> {
  await migrateOldCoupleDatabase()
  return {
    connections: await db.connections.toArray(),
    sharedTasks: await db.sharedTasks.toArray(),
    coupleGoals: await db.coupleGoals.toArray(),
    loveNotes: await db.loveNotes.toArray(),
    activityFeed: await db.activityFeed.toArray(),
    taskComments: await db.taskComments.toArray()
  }
}

export async function importCoupleData(data: CoupleBackupData, mode: 'merge' | 'replace'): Promise<void> {
  await migrateOldCoupleDatabase()
  if (mode === 'replace') {
    await db.connections.clear()
    await db.sharedTasks.clear()
    await db.coupleGoals.clear()
    await db.loveNotes.clear()
    await db.activityFeed.clear()
    await db.taskComments.clear()
  }
  for (const c of data.connections || []) await db.connections.put(c)
  for (const t of data.sharedTasks || []) await db.sharedTasks.put(t)
  for (const g of data.coupleGoals || []) await db.coupleGoals.put(g)
  for (const n of data.loveNotes || []) await db.loveNotes.put(n)
  for (const a of data.activityFeed || []) await db.activityFeed.put(a)
  for (const c of data.taskComments || []) await db.taskComments.put(c)
}

export async function getCoupleStatsCounts(coupleId: string): Promise<{ sharedTasks: number; goals: number }> {
  await migrateOldCoupleDatabase()
  const tasks = await db.sharedTasks.where('coupleId').equals(coupleId).toArray()
  const goals = await db.coupleGoals.where('coupleId').equals(coupleId).toArray()
  return { sharedTasks: tasks.length, goals: goals.length }
}

async function mergeRemoteData(coupleId: string): Promise<void> {
  if (!isCoupleSyncEnabled()) return
  const remote = await pullCoupleData(coupleId)
  for (const goal of remote.goals) await db.coupleGoals.put(goal)
  for (const note of remote.loveNotes) await db.loveNotes.put(note)
  for (const item of remote.activity) await db.activityFeed.put(item)
  for (const task of remote.sharedTasks) await db.sharedTasks.put(task)
  for (const comment of remote.taskComments) await db.taskComments.put(comment)
}

export async function createCoupleConnection(
  profile1Id: string,
  profile1Name: string
): Promise<CoupleConnection> {
  await migrateOldCoupleDatabase()
  const inviteCode = generateInviteCode()

  const connection: CoupleConnection = {
    id: crypto.randomUUID(),
    profile1Id,
    profile2Id: '',
    profile1Name,
    profile2Name: '',
    connectedAt: Date.now(),
    status: 'pending',
    inviteCode,
    points: 0,
    level: 1
  }

  await db.connections.add(connection)
  await syncCreateConnection(connection)
  return connection
}

export async function joinCoupleConnection(
  inviteCode: string,
  profile2Id: string,
  profile2Name: string
): Promise<CoupleConnection | null> {
  await migrateOldCoupleDatabase()

  const rateKey = `join:${inviteCode}`
  if (isRateLimited(rateKey)) return null

  let connection: CoupleConnection | null = null

  if (isCoupleSyncEnabled()) {
    connection = await syncJoinConnection(inviteCode, profile2Id, profile2Name)
    if (connection) await db.connections.put(connection)
  }

  if (!connection) {
    const connections = await db.connections.where('inviteCode').equals(inviteCode).toArray()
    if (connections.length === 0) {
      recordAttempt(rateKey)
      return null
    }
    const localConn = { ...connections[0] }
    localConn.profile2Id = profile2Id
    localConn.profile2Name = profile2Name
    localConn.status = 'active'
    delete localConn.inviteCode
    await db.connections.put(localConn)
    connection = localConn
  }

  return connection
}

export async function getCoupleConnection(profileId: string): Promise<CoupleConnection | null> {
  await migrateOldCoupleDatabase()
  if (isCoupleSyncEnabled()) {
    const remote = await syncGetConnectionByProfile(profileId)
    if (remote) {
      await db.connections.put(remote)
      await mergeRemoteData(remote.id)
      return remote
    }
  }

  const asProfile1 = await db.connections.where('profile1Id').equals(profileId).toArray()
  const active1 = asProfile1.find(c => c.status === 'active' || c.status === 'pending')
  if (active1) return active1

  const asProfile2 = await db.connections.where('profile2Id').equals(profileId).toArray()
  if (asProfile2.length > 0 && asProfile2[0].status === 'active') return asProfile2[0]

  return null
}

export async function disconnectCouple(connectionId: string): Promise<void> {
  await migrateOldCoupleDatabase()
  
  const tasks = await db.sharedTasks.where('coupleId').equals(connectionId).toArray()
  for (const t of tasks) await db.sharedTasks.delete(t.id)

  const goals = await db.coupleGoals.where('coupleId').equals(connectionId).toArray()
  for (const g of goals) await db.coupleGoals.delete(g.id)

  const notes = await db.loveNotes.where('coupleId').equals(connectionId).toArray()
  for (const n of notes) await db.loveNotes.delete(n.id)

  const feed = await db.activityFeed.where('coupleId').equals(connectionId).toArray()
  for (const a of feed) await db.activityFeed.delete(a.id)

  const comments = await db.taskComments.where('coupleId').equals(connectionId).toArray()
  for (const c of comments) await db.taskComments.delete(c.id)

  await db.connections.delete(connectionId)
  await syncDeleteConnection(connectionId)
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const array = new Uint8Array(6)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => chars[b % chars.length]).join('')
}

export async function addPointsToConnection(connectionId: string, pointsToAdd: number): Promise<CoupleConnection | null> {
  await migrateOldCoupleDatabase()
  const connection = await db.connections.get(connectionId)
  if (!connection) return null

  const oldPoints = connection.points || 0
  const newPoints = oldPoints + pointsToAdd
  const newLevel = Math.floor(newPoints / 100) + 1

  const updatedConnection = {
    ...connection,
    points: newPoints,
    level: newLevel
  }

  await db.connections.put(updatedConnection)
  await syncUpdateConnectionGamification(connectionId, newPoints, newLevel)

  return updatedConnection
}

export async function shareTask(
  task: SharedTask,
  coupleId: string,
  sharedWith: string,
  sharedBy: string
): Promise<SharedTask> {
  await migrateOldCoupleDatabase()

  const sharedTask: SharedTask = {
    ...task,
    isShared: true,
    sharedWith,
    sharedBy,
    sharedAt: Date.now()
  }

  await db.sharedTasks.add(sharedTask)
  await syncSharedTask(sharedTask, coupleId)

  await addActivityFeedItem({
    id: crypto.randomUUID(),
    coupleId,
    profileId: sharedBy,
    profileName: '',
    type: 'task_completed',
    title: 'activity.taskShared',
    timestamp: Date.now(),
    metadata: { taskId: task.id, taskTitle: task.title }
  })

  return sharedTask
}

export async function getSharedTasks(coupleId: string, date: string): Promise<SharedTask[]> {
  await migrateOldCoupleDatabase()
  const allShared = await db.sharedTasks.where('coupleId').equals(coupleId).toArray()
  return allShared.filter(t => t.date === date)
}

export async function saveCoupleGoal(goal: CoupleGoal): Promise<void> {
  await migrateOldCoupleDatabase()
  await db.coupleGoals.put(goal)
  await syncGoal(goal)
}

export async function getCoupleGoals(coupleId: string): Promise<CoupleGoal[]> {
  await migrateOldCoupleDatabase()
  await mergeRemoteData(coupleId)
  const goals = await db.coupleGoals.where('coupleId').equals(coupleId).toArray()
  return goals.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return b.createdAt - a.createdAt
  })
}

export async function deleteCoupleGoal(goalId: string): Promise<void> {
  await migrateOldCoupleDatabase()
  await db.coupleGoals.delete(goalId)
  await syncDeleteGoal(goalId)
}

export async function saveLoveNote(note: LoveNote): Promise<void> {
  await migrateOldCoupleDatabase()
  await db.loveNotes.put(note)
  await syncLoveNote(note)

  await addActivityFeedItem({
    id: crypto.randomUUID(),
    coupleId: note.coupleId,
    profileId: note.fromProfileId,
    profileName: '',
    type: 'love_note_sent',
    title: 'activity.loveNoteSent',
    description: note.message.substring(0, 50),
    timestamp: Date.now(),
    metadata: { noteId: note.id }
  })
}

export async function getLoveNotes(coupleId: string, profileId: string): Promise<LoveNote[]> {
  await migrateOldCoupleDatabase()
  await mergeRemoteData(coupleId)
  const notes = await db.loveNotes.where('coupleId').equals(coupleId).toArray()
  const visibleNotes = notes.filter(n => n.toProfileId === profileId || n.fromProfileId === profileId)
  return visibleNotes.sort((a, b) => b.createdAt - a.createdAt)
}

export async function markLoveNoteAsRead(noteId: string): Promise<void> {
  await migrateOldCoupleDatabase()
  const note = await db.loveNotes.get(noteId)
  if (note) {
    note.read = true
    await db.loveNotes.put(note)
    await syncLoveNote(note)
  }
}

export async function addActivityFeedItem(item: ActivityFeedItem): Promise<void> {
  await migrateOldCoupleDatabase()
  await db.activityFeed.add(item)
  await syncActivity(item)

  const all = await db.activityFeed.where('coupleId').equals(item.coupleId).toArray()
  if (all.length > 100) {
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp)
    for (const old of sorted.slice(100)) {
      await db.activityFeed.delete(old.id)
    }
  }
}

export async function getActivityFeed(coupleId: string, limit: number = 50): Promise<ActivityFeedItem[]> {
  await migrateOldCoupleDatabase()
  await mergeRemoteData(coupleId)
  const items = await db.activityFeed.where('coupleId').equals(coupleId).toArray()
  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
}

export async function saveTaskComment(comment: TaskComment): Promise<void> {
  await migrateOldCoupleDatabase()
  await db.taskComments.put(comment)
  await syncTaskComment(comment)
}

export async function getTaskComments(coupleId: string, taskId: string): Promise<TaskComment[]> {
  await migrateOldCoupleDatabase()
  await mergeRemoteData(coupleId)
  const comments = await db.taskComments.where('taskId').equals(taskId).toArray()
  return comments
    .filter(comment => comment.coupleId === coupleId)
    .sort((a, b) => a.createdAt - b.createdAt)
}
