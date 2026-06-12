import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const {
  mockSetSyncing,
  mockSetSuccess,
  mockSetError,
  mockAddToast,
  mockSyncBidirectional
} = vi.hoisted(() => ({
  mockSetSyncing: vi.fn(),
  mockSetSuccess: vi.fn(),
  mockSetError: vi.fn(),
  mockAddToast: vi.fn(),
  mockSyncBidirectional: vi.fn()
}))

vi.mock('../stores/useSyncStore', () => ({
  useSyncStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({
      setSyncing: mockSetSyncing,
      setSuccess: mockSetSuccess,
      setError: mockSetError
    }))
  })
}))

vi.mock('../stores/useAppStore', () => ({
  useAppStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({
      addToast: mockAddToast
    }))
  })
}))

vi.mock('../i18n', () => ({
  t: (key: string) => key
}))

vi.mock('./cloudSync', () => ({
  syncCurrentProfileBidirectional: mockSyncBidirectional
}))

import {
  isAutoCloudSyncEnabled,
  setAutoCloudSyncEnabled,
  scheduleAutoCloudSync,
  runAutoCloudSync
} from './autoCloudSync'

describe('autoCloudSync', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('isAutoCloudSyncEnabled / setAutoCloudSyncEnabled', () => {
    it('returns false by default', () => {
      expect(isAutoCloudSyncEnabled()).toBe(false)
    })

    it('returns true after setEnabled(true)', () => {
      setAutoCloudSyncEnabled(true)
      expect(isAutoCloudSyncEnabled()).toBe(true)
    })

    it('returns false after setEnabled(true) then setEnabled(false)', () => {
      setAutoCloudSyncEnabled(true)
      expect(isAutoCloudSyncEnabled()).toBe(true)
      setAutoCloudSyncEnabled(false)
      expect(isAutoCloudSyncEnabled()).toBe(false)
    })
  })

  describe('runAutoCloudSync', () => {
    it('returns disabled error when auto sync is not enabled', async () => {
      const result = await runAutoCloudSync()

      expect(result).toEqual({ ok: false, error: 'disabled' })
      expect(mockSetSyncing).not.toHaveBeenCalled()
    })

    it('syncs successfully when enabled', async () => {
      setAutoCloudSyncEnabled(true)
      mockSyncBidirectional.mockResolvedValueOnce(undefined)

      const result = await runAutoCloudSync()

      expect(mockSetSyncing).toHaveBeenCalled()
      expect(mockSyncBidirectional).toHaveBeenCalled()
      expect(mockSetSuccess).toHaveBeenCalled()
      expect(result).toEqual({ ok: true })
    })

    it('handles sync error', async () => {
      setAutoCloudSyncEnabled(true)
      const testError = new Error('Sync failed')
      mockSyncBidirectional.mockRejectedValueOnce(testError)
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')

      const result = await runAutoCloudSync()

      expect(mockSetSyncing).toHaveBeenCalled()
      expect(mockSetError).toHaveBeenCalledWith('Sync failed')
      expect(mockAddToast).toHaveBeenCalledWith({
        id: 'mock-uuid',
        message: 'sync.failed: Sync failed',
        type: 'error',
        duration: 5000
      })
      expect(result).toEqual({ ok: false, error: 'Sync failed' })
    })
  })

  describe('scheduleAutoCloudSync', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('does nothing when auto sync is disabled', () => {
      scheduleAutoCloudSync()
      vi.advanceTimersByTime(5000)

      expect(mockSyncBidirectional).not.toHaveBeenCalled()
      expect(mockSetSyncing).not.toHaveBeenCalled()
    })

    it('schedules runAutoCloudSync after 5 seconds when enabled', async () => {
      setAutoCloudSyncEnabled(true)
      mockSyncBidirectional.mockResolvedValueOnce(undefined)

      scheduleAutoCloudSync()
      expect(mockSyncBidirectional).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(5000)

      expect(mockSetSyncing).toHaveBeenCalled()
      expect(mockSyncBidirectional).toHaveBeenCalled()
      expect(mockSetSuccess).toHaveBeenCalled()
    })
  })
})
