/**
 * Couple-specific Database Functions
 * Local IndexedDB with optional Supabase cloud sync
 */

import type { CoupleConnection, SharedTask, CoupleGoal, LoveNote, ActivityFeedItem, TaskComment } from './types-couple'
import { openDB, type IDBPDatabase } from 'idb'
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

const DB_NAME = 'daily_reminder_couple'
const DB_VERSION = 2

let db: IDBPDatabase | null = null

async function getDB() {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('connections')) {
        const connStore = db.createObjectStore('connections', { keyPath: 'id' })
        connStore.createIndex('profile1Id', 'profile1Id')
        connStore.createIndex('profile2Id', 'profile2Id')
        connStore.createIndex('inviteCode', 'inviteCode')
      }
      if (!db.objectStoreNames.contains('sharedTasks')) {
        const taskStore = db.createObjectStore('sharedTasks', { keyPath: 'id' })
        taskStore.createIndex('coupleId', 'coupleId')
        taskStore.createIndex('date', 'date')
        taskStore.createIndex('sharedWith', 'sharedWith')
      }
      if (!db.objectStoreNames.contains('coupleGoals')) {
        const goalStore = db.createObjectStore('coupleGoals', { keyPath: 'id' })
        goalStore.createIndex('coupleId', 'coupleId')
        goalStore.createIndex('completed', 'completed')
      }
      if (!db.objectStoreNames.contains('loveNotes')) {
        const noteStore = db.createObjectStore('loveNotes', { keyPath: 'id' })
        noteStore.createIndex('coupleId', 'coupleId')
        noteStore.createIndex('toProfileId', 'toProfileId')
        noteStore.createIndex('taskId', 'taskId')
      }
      if (!db.objectStoreNames.contains('activityFeed')) {
        const feedStore = db.createObjectStore('activityFeed', { keyPath: 'id' })
        feedStore.createIndex('coupleId', 'coupleId')
        feedStore.createIndex('timestamp', 'timestamp')
      }
      if (!db.objectStoreNames.contains('taskComments')) {
        const commentStore = db.createObjectStore('taskComments', { keyPath: 'id' })
        commentStore.createIndex('coupleId', 'coupleId')
        commentStore.createIndex('taskId', 'taskId')
      }
    }
  })

  return db
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
  const database = await getDB()
  return {
    connections: await database.getAll('connections'),
    sharedTasks: await database.getAll('sharedTasks'),
    coupleGoals: await database.getAll('coupleGoals'),
    loveNotes: await database.getAll('loveNotes'),
    activityFeed: await database.getAll('activityFeed'),
    taskComments: await database.getAll('taskComments')
  }
}

export async function importCoupleData(data: CoupleBackupData, mode: 'merge' | 'replace'): Promise<void> {
  const database = await getDB()
  if (mode === 'replace') {
    await database.clear('connections')
    await database.clear('sharedTasks')
    await database.clear('coupleGoals')
    await database.clear('loveNotes')
    await database.clear('activityFeed')
    await database.clear('taskComments')
  }
  for (const c of data.connections || []) await database.put('connections', c)
  for (const t of data.sharedTasks || []) await database.put('sharedTasks', t)
  for (const g of data.coupleGoals || []) await database.put('coupleGoals', g)
  for (const n of data.loveNotes || []) await database.put('loveNotes', n)
  for (const a of data.activityFeed || []) await database.put('activityFeed', a)
  for (const c of data.taskComments || []) await database.put('taskComments', c)
}

export async function getCoupleStatsCounts(coupleId: string): Promise<{ sharedTasks: number; goals: number }> {
  const database = await getDB()
  const tasks = await database.getAllFromIndex('sharedTasks', 'coupleId', coupleId)
  const goals = await database.getAllFromIndex('coupleGoals', 'coupleId', coupleId)
  return { sharedTasks: tasks.length, goals: goals.length }
}

async function mergeRemoteData(coupleId: string): Promise<void> {
  if (!isCoupleSyncEnabled()) return
  const remote = await pullCoupleData(coupleId)
  const database = await getDB()
  for (const goal of remote.goals) await database.put('coupleGoals', goal)
  for (const note of remote.loveNotes) await database.put('loveNotes', note)
  for (const item of remote.activity) await database.put('activityFeed', item)
  for (const task of remote.sharedTasks) await database.put('sharedTasks', task)
  for (const comment of remote.taskComments) await database.put('taskComments', comment)
}

export async function createCoupleConnection(
  profile1Id: string,
  profile1Name: string
): Promise<CoupleConnection> {
  const database = await getDB()
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

  await database.add('connections', connection)
  await syncCreateConnection(connection)
  return connection
}

export async function joinCoupleConnection(
  inviteCode: string,
  profile2Id: string,
  profile2Name: string
): Promise<CoupleConnection | null> {
  const database = await getDB()
  let connection: CoupleConnection | null = null

  if (isCoupleSyncEnabled()) {
    connection = await syncJoinConnection(inviteCode, profile2Id, profile2Name)
    if (connection) await database.put('connections', connection)
  }

  if (!connection) {
    const connections = await database.getAllFromIndex('connections', 'inviteCode', inviteCode)
    if (connections.length === 0) return null
    const localConn = { ...connections[0] }
    localConn.profile2Id = profile2Id
    localConn.profile2Name = profile2Name
    localConn.status = 'active'
    delete localConn.inviteCode
    await database.put('connections', localConn)
    connection = localConn
  }

  return connection
}

export async function getCoupleConnection(profileId: string): Promise<CoupleConnection | null> {
  if (isCoupleSyncEnabled()) {
    const remote = await syncGetConnectionByProfile(profileId)
    if (remote) {
      const database = await getDB()
      await database.put('connections', remote)
      await mergeRemoteData(remote.id)
      return remote
    }
  }

  const database = await getDB()
  const asProfile1 = await database.getAllFromIndex('connections', 'profile1Id', profileId)
  const active1 = asProfile1.find(c => c.status === 'active' || c.status === 'pending')
  if (active1) return active1

  const asProfile2 = await database.getAllFromIndex('connections', 'profile2Id', profileId)
  if (asProfile2.length > 0 && asProfile2[0].status === 'active') return asProfile2[0]

  return null
}

export async function disconnectCouple(connectionId: string): Promise<void> {
  const database = await getDB()
  const stores = ['sharedTasks', 'coupleGoals', 'loveNotes', 'activityFeed', 'taskComments'] as const

  for (const store of stores) {
    const items = await database.getAllFromIndex(store, 'coupleId', connectionId)
    for (const item of items) {
      await database.delete(store, item.id)
    }
  }

  await database.delete('connections', connectionId)
  await syncDeleteConnection(connectionId)
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const array = new Uint8Array(6)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => chars[b % chars.length]).join('')
}

export async function addPointsToConnection(connectionId: string, pointsToAdd: number): Promise<CoupleConnection | null> {
  const database = await getDB()
  const connection = await database.get('connections', connectionId)
  if (!connection) return null

  const oldPoints = connection.points || 0
  const oldLevel = connection.level || 1
  
  const newPoints = oldPoints + pointsToAdd
  // Calculate level: let's say every 100 points is a level
  const newLevel = Math.floor(newPoints / 100) + 1

  const updatedConnection = {
    ...connection,
    points: newPoints,
    level: newLevel
  }

  await database.put('connections', updatedConnection)
  await syncUpdateConnectionGamification(connectionId, newPoints, newLevel)

  return updatedConnection
}

export async function shareTask(
  task: SharedTask,
  coupleId: string,
  sharedWith: string,
  sharedBy: string
): Promise<SharedTask> {
  const database = await getDB()

  const sharedTask: SharedTask = {
    ...task,
    isShared: true,
    sharedWith,
    sharedBy,
    sharedAt: Date.now()
  }

  await database.add('sharedTasks', sharedTask)
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
  const database = await getDB()
  const allShared = await database.getAllFromIndex('sharedTasks', 'coupleId', coupleId)
  return allShared.filter(t => t.date === date)
}

export async function saveCoupleGoal(goal: CoupleGoal): Promise<void> {
  const database = await getDB()
  await database.put('coupleGoals', goal)
  await syncGoal(goal)
}

export async function getCoupleGoals(coupleId: string): Promise<CoupleGoal[]> {
  await mergeRemoteData(coupleId)
  const database = await getDB()
  const goals = await database.getAllFromIndex('coupleGoals', 'coupleId', coupleId)
  return goals.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return b.createdAt - a.createdAt
  })
}

export async function deleteCoupleGoal(goalId: string): Promise<void> {
  const database = await getDB()
  await database.delete('coupleGoals', goalId)
  await syncDeleteGoal(goalId)
}

export async function saveLoveNote(note: LoveNote): Promise<void> {
  const database = await getDB()
  await database.put('loveNotes', note)
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
  await mergeRemoteData(coupleId)
  const database = await getDB()
  const notes = await database.getAllFromIndex('loveNotes', 'coupleId', coupleId)
  const visibleNotes = notes.filter(n => n.toProfileId === profileId || n.fromProfileId === profileId)
  return visibleNotes.sort((a, b) => b.createdAt - a.createdAt)
}

export async function markLoveNoteAsRead(noteId: string): Promise<void> {
  const database = await getDB()
  const note = await database.get('loveNotes', noteId)
  if (note) {
    note.read = true
    await database.put('loveNotes', note)
    await syncLoveNote(note)
  }
}

export async function addActivityFeedItem(item: ActivityFeedItem): Promise<void> {
  const database = await getDB()
  await database.add('activityFeed', item)
  await syncActivity(item)

  const all = await database.getAllFromIndex('activityFeed', 'coupleId', item.coupleId)
  if (all.length > 100) {
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp)
    for (const old of sorted.slice(100)) {
      await database.delete('activityFeed', old.id)
    }
  }
}

export async function getActivityFeed(coupleId: string, limit: number = 50): Promise<ActivityFeedItem[]> {
  await mergeRemoteData(coupleId)
  const database = await getDB()
  const items = await database.getAllFromIndex('activityFeed', 'coupleId', coupleId)
  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
}

export async function saveTaskComment(comment: TaskComment): Promise<void> {
  const database = await getDB()
  await database.put('taskComments', comment)
  await syncTaskComment(comment)
}

export async function getTaskComments(coupleId: string, taskId: string): Promise<TaskComment[]> {
  await mergeRemoteData(coupleId)
  const database = await getDB()
  const comments = await database.getAllFromIndex('taskComments', 'taskId', taskId)
  return comments
    .filter(comment => comment.coupleId === coupleId)
    .sort((a, b) => a.createdAt - b.createdAt)
}
