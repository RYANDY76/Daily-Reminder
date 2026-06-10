import { useState } from 'react'
import { useProfileStore } from '../../stores/useProfileStore'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar'
import { useT } from '../../i18n'
import { CheckCircle2, XCircle, UserCheck, Download } from 'lucide-react'
import { importGoogleEventsAsTasks } from '../../services/googleCalendarService'
import { useAppStore } from '../../stores/useAppStore'

export default function GoogleSettings() {
  const t = useT()
  const profile = useProfileStore((s) => s.currentProfile)
  const { connect, disconnect, syncEvents, isConnected, isSyncing } = useGoogleCalendar()
  const { clientId, clientIdSource, setClientId } = useGoogleAuth()

  const [googleClientIdInput, setGoogleClientIdInput] = useState(clientId)
  const [clientIdSaved, setClientIdSaved] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const [importing, setImporting] = useState(false)
  const addToast = useAppStore((s) => s.addToast)

  const handleSync = async () => {
    setSyncStatus(t('settings.syncing'))
    const events = await syncEvents()
    if (events.length > 0) {
      setSyncStatus(t('settings.syncResult', { count: events.length }))
    } else {
      setSyncStatus(t('settings.syncDone'))
    }
    setTimeout(() => setSyncStatus(''), 3000)
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.googleAccount')}</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.googleClientId')}
            </label>
            {clientIdSource === 'env' ? (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-gray-900 dark:text-white font-mono truncate">
                    {clientId}
                  </code>
                  <span className="flex items-center gap-1 text-xs text-primary-500 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3" />
                    .env
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {t('settings.envConfigured')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleClientIdInput}
                    onChange={(e) => {
                      setGoogleClientIdInput(e.target.value)
                      setClientIdSaved(false)
                    }}
                    placeholder="123456789-xxxxx.apps.googleusercontent.com"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                  />
                  <button
                    onClick={() => {
                      setClientId(googleClientIdInput)
                      setClientIdSaved(true)
                      setTimeout(() => setClientIdSaved(false), 2000)
                    }}
                    className="px-4 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors min-h-tap whitespace-nowrap"
                  >
                    {t('common.save')}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {clientId ? (
                    <span className="flex items-center gap-1 text-xs text-primary-500">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('settings.configured')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <XCircle className="w-3 h-3" />
                      {t('settings.notConfigured')}
                    </span>
                  )}
                  {clientIdSaved && (
                    <span className="text-xs text-primary-500 animate-fade-in">{t('common.save')}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {t('settings.googleCloudSetup', { origin: window.location.origin })}
                </p>
              </>
            )}
          </div>

          {profile?.googleId && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-card rounded-xl">
              {profile.googlePhotoUrl && (
                <img
                  src={profile.googlePhotoUrl.startsWith('http') ? profile.googlePhotoUrl : `https://lh3.googleusercontent.com${profile.googlePhotoUrl}`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.name}</p>
                <p className="text-xs text-gray-500">{profile.googleEmail}</p>
              </div>
              <span className="ml-auto flex items-center gap-1 text-xs text-primary-500">
                <UserCheck className="w-3 h-3" />
                {t('settings.connected')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.googleCalendar')}</h3>
        </div>
        <div className="p-4 space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 text-sm text-primary-500">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                {t('settings.connected')}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium transition-colors min-h-tap"
                >
                  {isSyncing ? t('settings.syncing') : t('settings.syncNow')}
                </button>
                <button
                  onClick={async () => {
                    setImporting(true)
                    const count = await importGoogleEventsAsTasks(true)
                    setImporting(false)
                    addToast({ id: crypto.randomUUID(), message: t('settings.googleImported', { count }), type: 'success', duration: 4000 })
                  }}
                  disabled={importing || isSyncing}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors min-h-tap flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {importing ? t('settings.syncing') : t('settings.importGoogle')}
                </button>
                <button
                  onClick={disconnect}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-300 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-tap"
                >
                  {t('settings.disconnect')}
                </button>
              </div>
              {syncStatus && (
                <p className="text-xs text-gray-500">{syncStatus}</p>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {t('settings.googleCalendarDesc')}
              </p>
              <button
                onClick={connect}
                className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors min-h-tap"
              >
                {t('settings.connectGoogle')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
