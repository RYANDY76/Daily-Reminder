import { useT } from '../../i18n'

interface ProgressBarProps {
  progress: number
  totalTasks: number
  totalDone: number
}

export default function ProgressBar({ progress, totalTasks, totalDone }: ProgressBarProps) {
  const t = useT()

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('dashboard.progress')}</span>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {totalTasks > 0 ? t('dashboard.progressLabel', { done: totalDone, total: totalTasks }) : t('dashboard.noTasks')}
          </p>
        </div>
        <span className={`text-lg font-extrabold ${progress === 100 ? 'text-primary-500' : 'text-gray-700 dark:text-gray-200'}`}>
          {progress}%
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            progress === 100 ? 'bg-gradient-to-r from-primary-400 to-primary-600' : 'bg-primary-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
