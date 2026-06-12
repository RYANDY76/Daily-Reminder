import { useEffect } from 'react'
import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useSyncStore } from '../stores/useSyncStore'
import { isAutoCloudSyncEnabled } from '../services/autoCloudSync'
import { useT } from '../i18n'
import { useProfileStore } from '../stores/useProfileStore'

export default function SyncStatusBadge() {
  const t = useT()
  const status = useSyncStore((s) => s.status)
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt)
  const lastError = useSyncStore((s) => s.lastError)
  const profile = useProfileStore((s) => s.currentProfile)
  const autoSync = isAutoCloudSyncEnabled()

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => useSyncStore.getState().reset(), 4000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [status])

  if (!autoSync && !lastSyncedAt && status === 'idle') return null

  const icon = status === 'syncing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
    : status === 'error' ? <AlertCircle className="w-3.5 h-3.5" />
    : status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" />
    : autoSync ? <Cloud className="w-3.5 h-3.5" />
    : <CloudOff className="w-3.5 h-3.5" />

  const color = status === 'error' ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
    : status === 'success' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    : status === 'syncing' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
    : 'text-gray-500 bg-gray-100 dark:bg-dark-card'

  const label = status === 'syncing' ? t('sync.syncing')
    : status === 'error' ? t('sync.failed')
    : status === 'success' ? t('sync.done')
    : lastSyncedAt ? t('sync.lastSync', { time: new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
    : t('sync.autoOn')

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] font-medium max-w-[140px] md:max-w-none truncate ${color}`}
      title={lastError || (profile?.lastSyncAt ? new Date(profile.lastSyncAt).toLocaleString() : '')}
      role="status"
      aria-live="polite"
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}
