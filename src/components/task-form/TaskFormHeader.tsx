import { X } from 'lucide-react'
import { useT } from '../../i18n'

interface Props {
  isEditing: boolean
  onClose: () => void
}

export default function TaskFormHeader({ isEditing, onClose }: Props) {
  const t = useT()

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        {isEditing ? t('task.edit') : t('task.add')}
      </h2>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors min-h-tap min-w-tap flex items-center justify-center"
        aria-label={t('common.close')}
      >
        <X className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  )
}
