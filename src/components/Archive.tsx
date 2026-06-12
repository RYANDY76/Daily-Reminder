import { useState, useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { getAllTasksForProfile } from '../database'
import { getTodayDate, formatDateShort } from '../dates'
import type { Task } from '../types'
import { CheckCircle2, ArchiveIcon } from 'lucide-react'
import { useT } from '../i18n'

function sortByUpdatedAt(a: Task, b: Task): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export default function Archive() {
  const t = useT()
  const profile = useProfileStore((s) => s.currentProfile)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDone, setFilterDone] = useState(true)

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    getAllTasksForProfile(profile.id).then((all) => {
      setTasks(all)
      setLoading(false)
    })
  }, [profile])

  const doneTasks = tasks.filter(t => t.done).sort(sortByUpdatedAt)
  const allTasks = filterDone
    ? doneTasks
    : tasks.filter(t => !t.done).sort(sortByUpdatedAt)

  const grouped: Record<string, Task[]> = {}
  for (const t of allTasks) {
    const key = t.date || getTodayDate()
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        {t('archive.selectProfile')}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('archive.title')}</h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterDone(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-tap ${
              filterDone
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
            }`}
          >
            {t('archive.filterDone')}
          </button>
          <button
            onClick={() => setFilterDone(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-tap ${
              !filterDone
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
            }`}
          >
            {t('archive.filterUndone')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">{t('common.loading')}</div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-20">
          <ArchiveIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {filterDone ? t('archive.emptyDone') : t('archive.emptyAll')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                {formatDateShort(date)}
                {date === getTodayDate() && (
                  <span className="ml-2 text-primary-500 normal-case">{t('calendar.today')}</span>
                )}
              </h3>
              <div className="space-y-1">
                {grouped[date].map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        task.done
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {task.time}
                        {task.session && ` · ${task.session}`}
                        {task.dueDate && task.dueDate !== task.date && (
                          <span className="ml-1"> · {t('task.deadline', { date: task.dueDate })}</span>
                        )}
                      </p>
                    </div>
                    {task.done && (
                      <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
