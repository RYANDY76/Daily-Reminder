import { useState, useEffect } from 'react'
import { TrendingUp, Trophy, Flame, Target, ChevronDown, ChevronUp } from 'lucide-react'
import { useProfileStore } from '../stores/useProfileStore'
import { getLast7DaysHistory, getHabitsForProfile, getPomodoroSessionsRange } from '../database'
import { getLast7Days, formatDateShort } from '../dates'
import type { DailyHistory, Habit, PomodoroSession } from '../types'
import { useT } from '../i18n'

export default function WeeklyReview() {
  const profile = useProfileStore((s) => s.currentProfile)
  const [history, setHistory] = useState<DailyHistory[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([])
  const [expanded, setExpanded] = useState(false)
  const t = useT()

  useEffect(() => {
    if (!profile) return
    const last7 = getLast7Days()
    const start = last7[0]
    const end = last7[6]
    Promise.all([
      getLast7DaysHistory(profile.id),
      getHabitsForProfile(profile.id),
      getPomodoroSessionsRange(profile.id, start, end)
    ]).then(([hist, h, pomo]) => {
      setHistory(hist)
      setHabits(h)
      setPomodoroSessions(pomo)
    })
  }, [profile])

  if (history.length === 0) return null

  const totalDone = history.reduce((s, h) => s + h.tasksDone, 0)
  const totalTasks = history.reduce((s, h) => s + h.tasksTotal, 0)
  const avgCompletion = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  let bestDay: DailyHistory | null = null
  let bestRate = 0
  for (const h of history) {
    const rate = h.tasksTotal > 0 ? h.tasksDone / h.tasksTotal : 0
    if (rate > bestRate) { bestRate = rate; bestDay = h }
  }

  const workPomos = pomodoroSessions.filter(s => s.type === 'work' && s.completed)
  const totalFocusMinutes = Math.round(workPomos.reduce((s, p) => s + p.duration, 0) / 60)

  const topHabit = habits.reduce<Habit | null>((best, h) => {
    if (!best || h.currentStreak > best.currentStreak) return h
    return best
  }, null)

  const getMessage = () => {
    if (avgCompletion >= 80) return t('weeklyReview.excellent')
    if (avgCompletion >= 60) return t('weeklyReview.good')
    if (avgCompletion >= 40) return t('weeklyReview.average')
    return t('weeklyReview.improve')
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('weeklyReview.title')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getMessage()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-500">{avgCompletion}%</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-dark-border space-y-4 pt-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-3 text-center">
              <Target className="w-4 h-4 text-primary-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-primary-500">{totalDone}</p>
              <p className="text-[10px] text-gray-400">{t('weeklyReview.tasksDone')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-3 text-center">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-orange-500">{workPomos.length}</p>
              <p className="text-[10px] text-gray-400">{t('weeklyReview.pomos')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-3 text-center">
              <Trophy className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-yellow-500">{totalFocusMinutes}</p>
              <p className="text-[10px] text-gray-400">{t('weeklyReview.focusMin')}</p>
            </div>
          </div>

          {/* 7-day mini bar chart */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('weeklyReview.dailyBreakdown')}</p>
            <div className="flex gap-1 h-12 items-end">
              {getLast7Days().map(date => {
                const day = history.find(h => h.date === date)
                const pct = day?.completionPercentage || 0
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-0.5" title={`${formatDateShort(date)}: ${pct}%`}>
                    <div
                      className="w-full rounded-t-sm bg-primary-500 transition-all"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                    <span className="text-[8px] text-gray-400">{formatDateShort(date).split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            {bestDay && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Trophy className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                <span>{t('weeklyReview.bestDayLabel', { date: formatDateShort(bestDay.date), pct: bestDay.completionPercentage })}</span>
              </div>
            )}
            {topHabit && topHabit.currentStreak > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <span>{t('weeklyReview.habitStreak', { name: topHabit.name, days: topHabit.currentStreak })}</span>
              </div>
            )}
            {avgCompletion < 60 && totalTasks > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <TrendingUp className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                <span>{t('weeklyReview.suggestion')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
