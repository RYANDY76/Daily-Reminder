import { useT } from '../../i18n'

interface Props {
  isRecurring: boolean
  recurringPattern: 'daily' | 'weekly'
  daysOfWeek: number[]
  onRecurringChange: (value: boolean) => void
  onPatternChange: (pattern: 'daily' | 'weekly') => void
  onDayToggle: (day: number) => void
}

export default function TaskFormRecurringConfig({
  isRecurring, recurringPattern, daysOfWeek,
  onRecurringChange, onPatternChange, onDayToggle
}: Props) {
  const t = useT()

  return (
    <div className="border-t border-gray-200 dark:border-dark-border pt-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
            className="sr-only peer"
            aria-label={t('taskForm.enableRecurring')}
          />
          <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-primary-500 transition-colors" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('taskForm.recurring')}
        </span>
      </label>

      {isRecurring && (
        <div className="mt-4 space-y-3 ml-1">
          <div className="flex gap-3">
            <button
              onClick={() => onPatternChange('daily')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-tap ${
                recurringPattern === 'daily'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('taskForm.recurringEveryDay')}
            </button>
            <button
              onClick={() => onPatternChange('weekly')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-tap ${
                recurringPattern === 'weekly'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('taskForm.specificDays')}
            </button>
          </div>

          {recurringPattern === 'weekly' && (
            <div className="flex gap-1.5">
              {[0,1,2,3,4,5,6].map((i) => (
                <button
                  key={i}
                  onClick={() => onDayToggle(i)}
                  className={`w-9 h-9 rounded-full text-xs font-medium transition-colors min-h-tap min-w-tap ${
                    daysOfWeek.includes(i)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                  }`}
                  aria-label={`${t('habits.weekDay'+i)}${daysOfWeek.includes(i) ? t('taskForm.daySelected') : ''}`}
                >
                  {t('habits.weekDay'+i)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
