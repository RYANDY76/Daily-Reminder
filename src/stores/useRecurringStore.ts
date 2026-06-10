import { create } from 'zustand'
import type { Task } from '../types'
import { getTodayDate, getDayIndex } from '../dates'
import { getRecurringTasks, saveTask, getTasksForDate } from '../database'
import { useProfileStore } from './useProfileStore'

interface RecurringState {
  checking: boolean
  generateRecurringTasks: () => Promise<void>
  checkAndGenerate: () => Promise<void>
}

export const useRecurringStore = create<RecurringState>((set) => ({
  checking: false,

  generateRecurringTasks: async () => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile) return

    const today = getTodayDate()
    const dayIndex = getDayIndex(today)
    const recurringTasks = await getRecurringTasks(profile.id)

    const todayTasks = await Promise.all(
      recurringTasks.map(async (task) => {
        if (!task.recurring || !task.recurringId) return null

        if (task.recurring.pattern === 'daily') {
          const existing = await checkExistingTask(profile.id, task.recurringId, today)
          if (existing) return null
          return createTaskFromRecurring(task, today, profile.id)
        }

        if (task.recurring.pattern === 'weekly' && task.recurring.daysOfWeek.includes(dayIndex)) {
          const existing = await checkExistingTask(profile.id, task.recurringId, today)
          if (existing) return null
          return createTaskFromRecurring(task, today, profile.id)
        }

        return null
      })
    )

    const validTasks = todayTasks.filter((t): t is Task => t !== null)
    for (const t of validTasks) {
      await saveTask(t)
    }
  },

  checkAndGenerate: async () => {
    set({ checking: true })
    try {
      await useRecurringStore.getState().generateRecurringTasks()
    } finally {
      set({ checking: false })
    }
  }
}))

async function checkExistingTask(profileId: string, recurringId: string, date: string): Promise<Task | null> {
  const tasks = await getTasksForDate(profileId, date)
  return tasks.find(t => t.recurringId === recurringId) || null
}

function createTaskFromRecurring(source: Task, date: string, profileId: string): Task {
  return {
    ...source,
    id: crypto.randomUUID(),
    date,
    profileId,
    done: false,
    status: 'pending',
    isRecurring: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    googleEventId: null,
    syncedToGoogle: false
  }
}
