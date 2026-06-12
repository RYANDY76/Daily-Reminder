import { useState, useMemo } from 'react'
import { useT } from '../i18n'
import { useTaskStore } from '../stores/useTaskStore'
import { useProfileStore } from '../stores/useProfileStore'
import { useToast } from '../hooks/useToast'
import { generateDailyPlan, type DailyPlan as DailyPlanType } from '../services/smartSchedule'
import { getSessionFromHour } from '../dates'
import { Sparkles, Clock, Brain, ChevronDown, CheckCircle2, Zap } from 'lucide-react'

interface DailyPlanProps {
  tasks: import('../types').Task[]
  onApplyTime: (taskId: string, time: string) => void
}

const reasonIcons: Record<string, typeof Sparkles> = {
  optimal: Zap,
  priority: Brain,
  balanced: Clock,
  peak: Zap,
  available: Clock,
}

export default function DailyPlan({ tasks, onApplyTime }: DailyPlanProps) {
  const t = useT()
  const { success } = useToast()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const loadTodayTasks = useTaskStore(s => s.loadTodayTasks)
  const [plan, setPlan] = useState<DailyPlanType | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const pendingTasks = useMemo(() => tasks.filter(t => !t.done && !t.snoozedUntil), [tasks])

  const handleGenerate = async () => {
    if (!currentProfile) return
    setLoading(true)
    try {
      const result = await generateDailyPlan(tasks, currentProfile.id)
      setPlan(result)
      setExpanded(true)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!plan) return
    for (const st of plan.scheduledTasks) {
      const session = getSessionFromHour(parseInt(st.suggestedTime.split(':')[0], 10))
      await useTaskStore.getState().updateTask(st.task.id, {
        time: st.suggestedTime,
        session,
      })
    }
    await loadTodayTasks()
    success(t('smartPlan.applied'))
    setPlan(null)
  }

  const handleDismiss = () => {
    setPlan(null)
    setExpanded(false)
  }

  if (!expanded && pendingTasks.length === 0) return null

  return (
    <div className="rounded-2xl border border-purple-200 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-900/10 dark:to-dark-surface overflow-hidden">
      {!plan ? (
        <button
          onClick={handleGenerate}
          disabled={loading || pendingTasks.length === 0 || !currentProfile}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            {loading ? (
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {loading ? t('smartPlan.generating') : t('smartPlan.title')}
            </p>
            {!loading && pendingTasks.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pendingTasks.length} {t('stats.tasksLabel')}
              </p>
            )}
          </div>
          {!loading && pendingTasks.length > 0 && (
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              {t('smartPlan.optimize')}
            </span>
          )}
        </button>
      ) : (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t('smartPlan.title')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('smartPlan.totalTime', { mins: plan.totalEstimatedMinutes })} &middot; {t('smartPlan.confidence')}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="px-3 pb-3 space-y-1">
              {plan.scheduledTasks.map((st) => {
                const ReasonIcon = reasonIcons[st.reason] || Clock
                return (
                  <div
                    key={st.task.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border"
                  >
                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                      st.task.priority === 'high' ? 'bg-red-400' :
                      st.task.priority === 'low' ? 'bg-gray-300 dark:bg-gray-600' :
                      'bg-yellow-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{st.task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-primary-600 dark:text-primary-400 font-medium">
                          {st.suggestedTime}
                        </span>
                        <span className="text-xs text-gray-400">&bull;</span>
                        <span className="text-xs text-gray-400">{st.estimatedMinutes}m</span>
                        <span className="text-xs text-gray-400">&bull;</span>
                        <ReasonIcon className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-500">
                          {t(`smartPlan.reason.${st.reason}`)}
                        </span>
                      </div>
                    </div>
                    {st.suggestedTime !== st.task.time && (
                      <button
                        onClick={() => {
                          onApplyTime(st.task.id, st.suggestedTime)
                          success(t('dashboard.tasksUpdated'))
                        }}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        title={t('smartPlan.apply')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('smartPlan.apply')}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                >
                  {t('smartPlan.dismiss')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
