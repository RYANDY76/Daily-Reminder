import { useState, useEffect } from 'react'
import { useT } from '../../i18n'
import { getTimeGreeting } from '../../dates'
import { getLastNDaysHistory } from '../../database'
import { Plus, BellOff, CheckSquare, Flame } from 'lucide-react'

interface DashboardHeaderProps {
  profileName: string | undefined
  totalTasks: number
  batchMode: boolean
  notificationEnabled: boolean
  profileId: string | null
  onToggleBatchMode: () => void
  onShowAddTask: () => void
  onRequestNotificationPermission: () => void
}

export default function DashboardHeader({
  profileName,
  totalTasks,
  batchMode,
  notificationEnabled,
  profileId,
  onToggleBatchMode,
  onShowAddTask,
  onRequestNotificationPermission
}: DashboardHeaderProps) {
  const t = useT()
  const [time, setTime] = useState(new Date())
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!profileId) return
    getLastNDaysHistory(profileId, 365).then(history => {
      const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))
      let count = 0
      for (const h of sorted) {
        const rate = h.tasksTotal > 0 ? h.tasksDone / h.tasksTotal : 0
        if (rate >= 0.8) count++
        else break
      }
      setStreak(count)
    })
  }, [profileId])

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {getTimeGreeting(t)}
          <span className="text-xs font-normal text-gray-500 dark:text-gray-500 tabular-nums">{timeStr}</span>
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{profileName || t('dashboard.welcome')}</p>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3" />
              {streak} {t('dashboard.streakDays')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!batchMode && totalTasks > 0 && (
          <div className="relative group">
            <button
              onClick={onToggleBatchMode}
              className="px-3 py-2 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition-all duration-150 min-h-tap flex items-center gap-2"
              aria-label={t('batch.enable')}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t('batch.select')}</span>
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                {t('batch.tooltip') || 'Select multiple tasks to perform batch actions'}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={onShowAddTask}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 active:scale-[0.97] text-white rounded-xl text-sm font-semibold transition-all duration-150 min-h-tap flex items-center gap-2 shadow-sm"
          aria-label={t('task.add')}
        >
          <Plus className="w-4 h-4" />
          {t('task.add')}
        </button>
        {!notificationEnabled && (
          <button
            onClick={onRequestNotificationPermission}
            className="w-9 h-9 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 rounded-xl transition-all duration-150 flex items-center justify-center min-h-tap"
            aria-label={t('dashboard.enableNotif')}
            title={t('dashboard.enableNotif')}
          >
            <BellOff className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
