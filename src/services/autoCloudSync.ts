import { useSyncStore } from '../stores/useSyncStore'
import { useAppStore } from '../stores/useAppStore'
import { t } from '../i18n'

const STORAGE_KEY = 'daily_reminder_auto_cloud_sync'
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let syncing = false

export function isAutoCloudSyncEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setAutoCloudSyncEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
}

export function scheduleAutoCloudSync(): void {
  if (!isAutoCloudSyncEnabled()) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    runAutoCloudSync()
  }, 5000)
}

export async function runAutoCloudSync(): Promise<{ ok: boolean; error?: string }> {
  if (syncing) return { ok: false, error: 'busy' }
  if (!isAutoCloudSyncEnabled()) return { ok: false, error: 'disabled' }

  syncing = true
  useSyncStore.getState().setSyncing()

  try {
    const { syncCurrentProfileBidirectional } = await import('./cloudSync')
    await syncCurrentProfileBidirectional()
    useSyncStore.getState().setSuccess()
    return { ok: true }
  } catch (err) {
    const message = (err as Error).message || t('sync.failed')
    useSyncStore.getState().setError(message)
    useAppStore.getState().addToast({
      id: crypto.randomUUID(),
      message: `${t('sync.failed')}: ${message}`,
      type: 'error',
      duration: 5000
    })
    return { ok: false, error: message }
  } finally {
    syncing = false
  }
}
