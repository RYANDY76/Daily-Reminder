import { useState } from 'react'
import { useProfileStore } from '../../stores/useProfileStore'
import { useT } from '../../i18n'
import { exportToCSV, exportToJSON } from '../../utils/exportData'
import { getTasksForDate, getLast7DaysHistory, getDailyHistory } from '../../database'
import { getTodayDate, getLast7Days } from '../../dates'
import type { DailyHistory } from '../../types'

export default function ExportSettings() {
  const t = useT()
  const profile = useProfileStore((s) => s.currentProfile)

  const [exportScope, setExportScope] = useState<'today' | 'weekly' | 'custom'>('today')
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf')
  const [exportOrientation, setExportOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [exportTheme, setExportTheme] = useState<'standard' | 'compact'>('standard')
  const [exportStart, setExportStart] = useState('')
  const [exportEnd, setExportEnd] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportModal, setExportModal] = useState(false)

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
        const allTasks = await Promise.all(
          dates.map((d) => getTasksForDate(profile.id, d))
        )
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
        const allTasks = await Promise.all(
          dates.map((d) => getTasksForDate(profile.id, d))
        )
        tasks = allTasks.flat()

        const historyResults = await Promise.all(
          dates.map((d) => getDailyHistory(profile.id, d))
        )
        history = historyResults.filter((h): h is DailyHistory => h !== null && h !== undefined)
      }

      if (exportFormat === 'pdf') {
        const { generatePDF } = await import('../../utils/pdfExport')
        await generatePDF(profile, tasks, history, {
          scope: exportScope,
          startDate: exportStart || undefined,
          endDate: exportEnd || undefined,
          orientation: exportOrientation,
          theme: exportTheme
        })
      } else if (exportFormat === 'csv') {
        exportToCSV(tasks)
      } else if (exportFormat === 'json') {
        exportToJSON(tasks)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
      setExportModal(false)
    }
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.export')}</h3>
        </div>
        <div className="p-4">
          <button
            onClick={() => setExportModal(true)}
            className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors min-h-tap"
          >
            {t('settings.exportBtn')}
          </button>
        </div>
      </div>

      {exportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-6">
          <div className="bg-white dark:bg-dark-surface rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('settings.exportModalTitle')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.exportScope')}
                </label>
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
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('settings.exportFrom')}
                    </label>
                    <input
                      type="date"
                      value={exportStart}
                      onChange={(e) => setExportStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('settings.exportTo')}
                    </label>
                    <input
                      type="date"
                      value={exportEnd}
                      onChange={(e) => setExportEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.exportFormat')}
                </label>
                <div className="flex gap-2">
                  {([
                    { value: 'pdf', label: t('export.pdf') },
                    { value: 'csv', label: t('export.csv') },
                    { value: 'json', label: t('export.json') }
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExportFormat(opt.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                        exportFormat === opt.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {exportFormat === 'pdf' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.exportOrientation')}
                    </label>
                    <div className="flex gap-2">
                      {([
                        { value: 'portrait', label: t('settings.exportPortrait') },
                        { value: 'landscape', label: t('settings.exportLandscape') }
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setExportOrientation(opt.value)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                            exportOrientation === opt.value
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('settings.exportTheme')}
                    </label>
                    <div className="flex gap-2">
                      {([
                        { value: 'standard', label: t('settings.exportStandard') },
                        { value: 'compact', label: t('settings.exportCompact') }
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setExportTheme(opt.value)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                            exportTheme === opt.value
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setExportModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium transition-colors min-h-tap"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium transition-colors min-h-tap"
                >
                  {exporting ? t('settings.exportGenerating') : t('settings.exportButton', { format: exportFormat.toUpperCase() })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
