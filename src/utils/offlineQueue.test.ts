import { describe, it, expect, beforeEach } from 'vitest'
import {
  enqueueOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
  processOfflineQueue
} from './offlineQueue'

describe('offlineQueue', () => {
  beforeEach(() => {
    clearOfflineQueue()
  })

  it('enqueues and processes actions', async () => {
    enqueueOfflineAction({ type: 'delete', taskIds: ['a', 'b'] })
    expect(getOfflineQueue()).toHaveLength(1)

    const processed = await processOfflineQueue(async (action) => {
      expect(action.type).toBe('delete')
      expect(action.taskIds).toEqual(['a', 'b'])
    })

    expect(processed).toBe(1)
    expect(getOfflineQueue()).toHaveLength(0)
  })
})
