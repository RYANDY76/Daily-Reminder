import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { useProfileStore } from '../stores/useProfileStore'
import { getTasksForDateRange } from '../database'
import { PRIORITY_COLORS } from '../types'
import { formatDateShort } from '../dates'
import type { Task } from '../types'
import { ChevronLeft, ChevronRight, ListTodo } from 'lucide-react'
import { useT } from '../i18n'
import TaskForm from './TaskForm'
import { useHolidays } from '../hooks/useHolidays'
import type { PublicHoliday } from '../types'


type ViewMode = 'month' | 'week' | 'agenda'

function getWeekDates(baseDate: Date): string[] {
  const day = baseDate.getDay()
  const start = new Date(baseDate)
  start.setDate(baseDate.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export default function Calendar() {
  const profile = useProfileStore((s) => s.currentProfile)
  const loadTodayTasks = useTaskStore((s) => s.loadTodayTasks)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const t = useT()
  const { holidays, holidaysForDate, loading: holidaysLoading } = useHolidays(currentYear, currentMonth)

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { taskId?: string; date?: string }
      if (detail?.date) setSelectedDate(detail.date)
      if (detail?.taskId) {
        const task = Object.values(tasksByDate).flat().find(tk => tk.id === detail.taskId)
        if (task) setEditTask(task)
      }
    }
    window.addEventListener('open-task', handler)
    return () => window.removeEventListener('open-task', handler)
  }, [tasksByDate])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [currentMonth, currentYear])

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor])

  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
  const dateStr = (day: number) => `${monthStr}-${String(day).padStart(2, '0')}`

  const loadRangeTasks = useCallback((start: string, end: string) => {
    if (!profile) return
    setLoading(true)
    getTasksForDateRange(profile.id, start, end).then((tasks) => {
      const map: Record<string, Task[]> = {}
      for (const tk of tasks) {
        const d = tk.date || start
        if (!map[d]) map[d] = []
        map[d].push(tk)
      }
      setTasksByDate(map)
      setLoading(false)
    })
  }, [profile])

  const loadMonthTasks = useCallback(() => {
    const start = dateStr(1)
    const end = dateStr(new Date(currentYear, currentMonth + 1, 0).getDate())
    loadRangeTasks(start, end)
  }, [currentMonth, currentYear, loadRangeTasks])

  const loadWeekTasks = useCallback(() => {
    loadRangeTasks(weekDates[0], weekDates[6])
  }, [weekDates, loadRangeTasks])

  useEffect(() => {
    if (viewMode === 'month') loadMonthTasks()
    else loadWeekTasks()
  }, [viewMode, loadMonthTasks, loadWeekTasks, profile])

  const agendaItems = useMemo(() => {
    const dates = viewMode === 'month'
      ? Object.keys(tasksByDate).sort()
      : weekDates
    const items: { date: string; task?: Task; holiday?: PublicHoliday }[] = []
    for (const d of dates) {
      for (const h of holidaysForDate(d)) {
        items.push({ date: d, holiday: h })
      }
      for (const tk of (tasksByDate[d] || []).sort((a, b) => a.time.localeCompare(b.time))) {
        items.push({ date: d, task: tk })
      }
    }
    return items
  }, [viewMode, tasksByDate, weekDates, holidays])

  const closeTaskForm = async () => {
    setShowTaskForm(false)
    setEditTask(null)
    if (viewMode === 'month') loadMonthTasks()
    else loadWeekTasks()
    if (selectedDate === todayStr) await loadTodayTasks()
  }

  const prev = () => {
    if (viewMode === 'month') {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1) }
      else setCurrentMonth(currentMonth - 1)
    } else {
      const d = new Date(weekAnchor)
      d.setDate(d.getDate() - 7)
      setWeekAnchor(d)
    }
    setSelectedDate(null)
  }

  const next = () => {
    if (viewMode === 'month') {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1) }
      else setCurrentMonth(currentMonth + 1)
    } else {
      const d = new Date(weekAnchor)
      d.setDate(d.getDate() + 7)
      setWeekAnchor(d)
    }
    setSelectedDate(null)
  }

  const goToday = () => {
    const now = new Date()
    setCurrentMonth(now.getMonth())
    setCurrentYear(now.getFullYear())
    setWeekAnchor(now)
    setSelectedDate(todayStr)
  }

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : []
  const selectedTasksSorted = [...selectedTasks].sort((a, b) => a.time.localeCompare(b.time))

  const dayLabels = [
    t('calendar.dayMin'), t('calendar.daySen'), t('calendar.daySel'),
    t('calendar.dayRab'), t('calendar.dayKam'), t('calendar.dayJum'), t('calendar.daySab')
  ]

  const renderDayCell = (dStr: string, dayNum: number | string, compact = false) => {
    const dayTasks = tasksByDate[dStr] || []
    const dayHolidays = holidaysForDate(dStr)
    const isSelected = selectedDate === dStr
    const isTodayDate = dStr === todayStr
    const isSunday = new Date(dStr + 'T12:00:00').getDay() === 0
    const isHoliday = dayHolidays.length > 0
    const textColor = isHoliday || isSunday
      ? 'text-red-500 dark:text-red-400'
      : isTodayDate ? 'text-primary-600 dark:text-primary-400'
      : 'text-gray-900 dark:text-white'
    return (
      <button
        key={dStr}
        onClick={() => setSelectedDate(isSelected ? null : dStr)}
        className={`relative ${compact ? 'p-2 min-h-[72px]' : 'p-1.5 min-h-[48px]'} flex flex-col items-center transition-colors duration-150 min-h-tap rounded-lg ${
          isSelected ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-300 dark:ring-primary-700'
            : isTodayDate ? 'bg-primary-50 dark:bg-primary-900/10'
            : isHoliday ? 'bg-red-50 dark:bg-red-900/10'
            : 'hover:bg-gray-50 dark:hover:bg-dark-card'
        }`}
      >
        <span className={`text-sm font-medium ${textColor}`}>
          {dayNum}
        </span>
        {isHoliday && !compact && (
          <span className="text-[8px] text-red-500 dark:text-red-400 leading-tight mt-0.5 text-center line-clamp-1 max-w-[50px]">
            {dayHolidays[0].name}
          </span>
        )}
        {(dayTasks.length > 0 || isHoliday) && (
          <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
            {isHoliday && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            {dayTasks.slice(0, compact ? 1 : 3).map((tk, idx) => (
              <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tk.color || PRIORITY_COLORS[tk.priority] }} />
            ))}
          </div>
        )}
      </button>
    )
  }

  const headerLabel = viewMode === 'month'
    ? `${t('calendar.month' + currentMonth)} ${currentYear}`
    : `${formatDateShort(weekDates[0])} – ${formatDateShort(weekDates[6])}`
  const currentHolidayCount = holidays.filter(h => h.date.startsWith(monthStr)).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('calendar.title')}</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 font-medium transition-colors ${viewMode === 'month' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {t('calendar.viewMonth')}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 font-medium transition-colors ${viewMode === 'week' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {t('calendar.viewWeek')}
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 font-medium transition-colors ${viewMode === 'agenda' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {t('calendar.viewAgenda')}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors min-h-tap" aria-label={t('calendar.prevMonth')}>
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{headerLabel}</h3>
            {currentHolidayCount > 0 && (
              <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                {currentHolidayCount} libur
              </span>
            )}
            <button onClick={goToday} className="text-xs px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-100 transition-colors">
              {t('calendar.goToday')}
            </button>
          </div>
          <button onClick={next} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors min-h-tap" aria-label={t('calendar.nextMonth')}>
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {(loading || holidaysLoading) && <p className="text-xs text-gray-400 text-center mb-2">{t('common.loading')}</p>}

        <div className="grid grid-cols-7 mb-1">
          {dayLabels.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {viewMode === 'agenda' ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {agendaItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{t('calendar.noTasks')}</p>
            ) : agendaItems.map((item, idx) => (
              <div key={`${item.date}-${idx}`} className={`flex items-center gap-3 p-3 rounded-lg ${item.holiday ? 'bg-red-50 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-dark-card'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.holiday ? 'bg-red-500' : ''}`} style={item.task ? { backgroundColor: item.task.color || PRIORITY_COLORS[item.task.priority] } : undefined} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${item.holiday ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {item.holiday?.name || item.task?.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDateShort(item.date)}
                    {item.holiday ? ' · Libur Nasional' : ''}
                    {item.task ? ` · ${item.task.time}` : ''}
                  </p>
                </div>
                {item.task && (
                  <button onClick={() => setEditTask(item.task!)} className="text-xs text-primary-500 font-medium">{t('common.edit')}</button>
                )}
              </div>
            ))}
          </div>
        ) : viewMode === 'month' ? (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />
              return renderDayCell(dateStr(day), day)
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((dStr) => renderDayCell(dStr, new Date(dStr + 'T12:00:00').getDate(), true))}
          </div>
        )}

      </div>

      {selectedDate && (
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDateShort(selectedDate)}
                {selectedDate === todayStr && <span className="ml-2 text-xs text-primary-500">{t('calendar.today')}</span>}
              </h3>
              {holidaysForDate(selectedDate).map(h => (
                <p key={h.date} className="text-xs font-medium text-red-500 mt-0.5">{h.name}</p>
              ))}
            </div>
            <button onClick={() => setShowTaskForm(true)} className="px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium transition-colors">
              {t('calendar.addTask')}
            </button>
          </div>

          {selectedTasksSorted.length === 0 ? (
            <div className="text-center py-8">
              <ListTodo className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t('calendar.noTasks')}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedTasksSorted.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setEditTask(task)}
                  className={`flex items-center gap-3 p-3 rounded-lg w-full text-left hover:ring-1 hover:ring-primary-200 dark:hover:ring-primary-800 ${task.done ? 'bg-gray-50 dark:bg-dark-card/30 opacity-60' : 'bg-gray-50 dark:bg-dark-card'}`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.color || PRIORITY_COLORS[task.priority] }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</p>
                    <p className="text-xs text-gray-400">{task.time} · {task.session}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showTaskForm && selectedDate && <TaskForm onClose={closeTaskForm} defaultDate={selectedDate} />}
      {editTask && <TaskForm onClose={closeTaskForm} editTask={editTask} defaultDate={editTask.date} />}
    </div>
  )
}
