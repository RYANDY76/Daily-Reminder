import { Bookmark } from 'lucide-react'
import { useT } from '../../i18n'

interface Props {
  isEditing: boolean
  hasTitle: boolean
  onCancel: () => void
  onSaveTemplate: () => void
  onSubmit: () => void
}

export default function TaskFormActions({ isEditing, hasTitle, onCancel, onSaveTemplate, onSubmit }: Props) {
  const t = useT()

  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onCancel}
        className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-card transition-colors min-h-tap"
      >
        {t('common.cancel')}
      </button>
      {!isEditing && hasTitle && (
        <button
          onClick={onSaveTemplate}
          className="py-3 px-4 rounded-xl border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors min-h-tap"
          title={t('taskForm.saveAsTemplate')}
          aria-label={t('taskForm.saveAsTemplate')}
        >
          <Bookmark className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={onSubmit}
        className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors min-h-tap"
      >
        {isEditing ? t('common.save') : t('task.add')}
      </button>
    </div>
  )
}
