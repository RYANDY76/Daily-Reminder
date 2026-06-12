import { useState, useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useT } from '../i18n'
import { getTodayDate } from '../dates'
import { getTasksForDateRange } from '../database'
import { db } from '../database'
import SkeletonLoader from './SkeletonLoader'
import { TrendingUp, Trophy, Target, Timer, Flame, BarChart3 } from 'lucide-react'

type Period = 'today' | 'week' | 'month'

interface ProfileStats {
  tasksCompleted: number
  tasksTotal: number
  pomodoroCompleted: number
  focusMinutes: number
  completionRate: number
}

export default function CoupleStats() {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const getPartnerName = useCoupleStore(s => s.getPartnerName)
  const getPartnerId = useCoupleStore(s => s.getPartnerId)
  
  const [period, setPeriod] = useState<Period>('today')
  const [myStats, setMyStats] = useState<ProfileStats>({
    tasksCompleted: 0,
    tasksTotal: 0,
    pomodoroCompleted: 0,
    focusMinutes: 0,
    completionRate: 0
  })
  const [partnerStats, setPartnerStats] = useState<ProfileStats>({
    tasksCompleted: 0,
    tasksTotal: 0,
    pomodoroCompleted: 0,
    focusMinutes: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentProfile && connection && connection.status === 'active') {
      loadStats()
    }
  }, [currentProfile, connection, period])

  const loadStats = async () => {
    if (!currentProfile || !connection) return

    setLoading(true)
    try {
      const partnerId = getPartnerId(currentProfile.id)
      const { startDate, endDate } = getDateRange(period)

      // Load my stats
      const myTasksData = await getTasksForDateRange(currentProfile.id, startDate, endDate)
      const myPomodoros = await db.pomodoroSessions
        .where('profileId')
        .equals(currentProfile.id)
        .filter(s => s.date >= startDate && s.date <= endDate && s.type === 'work' && s.completed)
        .toArray()

      const myTasksCompleted = myTasksData.filter(t => t.done).length
      const myTasksTotal = myTasksData.length
      const myPomodoroCount = myPomodoros.length
      const myFocusMinutes = Math.floor(myPomodoros.reduce((sum, s) => sum + s.duration, 0) / 60)
      const myRate = myTasksTotal > 0 ? Math.round((myTasksCompleted / myTasksTotal) * 100) : 0

      setMyStats({
        tasksCompleted: myTasksCompleted,
        tasksTotal: myTasksTotal,
        pomodoroCompleted: myPomodoroCount,
        focusMinutes: myFocusMinutes,
        completionRate: myRate
      })

      // Load partner stats
      const partnerTasksData = await getTasksForDateRange(partnerId, startDate, endDate)
      const partnerPomodoros = await db.pomodoroSessions
        .where('profileId')
        .equals(partnerId)
        .filter(s => s.date >= startDate && s.date <= endDate && s.type === 'work' && s.completed)
        .toArray()

      const partnerTasksCompleted = partnerTasksData.filter(t => t.done).length
      const partnerTasksTotal = partnerTasksData.length
      const partnerPomodoroCount = partnerPomodoros.length
      const partnerFocusMinutes = Math.floor(partnerPomodoros.reduce((sum, s) => sum + s.duration, 0) / 60)
      const partnerRate = partnerTasksTotal > 0 ? Math.round((partnerTasksCompleted / partnerTasksTotal) * 100) : 0

      setPartnerStats({
        tasksCompleted: partnerTasksCompleted,
        tasksTotal: partnerTasksTotal,
        pomodoroCompleted: partnerPomodoroCount,
        focusMinutes: partnerFocusMinutes,
        completionRate: partnerRate
      })
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load couple stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = (period: Period): { startDate: string; endDate: string } => {
    const today = new Date()
    const endDate = getTodayDate()
    
    if (period === 'today') {
      return { startDate: endDate, endDate }
    } else if (period === 'week') {
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 6)
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate
      }
    } else {
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 29)
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate
      }
    }
  }

  if (!connection || connection.status !== 'active') {
    return (
      <div className="card p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          {t('couple.connectDesc')}
        </p>
      </div>
    )
  }

  const partnerName = getPartnerName(currentProfile?.id || '')
  const combinedTasks = myStats.tasksCompleted + partnerStats.tasksCompleted
  const combinedPomodoros = myStats.pomodoroCompleted + partnerStats.pomodoroCompleted
  const combinedFocusMinutes = myStats.focusMinutes + partnerStats.focusMinutes

  // Calculate who's ahead
  const diff = myStats.completionRate - partnerStats.completionRate
  const isAhead = diff > 0
  const isTied = Math.abs(diff) < 5 // Within 5% is considered tied

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-500" />
            {t('couple.stats')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('couple.statsDesc')}
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-dark-bg rounded-lg">
        <button
          onClick={() => setPeriod('today')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === 'today'
              ? 'bg-white dark:bg-dark-card text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('couple.statsToday')}
        </button>
        <button
          onClick={() => setPeriod('week')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === 'week'
              ? 'bg-white dark:bg-dark-card text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('couple.statsWeek')}
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === 'month'
              ? 'bg-white dark:bg-dark-card text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('couple.statsMonth')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader type="stat" />
          <SkeletonLoader type="card" count={2} />
        </div>
      ) : (
        <>
          {/* Comparison Message */}
          {myStats.tasksTotal > 0 || partnerStats.tasksTotal > 0 ? (
            <div className={`card p-4 bg-gradient-to-r ${
              isTied
                ? 'from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10'
                : isAhead
                ? 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
                : 'from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <Trophy className={`w-6 h-6 ${
                  isTied ? 'text-blue-500' : isAhead ? 'text-green-500' : 'text-orange-500'
                }`} />
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {isTied
                    ? t('couple.tiedScore')
                    : isAhead
                    ? t('couple.youAreAhead', { diff: Math.abs(diff) })
                    : t('couple.partnerAhead', { name: partnerName, diff: Math.abs(diff) })
                  }
                </p>
              </div>
            </div>
          ) : null}

          {/* Combined Stats */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              {t('couple.combinedStats')}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{combinedTasks}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('couple.tasksCompleted')}</p>
              </div>
              <div className="text-center">
                <Timer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{combinedPomodoros}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('couple.pomodorosCompleted')}</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{combinedFocusMinutes}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('couple.focusMinutes')}</p>
              </div>
            </div>
          </div>

          {/* Individual Stats Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* My Stats */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t('couple.yourStats')}
              </h3>
              <div className="space-y-4">
                <StatBar
                  label={t('couple.tasksCompleted')}
                  value={myStats.tasksCompleted}
                  total={myStats.tasksTotal}
                  color="green"
                />
                <StatBar
                  label={t('couple.pomodorosCompleted')}
                  value={myStats.pomodoroCompleted}
                  max={Math.max(myStats.pomodoroCompleted, partnerStats.pomodoroCompleted, 1)}
                  color="blue"
                />
                <StatBar
                  label={t('couple.focusMinutes')}
                  value={myStats.focusMinutes}
                  max={Math.max(myStats.focusMinutes, partnerStats.focusMinutes, 1)}
                  color="purple"
                  suffix="min"
                />
                <div className="pt-2 border-t border-gray-200 dark:border-dark-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('couple.completionRate')}</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {myStats.completionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Stats */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t('couple.partnerStats', { name: partnerName })}
              </h3>
              <div className="space-y-4">
                <StatBar
                  label={t('couple.tasksCompleted')}
                  value={partnerStats.tasksCompleted}
                  total={partnerStats.tasksTotal}
                  color="green"
                />
                <StatBar
                  label={t('couple.pomodorosCompleted')}
                  value={partnerStats.pomodoroCompleted}
                  max={Math.max(myStats.pomodoroCompleted, partnerStats.pomodoroCompleted, 1)}
                  color="blue"
                />
                <StatBar
                  label={t('couple.focusMinutes')}
                  value={partnerStats.focusMinutes}
                  max={Math.max(myStats.focusMinutes, partnerStats.focusMinutes, 1)}
                  color="purple"
                  suffix="min"
                />
                <div className="pt-2 border-t border-gray-200 dark:border-dark-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('couple.completionRate')}</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {partnerStats.completionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Stat Bar Component
interface StatBarProps {
  label: string
  value: number
  total?: number
  max?: number
  color: 'green' | 'blue' | 'purple'
  suffix?: string
}

function StatBar({ label, value, total, max, color, suffix = '' }: StatBarProps) {
  const percentage = total
    ? Math.round((value / total) * 100)
    : max
    ? Math.round((value / max) * 100)
    : 0

  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {value}{suffix}
          {total !== undefined && ` / ${total}`}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
