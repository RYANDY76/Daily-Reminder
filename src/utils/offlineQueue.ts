import type { Task } from '../types'

export type OfflineAction =
  | { id: string; type: 'toggleDone'; taskIds: string[]; done: boolean; retryCount: number; maxRetries: number }
  | { id: string; type: 'delete'; taskIds: string[]; retryCount: number; maxRetries: number }
  | { id: string; type: 'addTask'; task: Task; retryCount: number; maxRetries: number }
  | { id: string; type: 'updateTask'; taskId: string; updates: Partial<Task>; retryCount: number; maxRetries: number }

const STORAGE_KEY = 'daily_reminder_offline_queue'

function loadQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: OfflineAction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function getOfflineQueue(): OfflineAction[] {
  return loadQueue()
}

export type OfflineActionInput =
  | { type: 'toggleDone'; taskIds: string[]; done: boolean; maxRetries?: number }
  | { type: 'delete'; taskIds: string[]; maxRetries?: number }
  | { type: 'addTask'; task: Task; maxRetries?: number }
  | { type: 'updateTask'; taskId: string; updates: Partial<Task>; maxRetries?: number }

export function enqueueOfflineAction(action: OfflineActionInput): void {
  const queue = loadQueue()
  const item: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    retryCount: 0,
    maxRetries: action.maxRetries ?? 3
  } as OfflineAction
  queue.push(item)
  saveQueue(queue)
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export async function processOfflineQueue(
  executor: (action: OfflineAction) => Promise<void>
): Promise<number> {
  const items = loadQueue()
  if (items.length === 0) return 0

  const pending: OfflineAction[] = []
  let processed = 0

  for (const item of items) {
    try {
      await executor(item)
      processed++
    } catch {
      if (item.retryCount < item.maxRetries) {
        pending.push({ ...item, retryCount: item.retryCount + 1 })
      }
    }
  }

  saveQueue(pending)
  return processed
}
