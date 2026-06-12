import { useState, useRef } from 'react'
import { useT } from '../i18n'
import { usePerformance } from '../hooks/usePerformance'
import { useConfirm } from '../hooks/useConfirm'
import { useToast } from '../hooks/useToast'
import type { SessionType, Task } from '../types'
import TaskItem from './TaskItem'
import TaskForm from './TaskForm'
import { useTaskStore } from '../stores/useTaskStore'
import { useProfileStore } from '../stores/useProfileStore'
import { getAllTasksForProfile, saveTask } from '../database'
import { Plus, ChevronDown, CheckCircle2 } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

interface SessionIcon {
  Icon: LucideIcon
  label: string
}

interface SessionCardProps {
  session: SessionType
  tasks: Task[]
  icon: SessionIcon
  batchMode?: boolean
  selectedTasks?: Set<string>
  onToggleSelect?: (taskId: string) => void
}

export default function SessionCard({ session, tasks, icon, batchMode = false, selectedTasks = new Set(), onToggleSelect }: SessionCardProps) {
  const t = useT()
  usePerformance(`SessionCard-${session}`, import.meta.env.DEV)
  
  const { confirm, ConfirmDialog } = useConfirm()
  const { undo } = useToast()
  const sessionLabel = { pagi: t('session.shortPagi'), siang: t('session.shortSiang'), sore: t('session.shortSore'), malam: t('session.shortMalam') }
  const toggleTaskDone = useTaskStore((s) => s.toggleTaskDone)
  const removeTask = useTaskStore((s) => s.removeTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const reorderTasks = useTaskStore((s) => s.reorderTasks)
  const loadTodayTasks = useTaskStore((s) => s.loadTodayTasks)
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const doneCount = tasks.filter((t) => t.done).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0
  const allDone = totalCount > 0 && doneCount === totalCount

  const handleDelete = async (task: Task) => {
    const ok = await confirm({ title: t('common.confirm'), message: t('session.deleteConfirm', { title: task.title }), variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') })
    if (!ok) return
    removeTask(task.id)
    undo(t('session.deleteUndo'), () => {
      saveTask(task).then(() => loadTodayTasks())
    })
  }

  const handleStopRecurring = async (task: Task) => {
    const ok = await confirm({ title: t('common.confirm'), message: t('session.stopRecurringConfirm', { title: task.title }), confirmText: t('common.yes'), cancelText: t('common.cancel') })
    if (!ok) return
    if (task.recurringId) {
      const profile = useProfileStore.getState().currentProfile
      if (profile) {
        const allTasks = await getAllTasksForProfile(profile.id)
        const masterTask = allTasks.find(t => t.id === task.recurringId || (t.isRecurring && t.recurringId === task.recurringId))
        if (masterTask) {
          await updateTask(masterTask.id, { isRecurring: false, recurring: null })
          return
        }
      }
    }
    await updateTask(task.id, { isRecurring: false, recurring: null })
  }

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverIndex.current = index
    setDragOver(true)
  }

  const handleDrop = async () => {
    setDragOver(false)
    if (dragIndex === null || dragOverIndex.current === null) return
    if (dragIndex === dragOverIndex.current) { setDragIndex(null); dragOverIndex.current = null; return }
    const reordered = [...tasks]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dragOverIndex.current, 0, moved)
    await reorderTasks(session, reordered.map(t => t.id))
    setDragIndex(null)
    dragOverIndex.current = null
  }

  const handleDragEnd = () => { setDragOver(false); setDragIndex(null); dragOverIndex.current = null }

  return (
    <>
      <ConfirmDialog />
      <div className={`rounded-2xl transition-all duration-200 overflow-hidden border ${
        allDone
        ? 'border-primary-200 dark:border-primary-800/30 bg-gradient-to-br from-primary-50/60 to-white dark:from-primary-900/10 dark:to-dark-surface'
        : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-200 ${
          allDone ? 'hover:bg-primary-50/40 dark:hover:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-dark-card'
        }`}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {/* Session emoji icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
            allDone
              ? 'bg-primary-100 dark:bg-primary-800/30'
              : 'bg-gray-100 dark:bg-dark-card'
          }`}>
            <icon.Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              {sessionLabel[session]}
              {allDone && (
                <span className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('task.done')}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('session.progress', { done: doneCount, total: totalCount })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {totalCount > 0 && (
            <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full transition-all duration-700 bg-primary-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowForm(true) }}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-dark-card text-gray-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-150 flex items-center justify-center"
            aria-label={t('session.addTaskAria', { session: sessionLabel[session] })}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Task list */}
      {expanded && (
        <div className={`px-3 pb-3 space-y-1 ${dragOver ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <icon.Icon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
                {t('session.empty' + session.charAt(0).toUpperCase() + session.slice(1))}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl"
              >
                {t('session.addTask')}
              </button>
            </div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                draggable={!batchMode}
                onDragStart={() => !batchMode && handleDragStart(index)}
                onDragOver={(e) => !batchMode && handleDragOver(e, index)}
                onDrop={() => !batchMode && handleDrop()}
                onDragEnd={() => !batchMode && handleDragEnd()}
                className={`${dragIndex === index ? 'opacity-40 scale-[0.98]' : ''} transition-all duration-150 ${batchMode ? 'flex items-start gap-2' : ''}`}
              >
                {batchMode && (
                  <button
                    onClick={() => onToggleSelect?.(task.id)}
                    className="mt-4 flex-shrink-0"
                    role="checkbox"
                    aria-checked={selectedTasks.has(task.id)}
                    aria-label={task.title}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedTasks.has(task.id)
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                    }`}>
                      {selectedTasks.has(task.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )}
                <div className={batchMode ? 'flex-1' : ''}>
                  <TaskItem
                    task={task}
                    onToggle={() => {
                      if (batchMode) return
                      const wasDone = task.done
                      toggleTaskDone(task.id)
                      undo(wasDone ? t('session.unmarkUndo') : t('session.markUndo'), () => toggleTaskDone(task.id))
                    }}
                    onEdit={() => !batchMode && setEditTask(task)}
                    onDelete={() => !batchMode && handleDelete(task)}
                    onStopRecurring={task.isRecurring && !batchMode ? () => handleStopRecurring(task) : undefined}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && <TaskForm onClose={() => setShowForm(false)} defaultSession={session} />}
      {editTask && <TaskForm onClose={() => setEditTask(null)} editTask={editTask} />}
    </div>
    </>
  )
}
