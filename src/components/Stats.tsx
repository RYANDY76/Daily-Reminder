import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { useProfileStore } from '../stores/useProfileStore'
import { getLastNDaysHistory, getPomodoroSessionsRange } from '../database'
import { formatDateShort } from '../dates'
import type { DailyHistory, PomodoroSession } from '../types'
import { BarChart3, TrendingUp, Calendar, Flame, Target, Clock, Trophy } from 'lucide-react'

type ViewRange = '7' | '30'

function getDateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - (n - 1))
  return d.toISOString().split('T')[0]
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getLast30Days(): string[] {
  const dates: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export default function Stats() {
  const t = useT()
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const [history, setHistory] = useState<DailyHistory[]>([])
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([])
  const [loading, setLoading] = useState(true)
  const [chartView, setChartView] = useState<'bar' | 'line'>('bar')
  const [range, setRange] = useState<ViewRange>('7')
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null)

  useEffect(() => {
    if (!currentProfile) return
    setLoading(true)
    const n = range === '7' ? 7 : 30
    const start = getDateNDaysAgo(n)
    const end = getTodayDate()
    Promise.all([
      getLastNDaysHistory(currentProfile.id, n),
      getPomodoroSessionsRange(currentProfile.id, start, end)
    ]).then(([hist, pomo]) => {
      setHistory(hist)
      setPomodoroSessions(pomo)
      setLoading(false)
    })
  }, [currentProfile, range])

  const last30Days = getLast30Days()
  const lastNDays = range === '7'
    ? last30Days.slice(-7)
    : last30Days

  const chartData = lastNDays.map((date) => {
    const day = history.find((h) => h.date === date)
    return {
      date: formatDateShort(date),
      rawDate: date,
      total: day?.tasksTotal || 0,
      done: day?.tasksDone || 0,
      missed: day?.tasksMissed || 0,
      completion: day?.completionPercentage || 0
    }
  })

  const totalDoneAll = history.reduce((sum, h) => sum + h.tasksDone, 0)
  const totalTasksAll = history.reduce((sum, h) => sum + h.tasksTotal, 0)
  const avgCompletion = totalTasksAll > 0 ? Math.round((totalDoneAll / totalTasksAll) * 100) : 0

  let bestDay: DailyHistory | null = null
  let bestRate = 0
  for (const h of history) {
    const rate = h.tasksTotal > 0 ? h.tasksDone / h.tasksTotal : 0
    if (rate > bestRate) { bestRate = rate; bestDay = h }
  }

  let streak = 0
  const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date))
  for (const h of sortedHistory) {
    const rate = h.tasksTotal > 0 ? h.tasksDone / h.tasksTotal : 0
    if (rate >= 0.8) streak++
    else break
  }

  // Pomodoro stats
  const workSessions = pomodoroSessions.filter(s => s.type === 'work' && s.completed)
  const totalFocusMinutes = Math.round(workSessions.reduce((sum, s) => sum + s.duration, 0) / 60)
  const totalPomos = workSessions.length

  const maxVal = Math.max(...chartData.map(d => Math.max(d.total, d.done, 1)), 1)

  // Heatmap: last 30 days as a grid
  const heatmapData = last30Days.map(date => {
    const day = history.find(h => h.date === date)
    const pct = day?.completionPercentage || 0
    return { date, pct }
  })

  const getHeatColor = (pct: number) => {
    if (pct === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (pct < 40) return 'bg-primary-100 dark:bg-primary-900/30'
    if (pct < 70) return 'bg-primary-300 dark:bg-primary-700/50'
    if (pct < 90) return 'bg-primary-500 dark:bg-primary-500'
    return 'bg-primary-600 dark:bg-primary-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="page-heading">{t('stats.title')}</h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-card p-1 rounded-2xl">
          {(['7', '30'] as ViewRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-soft'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {r === '7' ? t('stats.range7') : t('stats.range30')}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="stat-label text-sm">{t('stats.productivity')}</p>
          <p className="stat-value text-primary-500">{avgCompletion}%</p>
        </div>
        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary-500 to-primary-400"
            style={{ width: `${avgCompletion}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {avgCompletion >= 80 ? t('stats.excellent') : avgCompletion >= 50 ? t('stats.good') : t('stats.improve')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <Target className="w-4 h-4 text-primary-500 mb-2" />
          <p className="stat-value text-primary-500">{totalDoneAll}</p>
          <p className="stat-label">{t('stats.done')}</p>
        </div>
        <div className="card p-4">
          <Flame className="w-4 h-4 text-orange-500 mb-2" />
          <p className="stat-value text-orange-500">{streak}</p>
          <p className="stat-label">{t('stats.streak')}</p>
        </div>
        <div className="card p-4">
          <Clock className="w-4 h-4 text-blue-500 mb-2" />
          <p className="stat-value text-blue-500">{totalFocusMinutes}</p>
          <p className="stat-label">{t('stats.focusMinutes')}</p>
        </div>
        <div className="card p-4">
          <BarChart3 className="w-4 h-4 text-purple-500 mb-2" />
          <p className="stat-value text-purple-500">{totalPomos}</p>
          <p className="stat-label">{t('stats.pomosCompleted')}</p>
        </div>
      </div>

      {/* 30-day Heatmap */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('stats.heatmap')}</p>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {heatmapData.map(({ date, pct }) => (
            <div
              key={date}
              title={`${formatDateShort(date)}: ${pct}%`}
              className={`h-6 rounded-md ${getHeatColor(pct)} cursor-default transition-colors`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-xs text-gray-400">{t('stats.less')}</span>
          <div className="flex gap-1">
            {['bg-gray-100 dark:bg-gray-800', 'bg-primary-100', 'bg-primary-300', 'bg-primary-500', 'bg-primary-600'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400">{t('stats.more')}</span>
        </div>
      </div>

      {/* Bar/Line Chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {range === '7' ? t('stats.chart7') : t('stats.chart30')}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setChartView('bar')}
              className={`p-2 rounded-lg transition-colors min-h-tap min-w-tap flex items-center justify-center ${
                chartView === 'bar' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' : 'text-gray-400'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartView('line')}
              className={`p-2 rounded-lg transition-colors min-h-tap min-w-tap flex items-center justify-center ${
                chartView === 'line' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' : 'text-gray-400'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {chartData.every((d) => d.total === 0) ? (
          <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
            {t('stats.empty')}
          </div>
        ) : chartView === 'bar' ? (
          <div className="relative">
            <div
              className={`flex items-end gap-1 h-48 px-1 ${range === '30' ? 'gap-0.5' : 'gap-2'}`}
            >
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 relative" onClick={() => setActiveTooltip(activeTooltip === i ? null : i)} onTouchStart={(e) => { e.preventDefault(); setActiveTooltip(activeTooltip === i ? null : i) }}>
                  <div className="flex gap-0.5 items-end w-full justify-center" style={{ height: '160px' }}>
                    <div
                      className="flex-1 rounded-t-sm bg-primary-500 transition-all duration-300"
                      style={{ height: `${(d.done / maxVal) * 100}%`, minHeight: d.done > 0 ? '4px' : '0' }}
                    />
                    <div
                      className="flex-1 rounded-t-sm bg-blue-400 dark:bg-blue-500 transition-all duration-300 opacity-50"
                      style={{ height: `${(d.total / maxVal) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                    />
                  </div>
                  {range === '7' && (
                    <span className="text-[10px] text-gray-400 mt-1">{d.date}</span>
                  )}
                  <div className={`absolute -top-8 ${activeTooltip === i ? 'block' : 'hidden'} bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10`}>
                    {d.date}: {t('stats.itemDone', { done: d.done, total: d.total })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-center mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary-500" /> {t('stats.legendDone')}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 opacity-50" /> {t('stats.legendTotal')}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <svg viewBox="0 0 280 180" className="w-full h-48">
              <line x1="30" y1="10" x2="30" y2="160" stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-700" />
              {[0, 25, 50, 75, 100].map((pct) => (
                <g key={pct}>
                  <line x1="30" y1={160 - (pct / 100) * 150} x2="275" y2={160 - (pct / 100) * 150} stroke="#e5e7eb" strokeWidth="0.5" className="dark:stroke-gray-700" />
                  <text x="24" y={164 - (pct / 100) * 150} textAnchor="end" fontSize="9" fill="#9E9E9E">{pct}</text>
                </g>
              ))}
              {chartData.map((d, i) => {
                const x = 40 + i * (235 / Math.max(chartData.length - 1, 1))
                const y = 160 - (d.completion / 100) * 150
                const prevX = i > 0 ? 40 + (i - 1) * (235 / Math.max(chartData.length - 1, 1)) : null
                const prevY = i > 0 ? 160 - (chartData[i - 1].completion / 100) * 150 : null
                return (
                  <g key={i}>
                    {prevX !== null && prevY !== null && (
                      <line x1={prevX} y1={prevY} x2={x} y2={y} stroke="#1D9E75" strokeWidth="2" />
                    )}
                    <circle cx={x} cy={y} r={range === '30' ? 2 : 4} fill="#1D9E75" className="cursor-pointer" />
                    {range === '7' && (
                      <text x={x} y="175" textAnchor="middle" fontSize="9" fill="#9E9E9E">{d.date}</text>
                    )}
                  </g>
                )
              })}
            </svg>
            <div className="flex gap-4 justify-center mt-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> {t('stats.completion')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Best Day */}
      {bestDay && (
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('stats.bestDay')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDateShort(bestDay.date)} — {bestDay.tasksDone}/{bestDay.tasksTotal} {t('stats.tasksLabel')} ({bestDay.completionPercentage}%)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
