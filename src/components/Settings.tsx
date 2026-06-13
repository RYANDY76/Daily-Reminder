import { useState, useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useBiometricAuth } from '../hooks/useBiometricAuth'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useConfirm } from '../hooks/useConfirm'
import { generatePDF } from '../utils/pdfExport'
import { getLast7DaysHistory, getTasksForDate, getDailyHistory, db, deleteProfile } from '../database'
import { getTodayDate, getLast7Days } from '../dates'
import type { DailyHistory } from '../types'
import { useT } from '../i18n'
import { isAnalyticsEnabled, setAnalyticsEnabled } from '../utils/analytics'
import { AppErrorHandler } from '../utils/errorHandler'
import DisplaySettings from './settings/DisplaySettings'
import NotificationSettings from './settings/NotificationSettings'
import ToggleSwitch from './ToggleSwitch'
import { FileText, ShieldCheck, Download, Trash2, Fingerprint, Lock, Bell, Smartphone, Share2 } from 'lucide-react'

export default function Settings() {
  const profile = useProfileStore((s) => s.currentProfile)

  const [exportScope, setExportScope] = useState<'today' | 'weekly' | 'custom'>('today')
  const [exportOrientation, setExportOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [exportTheme, setExportTheme] = useState<'standard' | 'compact'>('standard')
  const [exportStart, setExportStart] = useState('')
  const [exportEnd, setExportEnd] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportModal, setExportModal] = useState(false)
  const t = useT()
  const [analyticsEnabled, setAnalyticsLocal] = useState(isAnalyticsEnabled())
  const [sentryEnabled, setSentryLocal] = useState(localStorage.getItem('daily_reminder_sentry_enabled') !== 'false')
  const [exportAllLoading, setExportAllLoading] = useState(false)
  const { register, isAvailable, loading: bioLoading } = useBiometricAuth()
  const [bioSupported, setBioSupported] = useState(false)
  const [bioError, setBioError] = useState('')
  const { installPrompt, promptInstall, isStandalone } = useInstallPrompt()
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    isAvailable().then(setBioSupported)
  }, [isAvailable])

  const handleToggleBiometric = async () => {
    if (!profile) return
    if (profile.biometricEnabled) {
      await useProfileStore.getState().updateProfile({ biometricEnabled: false, biometricCredentialId: null })
      return
    }
    setBioError('')
    const credentialId = await register(profile.id)
    if (credentialId) {
      await useProfileStore.getState().updateProfile({ biometricEnabled: true, biometricCredentialId: credentialId })
    } else {
      setBioError('Gagal mendaftarkan biometric. Pastikan perangkat mendukung Face ID / Touch ID.')
    }
  }

  const handleExportAllData = async () => {
    setExportAllLoading(true)
    try {
      const [tasks, profiles, history, habits, moodLogs, pomodoroSessions, goals, connections, sharedTasks, coupleGoals, loveNotes, activityFeed, taskComments] = await Promise.all([
        db.tasks.toArray(),
        db.profiles.toArray(),
        db.history.toArray(),
        db.habits.toArray(),
        db.moodLogs.toArray(),
        db.pomodoroSessions.toArray(),
        db.goals.toArray(),
        db.connections.toArray(),
        db.sharedTasks.toArray(),
        db.coupleGoals.toArray(),
        db.loveNotes.toArray(),
        db.activityFeed.toArray(),
        db.taskComments.toArray()
      ])
      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0',
        tasks, profiles, history, habits, moodLogs, pomodoroSessions, goals,
        connections, sharedTasks, coupleGoals, loveNotes, activityFeed, taskComments
      }
      const json = JSON.stringify(exportData, null, 2)
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `daily-reminder-full-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      AppErrorHandler.logError('EXPORT_ERROR', 'Full data export failed', 'medium', { error: e })
    } finally {
      setExportAllLoading(false)
    }
  }

  const handleDeleteAllData = async () => {
    const ok = await confirm({ title: t('common.confirm'), message: t('settings.deleteAllDataDesc'), variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') })
    if (!ok) return
    try {
      await deleteProfile(profile!.id)
    } catch (e) {
      AppErrorHandler.logError('DELETE_ERROR', 'Failed to delete all data', 'high', { error: e })
    } finally {
      window.location.reload()
    }
  }

  const handleExport = async () => {
    if (!profile) return
    setExporting(true)
    try {
      let tasks: any[] = []
      let history: DailyHistory[] = []
      if (exportScope === 'today') {
        tasks = await getTasksForDate(profile.id, getTodayDate())
      } else if (exportScope === 'weekly') {
        const dates = getLast7Days()
        const allTasks = await Promise.all(dates.map((d) => getTasksForDate(profile.id, d)))
        tasks = allTasks.flat()
        history = await getLast7DaysHistory(profile.id)
      } else if (exportScope === 'custom' && exportStart && exportEnd) {
        const dates: string[] = []
        const start = new Date(exportStart + 'T00:00:00')
        const end = new Date(exportEnd + 'T00:00:00')
        const current = new Date(start)
        while (current <= end) {
          dates.push(current.toISOString().split('T')[0])
          current.setDate(current.getDate() + 1)
        }
        const allTasks = await Promise.all(dates.map((d) => getTasksForDate(profile.id, d)))
        tasks = allTasks.flat()
        const historyResults = await Promise.all(dates.map((d) => getDailyHistory(profile.id, d)))
        history = historyResults.filter((h): h is DailyHistory => h !== null && h !== undefined)
      }
      await generatePDF(profile, tasks, history, {
        scope: exportScope,
        startDate: exportStart || undefined,
        endDate: exportEnd || undefined,
        orientation: exportOrientation,
        theme: exportTheme
      })
    } catch (e) {
      AppErrorHandler.logError('EXPORT_ERROR', 'PDF export failed', 'low', { error: e })
    } finally {
      setExporting(false)
      setExportModal(false)
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />
      <h2 className="page-heading">{t('settings.title')}</h2>

      <section>
        <h3 className="section-title mb-3">{t('settings.display')}</h3>
        <div className="card-border p-4">
          <DisplaySettings />
        </div>
      </section>

      {!isStandalone && (
      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5" />
          {t('install.title')}
        </h3>
        <div className="card-border p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t('install.desc')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('install.settingsDesc')}</p>
            </div>
            {installPrompt ? (
              <button
                onClick={promptInstall}
                className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition-colors shadow-sm shrink-0"
              >
                {t('install.button')}
              </button>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{t('install.browserHint')}</span>
            )}
          </div>
        </div>
      </section>
      )}

      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5" />
          {t('settings.notifications')}
        </h3>
        <div className="card-border p-4">
          <NotificationSettings />
        </div>
      </section>

      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5" />
          {t('settings.security')}
        </h3>
        <div className="card-border divide-y divide-gray-100 dark:divide-dark-border">
          {bioSupported && (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.biometric')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.biometricDesc')}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={!!profile?.biometricEnabled}
                onToggle={handleToggleBiometric}
                disabled={bioLoading}
                ariaLabel={t('settings.biometric')}
              />
            </div>
          )}
          {bioError && (
            <p className="text-xs text-red-500 px-4 pb-3">{bioError}</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5" />
          {t('settings.share')}
        </h3>
        <div className="card-border p-4">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Daily Reminder',
                  text: t('settings.shareText'),
                  url: 'https://daily-reminder-zeta.vercel.app'
                }).catch(() => {})
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {t('settings.shareApp')}
          </button>
          {typeof navigator.share === 'undefined' && (
            <p className="text-xs text-gray-400 text-center mt-2">{t('settings.shareNotSupported')}</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          {t('settings.export')}
        </h3>
        <div className="card-border p-4">
          <button
            onClick={() => setExportModal(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {t('settings.exportBtn')}
          </button>
        </div>
      </section>

      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t('settings.dataPrivacy')}
        </h3>
        <div className="card-border divide-y divide-gray-100 dark:divide-dark-border">
          <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-300">{t('settings.consentTitle')}</p>
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 leading-relaxed">{t('settings.consentText')}</p>
              </div>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.analytics')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.analyticsDesc')}</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={analyticsEnabled}
              onToggle={() => {
                const newVal = !analyticsEnabled
                setAnalyticsLocal(newVal)
                setAnalyticsEnabled(newVal)
              }}
              ariaLabel={t('settings.analytics')}
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.sentry')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.sentryDesc')}</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={sentryEnabled}
              onToggle={() => {
                const newVal = !sentryEnabled
                setSentryLocal(newVal)
                localStorage.setItem('daily_reminder_sentry_enabled', String(newVal))
              }}
              ariaLabel={t('settings.sentry')}
            />
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={handleExportAllData}
              disabled={exportAllLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exportAllLoading ? t('settings.exportGenerating') : t('settings.exportAllData')}
            </button>
            <button
              onClick={handleDeleteAllData}
              className="btn-ghost w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('settings.deleteAllData')}
            </button>
          </div>
        </div>
      </section>

      {/* Export Modal */}
      {exportModal && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('settings.exportModalTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.exportScope')}</label>
                <div className="flex gap-2">
                  {([
                    { value: 'today', label: t('settings.exportToday') },
                    { value: 'weekly', label: t('settings.exportWeekly') },
                    { value: 'custom', label: t('settings.exportCustom') }
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExportScope(opt.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                        exportScope === opt.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {exportScope === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.exportFrom')}</label>
                    <input type="date" value={exportStart} onChange={(e) => setExportStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.exportTo')}</label>
                    <input type="date" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.exportOrientation')}</label>
                <div className="flex gap-2">
                  {([
                    { value: 'portrait', label: t('settings.exportPortrait') },
                    { value: 'landscape', label: t('settings.exportLandscape') }
                  ] as const).map((opt) => (
                    <button key={opt.value} onClick={() => setExportOrientation(opt.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                        exportOrientation === opt.value ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                      }`}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.exportTheme')}</label>
                <div className="flex gap-2">
                  {([
                    { value: 'standard', label: t('settings.exportStandard') },
                    { value: 'compact', label: t('settings.exportCompact') }
                  ] as const).map((opt) => (
                    <button key={opt.value} onClick={() => setExportTheme(opt.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                        exportTheme === opt.value ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                      }`}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setExportModal(false)}
                  className="btn-secondary flex-1">{t('common.cancel')}</button>
                <button onClick={handleExport} disabled={exporting}
                  className="btn-primary flex-1">
                  {exporting ? t('settings.exportGenerating') : t('settings.exportButton', { format: 'PDF' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
