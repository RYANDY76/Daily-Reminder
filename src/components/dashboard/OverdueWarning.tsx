import { useT } from '../../i18n'
import { AlertCircle } from 'lucide-react'
import { formatDateShort, getTodayDate } from '../../dates'
import type { Task } from '../../types'

interface OverdueWarningProps {
  tasks: Task[]
}

export default function OverdueWarning({ tasks }: OverdueWarningProps) {
  const t = useT()
  const overdueTasks = tasks
    .filter(t => !t.done && t.dueDate && t.dueDate < getTodayDate())
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))

  if (overdueTasks.length === 0) return null

  return (
    <div className="card p-4 border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/5">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">{t('dashboard.overdueTitle')}</h3>
      </div>
      <div className="space-y-1.5">
        {overdueTasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <span className="flex-1 min-w-0 truncate">{task.title}</span>
            <span className="text-xs text-red-400 flex-shrink-0">{formatDateShort(task.dueDate || '')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
