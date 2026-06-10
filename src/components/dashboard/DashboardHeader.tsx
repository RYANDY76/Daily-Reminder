import { useT } from '../../i18n'
import { getTimeGreeting } from '../../dates'
import { Plus, BellOff, CheckSquare } from 'lucide-react'

interface DashboardHeaderProps {
  profileName: string | undefined
  totalTasks: number
  batchMode: boolean
  notificationEnabled: boolean
  onToggleBatchMode: () => void
  onShowAddTask: () => void
  onRequestNotificationPermission: () => void
}

export default function DashboardHeader({
  profileName,
  totalTasks,
  batchMode,
  notificationEnabled,
  onToggleBatchMode,
  onShowAddTask,
  onRequestNotificationPermission
}: DashboardHeaderProps) {
  const t = useT()

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{getTimeGreeting(t)}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{profileName || t('dashboard.welcome')}</p>
      </div>
      <div className="flex items-center gap-2">
        {!batchMode && totalTasks > 0 && (
          <button
            onClick={onToggleBatchMode}
            className="px-3 py-2 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition-all duration-150 min-h-tap flex items-center gap-2"
            aria-label={t('batch.enable')}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">{t('batch.select')}</span>
          </button>
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
