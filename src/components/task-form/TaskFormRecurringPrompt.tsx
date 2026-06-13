import { useT } from '../../i18n'
import type { Task } from '../../types'

interface Props {
  editTask: Task
  onOnlyToday: () => void
  onAllRecurrences: () => void
  onCancel: () => void
}

export default function TaskFormRecurringPrompt({ editTask, onOnlyToday, onAllRecurrences, onCancel }: Props) {
  const t = useT()

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{t('taskForm.editRecurring')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('taskForm.recurringPrompt', { title: editTask.title })}
        </p>
        <div className="space-y-3">
          <button
            onClick={onOnlyToday}
            className="w-full py-3 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors text-left min-h-tap"
          >
            <span className="font-semibold text-sm">{t('taskForm.onlyToday')}</span>
            <p className="text-xs text-white/70 mt-0.5">{t('taskForm.onlyTodayDesc')}</p>
          </button>
          <button
            onClick={onAllRecurrences}
            className="w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-card transition-colors text-left min-h-tap"
          >
            <span className="font-semibold text-sm">{t('taskForm.allRecurrences')}</span>
            <p className="text-xs text-gray-400 mt-0.5">{t('taskForm.allRecurrencesDesc')}</p>
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm min-h-tap"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
