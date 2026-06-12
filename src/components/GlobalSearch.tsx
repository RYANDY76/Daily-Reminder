import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../stores/useProfileStore'
import { getAllTasksForProfile, db } from '../database'
import { formatDateShort } from '../dates'
import { useT } from '../i18n'
import { PAGE_TO_ROUTE } from '../router'
import type { Task, TaskPriority, Habit, Goal } from '../types'
import { Search, X, CalendarDays, Filter, ListTodo, Target } from 'lucide-react'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

type StatusFilter = 'all' | 'pending' | 'done'

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const t = useT()
  const navigate = useNavigate()
  const profile = useProfileStore((s) => s.currentProfile)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [tagFilter, setTagFilter] = useState('')

  useEffect(() => {
    if (!isOpen || !profile) return
    setQuery('')
    setPriority('all')
    setStatus('all')
    setTagFilter('')
    setLoading(true)
    Promise.all([
      getAllTasksForProfile(profile.id),
      db.habits.where('profileId').equals(profile.id).toArray(),
      db.goals.where('profileId').equals(profile.id).toArray()
    ]).then(([ts, hs, gs]) => {
      setTasks(ts)
      setHabits(hs)
      setGoals(gs)
    }).finally(() => setLoading(false))
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen, profile?.id])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const allTags = useMemo(() => [...new Set(tasks.flatMap(t => t.tags || []))].sort(), [tasks])

  const taskResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks
      .filter((task) => {
        if (q && !task.title.toLowerCase().includes(q) && !(task.notes || '').toLowerCase().includes(q) && !(task.tags || []).some(tag => tag.toLowerCase().includes(q))) return false
        if (priority !== 'all' && task.priority !== priority) return false
        if (status === 'done' && !task.done) return false
        if (status === 'pending' && task.done) return false
        if (tagFilter && !(task.tags || []).includes(tagFilter)) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time))
      .slice(0, 40)
  }, [query, tasks, priority, status, tagFilter])

  const habitResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return habits.filter(h => h.name.toLowerCase().includes(q)).slice(0, 10)
  }, [query, habits])

  const goalResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return goals.filter(g => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)).slice(0, 10)
  }, [query, goals])

  const hasQuery = query.trim().length > 0

  const openTask = (task: Task) => {
    onClose()
    navigate(PAGE_TO_ROUTE.calendar)
    window.dispatchEvent(new CustomEvent('open-task', { detail: { taskId: task.id, date: task.date } }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]">
      <div className="w-full max-w-lg bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden animate-slide-in-up">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
            aria-label={t('search.title')}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary-50 text-primary-500' : 'hover:bg-gray-100 dark:hover:bg-dark-card'}`}
            aria-label={t('search.filters')}
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card" aria-label={t('common.close')}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {showFilters && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border space-y-3 bg-gray-50/50 dark:bg-dark-card/30">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">{t('search.filterPriority')}</p>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${priority === p ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border'}`}
                  >
                    {p === 'all' ? t('search.all') : p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">{t('search.filterStatus')}</p>
              <div className="flex gap-1.5">
                {(['all', 'pending', 'done'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status === s ? 'bg-primary-500 text-white' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border'}`}
                  >
                    {t(`search.status.${s}`)}
                  </button>
                ))}
              </div>
            </div>
            {allTags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">{t('search.filterTag')}</p>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card"
                >
                  <option value="">{t('search.all')}</option>
                  {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <p className="p-6 text-sm text-gray-400 text-center">{t('common.loading')}</p>
          ) : hasQuery && taskResults.length === 0 && habitResults.length === 0 && goalResults.length === 0 ? (
            <p className="p-6 text-sm text-gray-400 text-center">{t('search.noResults')}</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-dark-border">
              {taskResults.length > 0 && (
                <div>
                  {hasQuery && <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tugas</p>}
                  <ul className={hasQuery ? '' : 'divide-y divide-gray-100 dark:divide-dark-border'}>
                    {taskResults.map((task) => (
                      <li key={task.id}>
                        <button
                          onClick={() => openTask(task)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors flex items-start gap-3"
                        >
                          <CalendarDays className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${task.done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDateShort(task.date)} · {task.time} · {task.priority}
                              {task.tags?.length ? ` · ${task.tags.join(', ')}` : ''}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {habitResults.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Kebiasaan</p>
                  {habitResults.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => { onClose(); navigate(PAGE_TO_ROUTE.habits) }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors flex items-start gap-3"
                    >
                      <ListTodo className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{h.name}</p>
                        <p className="text-xs text-gray-400">{h.frequency} · streak {h.currentStreak}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {goalResults.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Target</p>
                  {goalResults.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => { onClose(); navigate(PAGE_TO_ROUTE.goals) }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors flex items-start gap-3"
                    >
                      <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{g.title}</p>
                        <p className="text-xs text-gray-400">{g.targetDate ? `Target: ${g.targetDate}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-dark-border text-[11px] text-gray-400 flex justify-between">
          <span>{t('search.hint')}</span>
          <span>{taskResults.length + habitResults.length + goalResults.length} {t('search.results')}</span>
        </div>
      </div>
    </div>
  )
}
