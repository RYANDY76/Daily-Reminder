import { lazy, useState, useEffect, useRef } from 'react'
import type { Task } from '../types'
import { getTimeDisplay, getTodayDate, formatDateShort } from '../dates'
import { PRIORITY_BG } from '../types'
import { useTaskStore } from '../stores/useTaskStore'
import { useProfileStore } from '../stores/useProfileStore'
import { useT } from '../i18n'
import { useHaptic } from '../hooks/useHaptic'
import { useToast } from '../hooks/useToast'
import { usePerformance } from '../hooks/usePerformance'
import { Check, MoreVertical, Pencil, Trash2, Repeat, FileText, AlertCircle, CalendarX, Play, Pause, Share2, Bell, BellOff, Users, MessageSquare } from 'lucide-react'
import SwipeableCard from './SwipeableCard'

const LazyShareTaskModal = lazy(() => import('./ShareTaskModal'))
const LazyTaskDetailsModal = lazy(() => import('./TaskDetailsModal'))

interface TaskItemProps {
  task: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onStopRecurring?: () => void
}

export default function TaskItem({ task, onToggle, onEdit, onDelete, onStopRecurring }: TaskItemProps) {
  const t = useT()
  usePerformance(`TaskItem-${task.id.slice(0, 8)}`, import.meta.env.DEV)
  
  const { trigger } = useHaptic()
  const { success, info } = useToast()
  const updateTask = useTaskStore((s) => s.updateTask)
  const currentProfile = useProfileStore(s => s.currentProfile)
  const [canShare, setCanShare] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const now = new Date()
  const [h, m] = task.time.split(':').map(Number)
  const taskTime = new Date()
  taskTime.setHours(h, m, 0, 0)
  const isPast = taskTime < now
  const isSnoozed = task.snoozedUntil && task.snoozedUntil > Date.now()
  const isMissed = isPast && !task.done && task.status !== 'missed' && !isSnoozed
  const [showMenu, setShowMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [customSnoozeMinutes, setCustomSnoozeMinutes] = useState('30')
  const [elapsed, setElapsed] = useState(task.timeTracking?.elapsed || 0)
  const [running, setRunning] = useState(task.timeTracking?.running || false)
  const startTimeRef = useRef(task.timeTracking?.startTime || 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // Lazily check couple connection for share feature
  useEffect(() => {
    if (!currentProfile) return
    import('../stores/useCoupleStore').then(({ useCoupleStore }) => {
      const conn = useCoupleStore.getState().connection
      if (conn?.status === 'active') {
        setCanShare(true)
        setPartnerName(useCoupleStore.getState().getPartnerName(currentProfile.id))
      }
    }).catch(() => {})
  }, [currentProfile?.id])

  const handleSnooze = (minutes: number) => {
    const snoozeUntil = Date.now() + minutes * 60 * 1000
    updateTask(task.id, { snoozedUntil: snoozeUntil })
    setShowMenu(false)
    trigger('light')
    info(t('task.snoozedFor', { mins: minutes }))
  }

  const handleUnsnooze = () => {
    updateTask(task.id, { snoozedUntil: null })
    setShowMenu(false)
    trigger('light')
    success(t('task.unsnoozeSuccess'))
  }

  const handleCustomSnooze = () => {
    const minutes = Number(customSnoozeMinutes)
    if (!Number.isFinite(minutes) || minutes < 1) return
    handleSnooze(Math.min(Math.round(minutes), 1440))
  }

  const getTimeColor = () => {
    if (task.done) return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    if (isSnoozed) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    if (isMissed) return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    const [h] = task.time.split(':').map(Number)
    const currentH = new Date().getHours()
    if (h - currentH <= 1 && h - currentH >= 0) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
    return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
  }

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    if (running) {
      setRunning(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      updateTask(task.id, { timeTracking: { startTime: startTimeRef.current, elapsed, running: false } })
    } else {
      setRunning(true)
      startTimeRef.current = Date.now() - elapsed * 1000
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }
  }

  const handleDelete = () => {
    trigger('heavy')
    onDelete()
  }

  const handleSwipeRight = () => {
    trigger('light')
    onEdit()
  }

  const handleSwipeLeft = () => {
    trigger('heavy')
    handleDelete()
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const editAction = (
    <div className="flex items-center gap-2 pl-4">
      <div className="p-2 rounded-lg bg-green-500/20">
        <Pencil className="w-4 h-4 text-green-600 dark:text-green-400" />
      </div>
      <span className="text-white font-medium text-sm">{t('common.edit')}</span>
    </div>
  )

  const deleteAction = (
    <div className="flex items-center gap-2 pr-4">
      <div className="p-2 rounded-lg bg-red-500/20">
        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
      </div>
      <span className="text-white font-medium text-sm">{t('common.delete')}</span>
    </div>
  )

  return (
    <SwipeableCard
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      leftAction={deleteAction}
      rightAction={editAction}
    >
      <div
        className={`group relative flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200 ${
          task.done
            ? 'bg-gray-50 dark:bg-dark-card/30 opacity-70'
            : 'bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-surface border border-gray-100 dark:border-dark-border'
        }`}
        role="listitem"
      >
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 min-h-tap min-w-tap ${
            task.done
              ? 'bg-primary-500 border-primary-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
          }`}
          aria-label={task.done ? t('task.markUndone', { title: task.title }) : t('task.markDone', { title: task.title })}
        >
          {task.done && (
            <Check className="w-3 h-3 text-white" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md transition-all ${getTimeColor()}`}>
              {getTimeDisplay(task.time)}
            </span>
            {task.priority && task.priority !== 'medium' && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${PRIORITY_BG[task.priority]}`}>
                <AlertCircle className="w-3 h-3" />
                {({low: t('priority.low'), medium: t('priority.medium'), high: t('priority.high')})[task.priority]}
              </span>
            )}
            {task.isRecurring && (
              <span className="text-xs text-primary-500" title={t('task.recurring')}>
                <Repeat className="w-3 h-3 inline" />
              </span>
            )}
            {task.done && (
              <span className="text-xs text-primary-500">{t('task.done')}</span>
            )}
            {isSnoozed && (
              <span className="text-xs font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <BellOff className="w-3 h-3" />
                {t('task.snoozed')}
              </span>
            )}
            {isMissed && (
              <span className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                {t('task.missed')}
              </span>
            )}
            {task.isShared && (
              <span className="text-xs font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Users className="w-3 h-3" />
                {partnerName}
              </span>
            )}
            {task.commentCount ? (
              <span className="text-xs font-medium text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-md flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setShowDetailsModal(true); }}>
                <MessageSquare className="w-3 h-3" />
                {task.commentCount}
              </span>
            ) : null}
          </div>

          <p className={`text-sm font-medium mt-1 ${
            task.done
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          }`}>
            {task.title}
          </p>

          {task.notes && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1 flex items-center gap-1">
              <FileText className="w-3 h-3 flex-shrink-0" />
              {task.notes}
            </p>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {task.subtasks.slice(0, 3).map((st) => (
                <div key={st.id} className="flex items-center gap-1.5 text-xs">
                  <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${st.done ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {st.done && <Check className="w-2 h-2 text-white" />}
                  </div>
                  <span className={st.done ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}>
                    {st.title}
                  </span>
                </div>
              ))}
              {task.subtasks.length > 3 && (
                <p className="text-xs text-gray-400">{t('task.moreCount', { count: task.subtasks.length - 3 })}</p>
              )}
            </div>
          )}
          {!task.done && (
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={toggleTimer}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                  running
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                }`}
              >
                {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {running ? t('timer.stop') : elapsed > 0 ? t('timer.resume') : t('timer.start')}
              </button>
              {elapsed > 0 && (
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {formatElapsed(elapsed)}
                </span>
              )}
            </div>
          )}
          {task.dueDate && task.dueDate !== task.date && !task.done && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              task.dueDate < getTodayDate()
                ? 'text-red-500'
                : task.dueDate === getTodayDate()
                ? 'text-yellow-500'
                : 'text-gray-400'
            }`}>
              <CalendarX className="w-3 h-3" />
              {task.dueDate < getTodayDate()
                ? t('task.overdue', { date: formatDateShort(task.dueDate) })
                : task.dueDate === getTodayDate()
                ? t('task.deadlineToday')
                : t('task.deadline', { date: formatDateShort(task.dueDate) })}
            </p>
          )}
        </div>

        <div className="relative flex items-center">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 min-h-tap min-w-tap flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={t('task.menu', { title: task.title })}
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg py-1 min-w-[180px] animate-fade-up overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); onEdit() }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowDetailsModal(true) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t('task.comments')}
                </button>
                {!task.done && (
                  <>
                    {isSnoozed ? (
                      <button
                        onClick={handleUnsnooze}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        {t('task.unsnooze')}
                      </button>
                    ) : (
                      <>
                        <div className="px-4 py-1.5">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('task.snooze')}</p>
                        </div>
                        <button
                          onClick={() => handleSnooze(5)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                        >
                          <BellOff className="w-3.5 h-3.5 text-gray-400" />
                          {t('task.snooze5')}
                        </button>
                        <button
                          onClick={() => handleSnooze(10)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                        >
                          <BellOff className="w-3.5 h-3.5 text-gray-400" />
                          {t('task.snooze10')}
                        </button>
                        <button
                          onClick={() => handleSnooze(15)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                        >
                          <BellOff className="w-3.5 h-3.5 text-gray-400" />
                          {t('task.snooze15')}
                        </button>
                        <div className="px-4 py-2 flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={1440}
                            value={customSnoozeMinutes}
                            onChange={(e) => setCustomSnoozeMinutes(e.target.value)}
                            className="w-20 px-2 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                            aria-label={t('task.customSnoozeMinutes')}
                          />
                          <button
                            onClick={handleCustomSnooze}
                            className="flex-1 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            {t('task.customSnooze')}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
                {onStopRecurring && (
                  <button
                    onClick={() => { setShowMenu(false); onStopRecurring() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    {t('common.stopRecurring')}
                  </button>
                )}
                {canShare && (
                  <button
                    onClick={() => { 
                      setShowMenu(false)
                      setShowShareModal(true)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {t('couple.shareTask')}
                  </button>
                )}
                <hr className="border-gray-100 dark:border-dark-border mx-2" />
                <button
                  onClick={() => {
                    setShowMenu(false)
                    const text = `[${task.title}]\n${task.time}${task.notes ? `\n${task.notes}` : ''}`
                    if (navigator.share) {
                      navigator.share({ title: task.title, text })
                    } else {
                      navigator.clipboard.writeText(text)
                      success(t('common.copied'))
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-gray-400" />
                  {t('common.share')}
                </button>
                <button
                  onClick={() => { setShowMenu(false); handleDelete() }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-150 min-h-tap flex items-center gap-2.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('common.delete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Share Task Modal (lazily loaded) */}
      {showShareModal && (
        <LazyShareTaskModal
          task={task}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {showDetailsModal && (
        <LazyTaskDetailsModal
          task={task}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </SwipeableCard>
  )
}
