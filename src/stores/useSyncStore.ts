import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: number | null
  lastError: string | null
  setSyncing: () => void
  setSuccess: () => void
  setError: (message: string) => void
  reset: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  lastError: null,
  setSyncing: () => set({ status: 'syncing', lastError: null }),
  setSuccess: () => set({ status: 'success', lastSyncedAt: Date.now(), lastError: null }),
  setError: (message) => set({ status: 'error', lastError: message }),
  reset: () => set({ status: 'idle' })
}))
