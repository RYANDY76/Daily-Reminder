import { TASK_COLORS } from '../../types'
import { useT } from '../../i18n'

interface Props {
  color: string
  onChange: (color: string) => void
}

export default function TaskFormColorPicker({ color, onChange }: Props) {
  const t = useT()

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('taskForm.colorLabel')}
      </label>
      <div className="flex gap-2 flex-wrap">
        {TASK_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full transition-all min-h-tap min-w-tap ${
              color === c ? 'ring-2 ring-offset-2 dark:ring-offset-dark-surface ring-primary-500 scale-110' : ''
            }`}
            style={{ backgroundColor: c }}
            aria-label={t('taskForm.colorAria', { color: c })}
          />
        ))}
      </div>
    </div>
  )
}
