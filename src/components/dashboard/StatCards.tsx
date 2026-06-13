import { useT } from '../../i18n'
import { ListTodo, CheckCircle2, Clock, XCircle } from 'lucide-react'

interface StatCardsProps {
  totalTasks: number
  totalDone: number
  pending: number
  missed: number
}

export default function StatCards({ totalTasks, totalDone, pending, missed }: StatCardsProps) {
  const t = useT()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="card p-4 relative overflow-hidden isolate">
        <div className="absolute -top-3 -right-3 w-12 h-12 bg-gray-100/60 dark:bg-gray-700/20 rounded-full pointer-events-none" />
        <ListTodo className="w-5 h-5 text-gray-400 mb-2 relative" />
        <p className="text-2xl font-extrabold text-gray-900 dark:text-white relative">{totalTasks}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 relative">{t('dashboard.totalTasks')}</p>
      </div>
      <div className="card p-4 relative overflow-hidden isolate border-primary-100 dark:border-primary-800/20">
        <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary-50 dark:bg-primary-900/10 rounded-full pointer-events-none" />
        <CheckCircle2 className="w-5 h-5 text-primary-500 mb-2 relative" />
        <p className="text-2xl font-extrabold text-primary-500 relative">{totalDone}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 relative">{t('stats.done')}</p>
      </div>
      <div className="card p-4 relative overflow-hidden isolate">
        <div className="absolute -top-3 -right-3 w-12 h-12 bg-yellow-50 dark:bg-yellow-900/10 rounded-full pointer-events-none" />
        <Clock className="w-5 h-5 text-yellow-500 mb-2 relative" />
        <p className="text-2xl font-extrabold text-yellow-500 relative">{pending}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 relative">{t('task.pending')}</p>
      </div>
      <div className="card p-4 relative overflow-hidden isolate">
        <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-50 dark:bg-red-900/10 rounded-full pointer-events-none" />
        <XCircle className="w-5 h-5 text-red-400 mb-2 relative" />
        <p className="text-2xl font-extrabold text-red-400 relative">{missed}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 relative">{t('task.missed')}</p>
      </div>
    </div>
  )
}
