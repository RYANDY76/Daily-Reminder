import { Sparkles } from 'lucide-react'
import { useT } from '../../i18n'
import { getSessionFromTime } from '../../dates'
import type { SessionType } from '../../types'
import { useProfileStore } from '../../stores/useProfileStore'
import { useTaskStore } from '../../stores/useTaskStore'
import { useToast } from '../../hooks/useToast'
import { suggestOptimalTime } from '../../services/smartSchedule'

interface Props {
  time: string
  isEditing: boolean
  onTimeChange: (time: string) => void
}

const SESSION_TIMES: Record<SessionType, string> = {
  pagi: '08:00',
  siang: '12:30',
  sore: '15:30',
  malam: '19:00'
}

export default function TaskFormTimePicker({ time, isEditing, onTimeChange }: Props) {
  const t = useT()
  const { success: toastSuccess } = useToast()

  const handleSmartSuggest = async () => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile) return
    const todayTasks = useTaskStore.getState().todayTasks
    const result = await suggestOptimalTime('medium' as any, todayTasks, profile.id)
    onTimeChange(result.suggestedTime)
    toastSuccess(t('smartPlan.suggested', { time: result.suggestedTime }))
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor="task-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('task.time')}
        </label>
        <div className="flex gap-2">
          <input
            id="task-time"
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
          />
          {!isEditing && (
            <button
              type="button"
              onClick={handleSmartSuggest}
              className="px-3 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs font-medium flex-shrink-0"
              title={t('smartPlan.suggestTime')}
              aria-label={t('smartPlan.suggestTime')}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="task-session" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('task.session')}
        </label>
        <select
          id="task-session"
          value={getSessionFromTime(time)}
          onChange={(e) => {
            const session = e.target.value as SessionType
            if (!isEditing) onTimeChange(SESSION_TIMES[session])
          }}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
        >
          {(['pagi', 'siang', 'sore', 'malam'] as const).map((s) => (
            <option key={s} value={s}>{t(`session.short${s.charAt(0).toUpperCase() + s.slice(1)}`)}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
