/**
 * Offline Detection Hook with persistent action queue
 */

import { useEffect, useState, useCallback } from 'react'
import { useToast } from './useToast'
import { useT } from '../i18n'
import {
  getOfflineQueue,
  enqueueOfflineAction,
  processOfflineQueue,
  type OfflineAction
} from '../utils/offlineQueue'
import { useTaskStore } from '../stores/useTaskStore'
import { saveTask } from '../database'
import type { Task } from '../types'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const [queueLength, setQueueLength] = useState(getOfflineQueue().length)
  const { warning, success } = useToast()
  const t = useT()

  const executeAction = useCallback(async (action: OfflineAction) => {
    const { toggleTaskDone, removeTask, updateTask, loadTodayTasks } = useTaskStore.getState()
    if (action.type === 'toggleDone') {
      for (const taskId of action.taskIds) {
        const task = useTaskStore.getState().todayTasks.find(t => t.id === taskId)
        if (task && task.done !== action.done) {
          await toggleTaskDone(taskId)
        }
      }
    } else if (action.type === 'delete') {
      for (const taskId of action.taskIds) {
        await removeTask(taskId)
      }
    } else if (action.type === 'addTask') {
      await saveTask(action.task)
      await loadTodayTasks()
    } else if (action.type === 'updateTask') {
      await updateTask(action.taskId, action.updates)
    }
  }, [])

  const refreshQueueLength = useCallback(() => {
    setQueueLength(getOfflineQueue().length)
  }, [])

  const processQueue = useCallback(async () => {
    const processed = await processOfflineQueue(executeAction)
    refreshQueueLength()
    if (processed > 0) {
      await useTaskStore.getState().loadTodayTasks()
    }
    const remaining = getOfflineQueue().length
    if (remaining > 0) {
      warning(t('offline.pendingActions', { count: remaining }))
    }
    return processed
  }, [executeAction, refreshQueueLength, warning, t])

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      if (wasOffline) {
        success(t('offline.restored'))
        setWasOffline(false)
        await processQueue()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      warning(t('offline.queued'))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline, success, warning, t, processQueue])

  const queueToggleDone = useCallback((taskIds: string[], done: boolean) => {
    enqueueOfflineAction({ type: 'toggleDone', taskIds, done })
    refreshQueueLength()
  }, [refreshQueueLength])

  const queueDelete = useCallback((taskIds: string[]) => {
    enqueueOfflineAction({ type: 'delete', taskIds })
    refreshQueueLength()
  }, [refreshQueueLength])

  const queueAddTask = useCallback((task: Task) => {
    enqueueOfflineAction({ type: 'addTask', task })
    refreshQueueLength()
  }, [refreshQueueLength])

  const queueUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    enqueueOfflineAction({ type: 'updateTask', taskId, updates })
    refreshQueueLength()
  }, [refreshQueueLength])

  return {
    isOnline,
    isOffline: !isOnline,
    queueLength,
    queueToggleDone,
    queueDelete,
    queueAddTask,
    queueUpdateTask,
    processQueue
  }
}
