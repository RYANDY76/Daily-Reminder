import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Clock, Maximize, Minimize, ListTodo, History, X } from 'lucide-react'
import { useT } from '../i18n'
import { useProfileStore } from '../stores/useProfileStore'
import { useTaskStore } from '../stores/useTaskStore'
import { savePomodoroSession, getPomodoroSessionsRange } from '../database'
import { scheduleAutoCloudSync } from '../services/autoCloudSync'
import type { PomodoroSession } from '../types'
import { getTodayDate, formatDateShort } from '../dates'

type TimerMode = 'work' | 'break'
type PomodoroTab = 'timer' | 'history' | 'settings'

const DEFAULT_WORK = 25
const DEFAULT_BREAK = 5
const DEFAULT_LONG_BREAK = 15
const POMOS_BEFORE_LONG = 4

export default function Pomodoro() {
  const t = useT()
  const profile = useProfileStore((s) => s.currentProfile)
  const todayTasks = useTaskStore((s) => s.todayTasks)

  // Settings
  const [workMinutes, setWorkMinutes] = useState(() => parseInt(localStorage.getItem('pomo_work') || String(DEFAULT_WORK)))
  const [breakMinutes, setBreakMinutes] = useState(() => parseInt(localStorage.getItem('pomo_break') || String(DEFAULT_BREAK)))
  const [longBreakMinutes, setLongBreakMinutes] = useState(() => parseInt(localStorage.getItem('pomo_long') || String(DEFAULT_LONG_BREAK)))

  const WORK_TIME = workMinutes * 60
  const BREAK_TIME = breakMinutes * 60
  const LONG_BREAK_TIME = longBreakMinutes * 60

  const [mode, setMode] = useState<TimerMode>('work')
  const [secondsLeft, setSecondsLeft] = useState(WORK_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [pomoCount, setPomoCount] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const [activeTab, setActiveTab] = useState<PomodoroTab>('timer')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notifiedRef = useRef(false)

  const selectedTask = todayTasks.find(t => t.id === selectedTaskId)

  useEffect(() => {
    setSecondsLeft(WORK_TIME)
  }, [workMinutes])

  useEffect(() => {
    if (profile) {
      const today = getTodayDate()
      const d = new Date()
      d.setDate(d.getDate() - 6)
      const start = d.toISOString().split('T')[0]
      getPomodoroSessionsRange(profile.id, start, today).then(setSessions)
    }
  }, [profile])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const playNotification = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.25)
      setTimeout(() => {
        const o2 = audioCtx.createOscillator()
        const g2 = audioCtx.createGain()
        o2.connect(g2)
        g2.connect(audioCtx.destination)
        o2.frequency.value = 1100
        o2.type = 'sine'
        g2.gain.setValueAtTime(0.3, audioCtx.currentTime)
        o2.start()
        o2.stop(audioCtx.currentTime + 0.25)
      }, 350)
    } catch {}
    if (Notification.permission === 'granted') {
      new Notification(
        mode === 'work' ? t('pomodoro.notifBreakTitle') : t('pomodoro.notifWorkTitle'),
        { body: mode === 'work' ? t('pomodoro.notifWorkEnd') : t('pomodoro.notifBreakEnd'), icon: '/favicon.svg' }
      )
    }
  }, [mode, t])

  const recordSession = useCallback(async (completedMode: TimerMode, duration: number) => {
    if (!profile) return
    const session: PomodoroSession = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      taskId: selectedTaskId,
      taskTitle: selectedTask?.title || t('pomodoro.noTask'),
      date: getTodayDate(),
      startedAt: sessionStartedAt || Date.now(),
      duration,
      type: completedMode,
      completed: true
    }
    await savePomodoroSession(session)
    setSessions(prev => [session, ...prev])
    scheduleAutoCloudSync()
  }, [profile, selectedTaskId, selectedTask, sessionStartedAt, t])

  const startTimer = useCallback(() => {
    clearTimer()
    notifiedRef.current = false
    setSessionStartedAt(Date.now())
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setIsRunning(true)
  }, [clearTimer])

  const pauseTimer = useCallback(() => {
    clearTimer()
    setIsRunning(false)
  }, [clearTimer])

  const resetTimer = useCallback(() => {
    clearTimer()
    setIsRunning(false)
    setSecondsLeft(mode === 'work' ? WORK_TIME : BREAK_TIME)
    notifiedRef.current = false
  }, [clearTimer, mode, WORK_TIME, BREAK_TIME])

  const switchMode = useCallback((newMode: TimerMode) => {
    clearTimer()
    setIsRunning(false)
    setMode(newMode)
    notifiedRef.current = false
    setSecondsLeft(newMode === 'work' ? WORK_TIME : BREAK_TIME)
  }, [clearTimer, WORK_TIME, BREAK_TIME])

  useEffect(() => {
    if (secondsLeft === 0 && !notifiedRef.current) {
      notifiedRef.current = true
      const duration = mode === 'work' ? WORK_TIME : (isLongBreak ? LONG_BREAK_TIME : BREAK_TIME)
      recordSession(mode, duration)
      playNotification()
      if (mode === 'work') {
        const newCount = pomoCount + 1
        setPomoCount(newCount)
        const nextBreak = newCount % POMOS_BEFORE_LONG === 0 ? LONG_BREAK_TIME : BREAK_TIME
        setSecondsLeft(nextBreak)
        setMode('break')
      } else {
        setSecondsLeft(WORK_TIME)
        setMode('work')
      }
    }
  }, [secondsLeft])

  useEffect(() => () => clearTimer(), [clearTimer])

  const isLongBreak = mode === 'break' && pomoCount > 0 && pomoCount % POMOS_BEFORE_LONG === 0
  const currentMax = mode === 'work' ? WORK_TIME : (isLongBreak ? LONG_BREAK_TIME : BREAK_TIME)
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const progress = ((currentMax - secondsLeft) / currentMax) * 100

  const saveSettings = () => {
    localStorage.setItem('pomo_work', String(workMinutes))
    localStorage.setItem('pomo_break', String(breakMinutes))
    localStorage.setItem('pomo_long', String(longBreakMinutes))
    switchMode('work')
  }

  const todaySessions = sessions.filter(s => s.date === getTodayDate())
  const todayWorkMinutes = Math.round(
    todaySessions.filter(s => s.type === 'work' && s.completed).reduce((sum, s) => sum + s.duration, 0) / 60
  )

  const pendingTasks = todayTasks.filter(t => !t.done)

  return (
    <>
      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
          <button
            onClick={() => setFocusMode(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Minimize className="w-6 h-6" />
          </button>
          {selectedTask && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4 max-w-xs truncate">
              <ListTodo className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{selectedTask.title}</span>
            </div>
          )}
          <p className="text-lg text-gray-400 mb-2">
            {mode === 'work' ? t('pomodoro.workMode') : t('pomodoro.breakMode')}
          </p>
          <span className="text-8xl font-bold tabular-nums mb-8">{display}</span>
          <div className="flex gap-4">
            {!isRunning ? (
              <button onClick={startTimer} disabled={secondsLeft === 0}
                className="w-16 h-16 rounded-full bg-primary-500 disabled:opacity-50 flex items-center justify-center">
                <Play className="w-8 h-8 ml-1" />
              </button>
            ) : (
              <button onClick={pauseTimer}
                className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center">
                <Pause className="w-8 h-8" />
              </button>
            )}
            <button onClick={resetTimer}
              className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">{t('pomodoro.count', { count: pomoCount })}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('pomodoro.timerLabel')}</h2>
          <button
            onClick={() => setFocusMode(true)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-tap"
            title={t('pomodoro.focusModeLabel')}
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>

        {/* Today's focus summary */}
        {todaySessions.length > 0 && (
          <div className="flex gap-3">
            <div className="flex-1 card p-3 text-center">
              <p className="text-lg font-bold text-red-500">{todaySessions.filter(s => s.type === 'work').length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('pomodoro.todayPomos')}</p>
            </div>
            <div className="flex-1 card p-3 text-center">
              <p className="text-lg font-bold text-blue-500">{todayWorkMinutes}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('pomodoro.todayMinutes')}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-card p-1 rounded-xl">
          {(['timer', 'history', 'settings'] as PomodoroTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab === 'timer' ? t('pomodoro.tabTimer')
                : tab === 'history' ? t('pomodoro.tabHistory')
                : t('pomodoro.tabSettings')}
            </button>
          ))}
        </div>

        {/* ─── TIMER TAB ─── */}
        {activeTab === 'timer' && (
          <div className="card p-6 space-y-5">
            {/* Mode switcher */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => switchMode('work')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors min-h-tap ${
                  mode === 'work' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1.5" />
                {t('pomodoro.work')}
              </button>
              <button
                onClick={() => switchMode('break')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors min-h-tap ${
                  mode === 'break' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                }`}
              >
                <Coffee className="w-4 h-4 inline mr-1.5" />
                {t('pomodoro.break')}
              </button>
            </div>

            {/* Task selector */}
            <div>
              <button
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm text-gray-600 dark:text-gray-400 hover:border-primary-300 transition-colors"
              >
                <ListTodo className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">
                  {selectedTask ? selectedTask.title : t('pomodoro.selectTask')}
                </span>
                {selectedTask && (
                  <X
                    className="w-3.5 h-3.5 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); setSelectedTaskId(null) }}
                  />
                )}
              </button>
              {showTaskPicker && pendingTasks.length > 0 && (
                <div className="mt-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                  {pendingTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => { setSelectedTaskId(task.id); setShowTaskPicker(false) }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors flex items-center gap-2 ${
                        selectedTaskId === task.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-xs text-gray-400">{task.time}</span>
                      <span className="flex-1 truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Circular Timer */}
            <div className="relative w-48 h-48 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" className="dark:stroke-gray-700" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={mode === 'work' ? '#EF4444' : '#22C55E'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">{display}</span>
                <span className="text-xs text-gray-400 mt-1">
                  {mode === 'work' ? t('pomodoro.workMode') : (isLongBreak ? t('pomodoro.longBreakMode') : t('pomodoro.breakMode'))}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  disabled={secondsLeft === 0}
                  className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white flex items-center justify-center shadow-lg transition-colors"
                  aria-label={t('timer.ariaMulai')}
                >
                  <Play className="w-6 h-6 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="w-14 h-14 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center shadow-lg transition-colors"
                  aria-label={t('timer.ariaJeda')}
                >
                  <Pause className="w-6 h-6" />
                </button>
              )}
              <button
                onClick={resetTimer}
                className="w-14 h-14 rounded-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center transition-colors"
                aria-label={t('timer.ariaReset')}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              {t('pomodoro.count', { count: pomoCount })} · {workMinutes}/{breakMinutes}{t('pomodoro.minLabel')}
            </p>
          </div>
        )}

        {/* ─── HISTORY TAB ─── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t('pomodoro.noHistory')}</p>
              </div>
            ) : (
              sessions.slice(0, 30).map(s => (
                <div key={s.id} className="card p-3.5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    s.type === 'work' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'
                  }`}>
                    {s.type === 'work' ? <Clock className="w-4 h-4 text-red-500" /> : <Coffee className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.taskTitle}</p>
                    <p className="text-xs text-gray-400">{formatDateShort(s.date)} · {Math.round(s.duration / 60)} {t('pomodoro.minLabel')}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    s.type === 'work'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-600'
                  }`}>
                    {s.type === 'work' ? t('pomodoro.work') : t('pomodoro.break')}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {activeTab === 'settings' && (
          <div className="card p-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('pomodoro.customDuration')}</h3>

            {[
              { label: t('pomodoro.settingWork'), value: workMinutes, setter: setWorkMinutes, min: 5, max: 90 },
              { label: t('pomodoro.settingBreak'), value: breakMinutes, setter: setBreakMinutes, min: 1, max: 30 },
              { label: t('pomodoro.settingLongBreak'), value: longBreakMinutes, setter: setLongBreakMinutes, min: 5, max: 60 },
            ].map(({ label, value, setter, min, max }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
                  <span className="text-sm font-bold text-primary-500">{value} {t('pomodoro.minLabel')}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={value}
                  onChange={e => setter(parseInt(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{min}</span>
                  <span>{max}</span>
                </div>
              </div>
            ))}

            <button
              onClick={saveSettings}
              className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm transition-colors"
            >
              {t('pomodoro.applySettings')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
