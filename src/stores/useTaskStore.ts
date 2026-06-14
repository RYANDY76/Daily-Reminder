import { create } from 'zustand'
import type { Task, SessionType, RecurringConfig, TaskPriority } from '../types'
import { getSessionFromTime, getTodayDate, isPast } from '../dates'
import {
  saveTask,
  getTasksForDate,
  deleteTask as deleteTaskDb,
  getAllTasksForProfile,
  saveDailyHistory,
  getTaskById
} from '../database'
import { useProfileStore } from './useProfileStore'
import { useCoupleStore } from './useCoupleStore'
import { useAppStore } from './useAppStore'
import { AppErrorHandler, retryAsync } from '../utils/errorHandler'
import { scheduleAutoCloudSync } from '../services/autoCloudSync'

interface TaskState {
  tasks: Task[]
  todayTasks: Task[]
  loading: boolean
  lastOpenedDate: string
  loadTodayTasks: () => Promise<void>
  loadAllTasks: () => Promise<void>
  addTask: (data: {
    title: string
    time: string
    session?: SessionType
    notes?: string
    color?: string
    priority?: TaskPriority
    tags?: string[]
    subtasks?: { id: string; title: string; done: boolean }[]
    date?: string
    dueDate?: string
    recurring?: RecurringConfig | null
  }) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  toggleTaskDone: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
  checkDayChange: () => Promise<void>
  reorderTasks: (session: SessionType, taskIds: string[]) => Promise<void>
  setTasks: (tasks: Task[]) => void
  shareTask: (taskId: string, sharedWith: string, assignedTo: 'me' | 'partner' | 'both') => Promise<void>
  unshareTask: (taskId: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  todayTasks: [],
  loading: false,
  lastOpenedDate: localStorage.getItem('daily_reminder_last_date') || '',

  loadTodayTasks: async () => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile) return
    
    set({ loading: true })
    
    try {
      const today = getTodayDate()
      let tasks = await retryAsync(
        async () => await getTasksForDate(profile.id, today),
        2,
        500
      )
      
      tasks = tasks.map(t => ({ 
        ...t, 
        priority: t.priority || 'medium', 
        tags: t.tags || [], 
        dueDate: t.dueDate || t.date, 
        subtasks: t.subtasks || [], 
        timeTracking: t.timeTracking || null 
      }))
      
      tasks.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
        const [ah, am] = a.time.split(':').map(Number)
        const [bh, bm] = b.time.split(':').map(Number)
        return ah * 60 + am - (bh * 60 + bm)
      })
      
      set({ todayTasks: tasks, tasks, loading: false })
    } catch (error) {
      AppErrorHandler.logError(
        'LOAD_TASKS_FAILED',
        'Failed to load today\'s tasks',
        'high',
        error
      )
      set({ loading: false })
      throw error
    }
  },

  loadAllTasks: async () => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile) return
    const tasks = await getAllTasksForProfile(profile.id)
    set({ tasks })
  },

  checkDayChange: async () => {
    const today = getTodayDate()
    const lastDate = localStorage.getItem('daily_reminder_last_date')
    if (lastDate && lastDate !== today) {
      const profile = useProfileStore.getState().currentProfile
      if (profile) {
        const yesterdayTasks = await getTasksForDate(profile.id, lastDate)
        for (const task of yesterdayTasks) {
          if (!task.done && task.status !== 'missed') {
            const timePassed = isPast(task.date)
            if (timePassed) {
              await saveTask({ ...task, status: 'missed' })
            }
          }
        }
        await populateDailyHistory(profile.id, lastDate, yesterdayTasks)
      }
    }
    localStorage.setItem('daily_reminder_last_date', today)
    set({ lastOpenedDate: today })
  },

  addTask: async (data) => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile) throw new Error('No active profile')

    const session = data.session || getSessionFromTime(data.time)
    const today = getTodayDate()
    const taskDate = data.date || today
    const existing = get().todayTasks
    const maxOrder = existing.length > 0 ? Math.max(...existing.map(t => t.sortOrder || 0)) : 0

    const task: Task = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      title: data.title,
      time: data.time,
      session,
      notes: data.notes || '',
      color: data.color || '#1D9E75',
      done: false,
      status: 'pending',
      priority: data.priority || 'medium',
      tags: data.tags || [],
      subtasks: data.subtasks || [],
      timeTracking: null,
      recurring: data.recurring || null,
      isRecurring: data.recurring !== null && data.recurring !== undefined,
      recurringId: data.recurring ? crypto.randomUUID() : null,
      date: taskDate,
      dueDate: data.dueDate || taskDate,
      sortOrder: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      snoozedUntil: null
    }

    try {
      await retryAsync(async () => await saveTask(task), 2, 500)
      await get().loadTodayTasks()
      if (taskDate === today) {
        await populateDailyHistory(profile.id, today, get().todayTasks)
      }
      scheduleAutoCloudSync()
      return task
    } catch (error) {
      AppErrorHandler.logError(
        'ADD_TASK_FAILED',
        'Failed to add task',
        'medium',
        error
      )
      throw error
    }
  },

  updateTask: async (id, updates) => {
    let task = get().tasks.find(t => t.id === id)
    if (!task) {
      task = await getTaskById(id)
    }

    if (task) {
      const updated = { ...task, ...updates, updatedAt: Date.now() }
      await saveTask(updated)
      await get().loadTodayTasks()
      const newTasks = get().tasks.map(t => t.id === id ? updated : t)
      set({ tasks: newTasks })
      scheduleAutoCloudSync()
    }
  },

  toggleTaskDone: async (id) => {
    const { tasks } = get()
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newDone = !task.done
    await saveTask({ ...task, done: newDone, status: newDone ? 'done' : 'pending', updatedAt: Date.now() })
    await get().loadTodayTasks()

    // Add points if completed, subtract if undone
    const pointsDelta = newDone ? 10 : -10
    const coupleState = useCoupleStore.getState()
    if (coupleState.connection) {
      const result = await coupleState.addPoints(pointsDelta)
      if (result && result.newLevel > result.oldLevel) {
        useAppStore.getState().addToast({
          id: crypto.randomUUID(),
          message: `Level Up! Anda & Pasangan mencapai Level ${result.newLevel}!`,
          type: 'success',
          duration: 5000
        })
      }
    }

    // Gamification XP
    if (newDone) {
      const { useGamificationStore } = await import('./useGamificationStore')
      useGamificationStore.getState().addXP(10, 'Task selesai')
    }

    const profile = useProfileStore.getState().currentProfile
    if (profile) {
      const todayTasks = await getTasksForDate(profile.id, getTodayDate())
      await populateDailyHistory(profile.id, getTodayDate(), todayTasks)
      // Record day completion for gamification
      const { useGamificationStore } = await import('./useGamificationStore')
      const doneCount = todayTasks.filter(t => t.done).length
      const total = todayTasks.length
      const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
      useGamificationStore.getState().recordDay(pct)
    }
    scheduleAutoCloudSync()
  },

  removeTask: async (id) => {
    try {
      await retryAsync(async () => await deleteTaskDb(id), 2, 500)
      await get().loadTodayTasks()
      const profile = useProfileStore.getState().currentProfile
      if (profile) {
        const todayTasks = await getTasksForDate(profile.id, getTodayDate())
        await populateDailyHistory(profile.id, getTodayDate(), todayTasks)
      }
      scheduleAutoCloudSync()
    } catch (error) {
      AppErrorHandler.logError(
        'DELETE_TASK_FAILED',
        'Failed to delete task',
        'medium',
        error
      )
      throw error
    }
  },

  reorderTasks: async (session, taskIds) => {
    const { todayTasks } = get()
    const sessionTasks = todayTasks.filter(t => t.session === session)
    for (let i = 0; i < taskIds.length; i++) {
      const task = sessionTasks.find(t => t.id === taskIds[i])
      if (task) {
        await saveTask({ ...task, sortOrder: i, updatedAt: Date.now() })
      }
    }
    await get().loadTodayTasks()
    scheduleAutoCloudSync()
  },

  setTasks: (tasks) => set({ tasks }),

  shareTask: async (taskId, sharedWith, assignedTo) => {
    const { tasks } = get()
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const profile = useProfileStore.getState().currentProfile
    if (!profile) return

    const updated = {
      ...task,
      isShared: true,
      sharedWith,
      assignedTo,
      sharedBy: profile.id,
      sharedAt: Date.now(),
      updatedAt: Date.now()
    }

    await saveTask(updated)
    await get().loadTodayTasks()
    scheduleAutoCloudSync()
  },

  unshareTask: async (taskId) => {
    const { tasks } = get()
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const updated = {
      ...task,
      isShared: false,
      sharedWith: undefined,
      assignedTo: undefined,
      sharedBy: undefined,
      sharedAt: undefined,
      updatedAt: Date.now()
    }

    await saveTask(updated)
    await get().loadTodayTasks()
    scheduleAutoCloudSync()
  }
}))

async function populateDailyHistory(profileId: string, date: string, tasks: Task[]): Promise<void> {
  const total = tasks.length
  const done = tasks.filter(t => t.done).length
  const missed = tasks.filter(t => t.status === 'missed').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  await saveDailyHistory({
    id: `${profileId}_${date}`,
    profileId,
    date,
    tasksDone: done,
    tasksMissed: missed,
    tasksTotal: total,
    completionPercentage: pct,
    dailyProductivityScore: pct
  })
}
