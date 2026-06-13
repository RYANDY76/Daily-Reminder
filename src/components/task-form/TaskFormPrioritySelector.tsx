import type { TaskPriority } from '../../types'
import { useT } from '../../i18n'

interface Props {
  priority: TaskPriority
  onChange: (priority: TaskPriority) => void
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

export default function TaskFormPrioritySelector({ priority, onChange }: Props) {
  const t = useT()

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('task.priority')}
      </label>
      <div className="flex gap-2">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
              priority === p
                ? p === 'high'
                  ? 'bg-red-500 text-white'
                  : p === 'medium'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-500 text-white'
                : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
            }`}
          >
            {({ low: t('priority.low'), medium: t('priority.medium'), high: t('priority.high') })[p]}
          </button>
        ))}
      </div>
    </div>
  )
}
