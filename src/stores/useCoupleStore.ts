import { create } from 'zustand'
import type { CoupleConnection, CoupleGoal, LoveNote, ActivityFeedItem } from '../types-couple'
import {
  createCoupleConnection,
  joinCoupleConnection,
  getCoupleConnection,
  disconnectCouple,
  getCoupleGoals,
  saveCoupleGoal,
  deleteCoupleGoal,
  getLoveNotes,
  saveLoveNote,
  markLoveNoteAsRead,
  getActivityFeed,
  addActivityFeedItem,
  addPointsToConnection
} from '../database-couple'
import { isCoupleSyncEnabled } from '../services/coupleSync'

let syncPollTimer: ReturnType<typeof setInterval> | null = null

function startSyncPoll(refresh: () => Promise<void>) {
  if (!isCoupleSyncEnabled() || syncPollTimer) return
  syncPollTimer = setInterval(() => { refresh().catch(() => {}) }, 15000)
}

function stopSyncPoll() {
  if (syncPollTimer) {
    clearInterval(syncPollTimer)
    syncPollTimer = null
  }
}

interface CoupleState {
  connection: CoupleConnection | null
  goals: CoupleGoal[]
  loveNotes: LoveNote[]
  activityFeed: ActivityFeedItem[]
  loading: boolean
  
  // Connection
  loadConnection: (profileId: string) => Promise<void>
  createConnection: (profileId: string, profileName: string) => Promise<string>
  joinConnection: (inviteCode: string, profileId: string, profileName: string) => Promise<boolean>
  disconnect: () => Promise<void>
  
  // Goals
  loadGoals: () => Promise<void>
  addGoal: (goal: Omit<CoupleGoal, 'id' | 'createdAt'>) => Promise<void>
  updateGoal: (goalId: string, updates: Partial<CoupleGoal>) => Promise<void>
  removeGoal: (goalId: string) => Promise<void>
  
  // Love Notes
  loadLoveNotes: (profileId: string) => Promise<void>
  sendLoveNote: (note: Omit<LoveNote, 'id' | 'createdAt' | 'read'>) => Promise<void>
  markNoteRead: (noteId: string) => Promise<void>
  
  // Activity Feed
  loadActivityFeed: () => Promise<void>
  addActivity: (item: Omit<ActivityFeedItem, 'id'>) => Promise<void>
  
  // Partner info
  getPartnerName: (currentProfileId: string) => string
  getPartnerId: (currentProfileId: string) => string
  
  // Gamification
  addPoints: (points: number) => Promise<{ oldLevel: number, newLevel: number } | null>
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  connection: null,
  goals: [],
  loveNotes: [],
  activityFeed: [],
  loading: false,

  loadConnection: async (profileId: string) => {
    set({ loading: true })
    const connection = await getCoupleConnection(profileId)
    set({ connection, loading: false })
    if (connection) {
      const state = get()
      await Promise.all([
        state.loadGoals(),
        state.loadLoveNotes(profileId),
        state.loadActivityFeed()
      ])
      startSyncPoll(async () => {
        await get().loadConnection(profileId)
        await get().loadGoals()
        await get().loadLoveNotes(profileId)
        await get().loadActivityFeed()
      })
    } else {
      stopSyncPoll()
    }
  },

  createConnection: async (profileId: string, profileName: string) => {
    const connection = await createCoupleConnection(profileId, profileName)
    set({ connection })
    return connection.inviteCode || ''
  },

  joinConnection: async (inviteCode: string, profileId: string, profileName: string) => {
    const connection = await joinCoupleConnection(inviteCode, profileId, profileName)
    if (connection) {
      set({ connection })
      return true
    }
    return false
  },

  disconnect: async () => {
    const { connection } = get()
    if (connection) {
      await disconnectCouple(connection.id)
      stopSyncPoll()
      set({ connection: null, goals: [], loveNotes: [], activityFeed: [] })
    }
  },

  loadGoals: async () => {
    const { connection } = get()
    if (!connection) return
    
    const goals = await getCoupleGoals(connection.id)
    set({ goals })
  },

  addGoal: async (goalData) => {
    const { connection } = get()
    if (!connection) return

    const goal: CoupleGoal = {
      ...goalData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      completed: false,
      progress: 0,
      milestones: goalData.milestones || []
    }

    await saveCoupleGoal(goal)
    await get().loadGoals()

    // Add to activity feed
    await addActivityFeedItem({
      id: crypto.randomUUID(),
      coupleId: connection.id,
      profileId: goal.createdBy,
      profileName: '',
      type: 'goal_achieved',
      title: 'activity.goalCreated',
      timestamp: Date.now(),
      metadata: { goalId: goal.id, goalTitle: goal.title }
    })
  },

  updateGoal: async (goalId, updates) => {
    const { goals, connection } = get()
    const goal = goals.find(g => g.id === goalId)
    if (!goal || !connection) return

    const updated = { ...goal, ...updates }
    await saveCoupleGoal(updated)
    await get().loadGoals()

    // If goal completed, add to activity feed
    if (updates.completed && !goal.completed) {
      await addActivityFeedItem({
        id: crypto.randomUUID(),
        coupleId: connection.id,
        profileId: updated.createdBy,
        profileName: '',
        type: 'goal_achieved',
        title: 'activity.goalCompleted',
        timestamp: Date.now(),
        metadata: { goalId: goal.id, goalTitle: goal.title }
      })
    }
  },

  removeGoal: async (goalId) => {
    await deleteCoupleGoal(goalId)
    await get().loadGoals()
  },

  loadLoveNotes: async (profileId: string) => {
    const { connection } = get()
    if (!connection) return

    const notes = await getLoveNotes(connection.id, profileId)
    set({ loveNotes: notes })
  },

  sendLoveNote: async (noteData) => {
    const { connection } = get()
    if (!connection) return

    const note: LoveNote = {
      ...noteData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      read: false
    }

    await saveLoveNote(note)
    
    // Reload the current sender view; the partner will receive it on their next sync/poll.
    await get().loadLoveNotes(noteData.fromProfileId)
    await get().loadActivityFeed()
  },

  markNoteRead: async (noteId) => {
    await markLoveNoteAsRead(noteId)
    const { loveNotes } = get()
    const updated = loveNotes.map(n => 
      n.id === noteId ? { ...n, read: true } : n
    )
    set({ loveNotes: updated })
  },

  loadActivityFeed: async () => {
    const { connection } = get()
    if (!connection) return

    const feed = await getActivityFeed(connection.id)
    set({ activityFeed: feed })
  },

  addActivity: async (itemData) => {
    const item: ActivityFeedItem = {
      ...itemData,
      id: crypto.randomUUID()
    }
    await addActivityFeedItem(item)
    await get().loadActivityFeed()
  },

  getPartnerName: (currentProfileId: string) => {
    const { connection } = get()
    if (!connection) return ''
    
    return connection.profile1Id === currentProfileId
      ? connection.profile2Name
      : connection.profile1Name
  },

  getPartnerId: (currentProfileId: string) => {
    const { connection } = get()
    if (!connection) return ''
    
    return connection.profile1Id === currentProfileId
      ? connection.profile2Id
      : connection.profile1Id
  },

  addPoints: async (points: number) => {
    const { connection } = get()
    if (!connection) return null

    const oldLevel = connection.level || 1
    const updatedConnection = await addPointsToConnection(connection.id, points)
    
    if (updatedConnection) {
      set({ connection: updatedConnection })
      return {
        oldLevel,
        newLevel: updatedConnection.level
      }
    }
    return null
  }
}))
