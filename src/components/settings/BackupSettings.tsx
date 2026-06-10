import { useState } from 'react'
import { useT } from '../../i18n'
import { exportBackup, importBackup, validateBackup, readFileAsJSON, type BackupData } from '../../utils/backupRestore'
import { useAuthStore } from '../../stores/useAuthStore'
import { pullCurrentProfileFromCloud, pushCurrentProfileToCloud, syncCurrentProfileBidirectional } from '../../services/cloudSync'
import { isAutoCloudSyncEnabled, setAutoCloudSyncEnabled } from '../../services/autoCloudSync'
import { useSyncStore } from '../../stores/useSyncStore'
import { useProfileStore } from '../../stores/useProfileStore'
import { importTasksFromCsv } from '../../utils/csvImport'
import { useAppStore } from '../../stores/useAppStore'
import AuthModal from '../AuthModal'

export default function BackupSettings() {
  const t = useT()

  const [importModal, setImportModal] = useState(false)
  const [importData, setImportData] = useState<BackupData | null>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ profiles: number; tasks: number; history: number } | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [autoSync, setAutoSync] = useState(isAutoCloudSyncEnabled())
  const session = useAuthStore((s) => s.session)
  const profile = useProfileStore((s) => s.currentProfile)
  const addToast = useAppStore((s) => s.addToast)
  const [csvImporting, setCsvImporting] = useState(false)

  const runCloudSync = async (mode: 'push' | 'pull' | 'both') => {
    if (!session) {
      setShowAuth(true)
      return
    }

    try {
      setSyncing(true)
      setSyncMessage('')
      useSyncStore.getState().setSyncing()
      if (mode === 'push') {
        const pushed = await pushCurrentProfileToCloud()
        setSyncMessage(t('settings.cloudPushed', { count: pushed }))
      } else if (mode === 'pull') {
        const pulled = await pullCurrentProfileFromCloud()
        setSyncMessage(t('settings.cloudPulled', { count: pulled }))
      } else {
        const result = await syncCurrentProfileBidirectional()
        setSyncMessage(t('settings.cloudSynced', { pushed: result.pushed, pulled: result.pulled }))
      }
      useSyncStore.getState().setSuccess()
    } catch (err) {
      const msg = (err as Error).message || t('common.error')
      setSyncMessage(msg)
      useSyncStore.getState().setError(msg)
      addToast({ id: crypto.randomUUID(), message: msg, type: 'error', duration: 5000 })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.backup')}</h3>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('settings.backupDesc')}
          </p>
          <button
            onClick={exportBackup}
            className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors min-h-tap"
          >
            {t('settings.backupAll')}
          </button>
          <button
            onClick={() => {
              setImportData(null)
              setImportResult(null)
              setImportModal(true)
            }}
            className="w-full py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-card transition-colors min-h-tap"
          >
            {t('settings.restore')}
          </button>
          <label className="block w-full py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-dark-border text-center cursor-pointer hover:border-primary-500 transition-colors text-sm text-gray-600 dark:text-gray-400">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={csvImporting || !profile}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !profile) return
                setCsvImporting(true)
                try {
                  const text = await file.text()
                  const result = await importTasksFromCsv(text, profile.id)
                  addToast({
                    id: crypto.randomUUID(),
                    message: t('settings.csvImported', { count: result.imported, skipped: result.skipped }),
                    type: result.imported > 0 ? 'success' : 'warning',
                    duration: 5000
                  })
                } catch (err) {
                  addToast({ id: crypto.randomUUID(), message: (err as Error).message, type: 'error', duration: 5000 })
                } finally {
                  setCsvImporting(false)
                  e.target.value = ''
                }
              }}
            />
            {csvImporting ? t('common.loading') : t('settings.importCsv')}
          </label>
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-dark-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('settings.autoCloudSync')}</p>
                <p className="text-xs text-gray-400">{t('settings.autoCloudSyncDesc')}</p>
              </div>
              <button
                onClick={() => {
                  const next = !autoSync
                  setAutoSync(next)
                  setAutoCloudSyncEnabled(next)
                }}
                className={`relative w-12 h-7 rounded-full transition-colors ${autoSync ? 'bg-primary-500' : 'bg-gray-300'}`}
                aria-label={t('settings.autoCloudSync')}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${autoSync ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('settings.cloudBackup')}</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => runCloudSync('push')}
                disabled={syncing}
                className="py-2.5 rounded-xl bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-dark-surface disabled:opacity-50 transition-colors min-h-tap"
              >
                {t('settings.cloudPush')}
              </button>
              <button
                onClick={() => runCloudSync('pull')}
                disabled={syncing}
                className="py-2.5 rounded-xl bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-dark-surface disabled:opacity-50 transition-colors min-h-tap"
              >
                {t('settings.cloudPull')}
              </button>
              <button
                onClick={() => runCloudSync('both')}
                disabled={syncing}
                className="py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium disabled:opacity-50 transition-colors min-h-tap"
              >
                {syncing ? t('settings.syncing') : t('settings.cloudSync')}
              </button>
            </div>
            {syncMessage && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{syncMessage}</p>
            )}
          </div>
        </div>
      </div>

      {importModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-6">
          <div className="bg-white dark:bg-dark-surface rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('settings.restoreModalTitle')}</h3>

            {!importData && !importResult && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('settings.restoreDesc')}
                </p>
                <label className="block w-full py-8 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl text-center cursor-pointer hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const data = await readFileAsJSON(file)
                        if (!validateBackup(data)) {
                          alert(t('settings.invalidBackup'))
                          return
                        }
                        setImportData(data)
                      } catch (err) {
                        alert((err as Error).message)
                      }
                    }}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.chooseFile')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('settings.jsonFile')}</p>
                </label>
                <button
                  onClick={() => setImportModal(false)}
                  className="w-full py-3 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium transition-colors min-h-tap"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}

            {importData && !importResult && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-card text-sm">
                  <p className="text-gray-900 dark:text-white font-medium">
                    {t('settings.restoreSummary', { profiles: importData.profiles.length, tasks: importData.tasks.length, stats: importData.history.length })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('profile.created', { date: new Date(importData.createdAt).toLocaleString('id-ID') })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.restoreMode')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setImportMode('merge')}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                        importMode === 'merge'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {t('settings.restoreMerge')}
                    </button>
                    <button
                      onClick={() => setImportMode('replace')}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                        importMode === 'replace'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {t('settings.restoreReplace')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {importMode === 'merge'
                      ? t('settings.restoreMergeDesc')
                      : t('settings.restoreReplaceDesc')}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setImportData(null)}
                    className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium transition-colors min-h-tap"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={async () => {
                      if (!importData) return
                      setImporting(true)
                      try {
                        const result = await importBackup(importData, importMode)
                        setImportResult(result)
                        setImportData(null)
                      } catch (err) {
                        alert(t('common.error') + ': ' + (err as Error).message)
                      } finally {
                        setImporting(false)
                      }
                    }}
                    disabled={importing}
                    className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium transition-colors min-h-tap"
                  >
                    {importing ? t('settings.restoreProcessing') : t('settings.restoreNow')}
                  </button>
                </div>
              </div>
            )}

            {importResult && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-sm text-primary-700 dark:text-primary-400">
                  <p className="font-medium">{t('settings.restoreSuccess')}</p>
                  <p className="text-xs mt-1">
                    {t('settings.restoreSummary', { profiles: importResult.profiles, tasks: importResult.tasks, stats: importResult.history })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setImportModal(false)
                    setImportResult(null)
                    window.location.reload()
                  }}
                  className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors min-h-tap"
                >
                  {t('settings.reload')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setSyncMessage(t('settings.cloudLoginReady'))}
        />
      )}
    </>
  )
}
