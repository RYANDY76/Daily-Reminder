import { useT } from '../../i18n'
import { X } from 'lucide-react'

interface BatchModeBarProps {
  selectedTasks: Set<string>
  onDeselectAll: () => void
  onToggleBatchMode: () => void
  onSelectAll: () => void
  onMarkDone: () => void
  onMarkUndone: () => void
  onDelete: () => void
}

export default function BatchModeBar({
  selectedTasks,
  onDeselectAll,
  onToggleBatchMode,
  onSelectAll,
  onMarkDone,
  onMarkUndone,
  onDelete
}: BatchModeBarProps) {
  const t = useT()

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl p-4 animate-slide-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {selectedTasks.size} {t('batch.selected')}
          </span>
          {selectedTasks.size > 0 && (
            <button
              onClick={onDeselectAll}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {t('batch.deselectAll')}
            </button>
          )}
        </div>
        <button
          onClick={onToggleBatchMode}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {selectedTasks.size === 0 ? (
        <button
          onClick={onSelectAll}
          className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          {t('batch.selectAll')}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onMarkDone}
            className="py-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
          >
            {t('batch.markDone')}
          </button>
          <button
            onClick={onMarkUndone}
            className="py-2 text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
          >
            {t('batch.markUndone')}
          </button>
          <button
            onClick={onDelete}
            className="py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            {t('batch.delete')}
          </button>
        </div>
      )}
    </div>
  )
}
