import { useState, useEffect, useRef } from 'react'
import { useT } from '../i18n'
import type { Task, RecurringConfig, SessionType, TaskPriority } from '../types'
import { getSessionFromTime, getTodayDate } from '../dates'
import { TASK_COLORS } from '../types'
import { useTaskStore } from '../stores/useTaskStore'
import { useAppStore } from '../stores/useAppStore'
import { useProfileStore } from '../stores/useProfileStore'
import { useToast } from '../hooks/useToast'
import { saveTask } from '../database'
import { suggestOptimalTime } from '../services/smartSchedule'
import { parseNaturalLanguage } from '../utils/naturalLanguageParser'
import { hasTimeIndicator, hasDateIndicator } from '../utils/naturalLanguage'
import { getTemplates, saveTemplate, deleteTemplate, type TaskTemplate } from '../utils/templates'
import { z } from 'zod'
import { X, Sparkles, Bookmark, ChevronDown, Mic } from 'lucide-react'
import { sanitizeInput } from '../utils/sanitize'

const taskSchema = z.object({
  title: z.string().min(1, 'taskForm.validationTitle').max(100, 'taskForm.validationTitleMax'),
  notes: z.string().max(500, 'taskForm.validationNotesMax').optional(),
})

interface TaskFormProps {
  onClose: () => void
  editTask?: Task | null
  defaultSession?: SessionType
  defaultDate?: string
}

export default function TaskForm({ onClose, editTask, defaultSession, defaultDate }: TaskFormProps) {
  const t = useT()
  const { success: toastSuccess } = useToast()
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)

  const [title, setTitle] = useState(editTask?.title || '')
  const [time, setTime] = useState(editTask?.time || '08:00')
  const [notes, setNotes] = useState(editTask?.notes || '')
  const [priority, setPriority] = useState<TaskPriority>(editTask?.priority || 'medium')
  const [tags, setTags] = useState<string[]>(editTask?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [color, setColor] = useState(editTask?.color || TASK_COLORS[0])
  const taskDate = editTask?.date || defaultDate || getTodayDate()
  const [dueDate, setDueDate] = useState(editTask?.dueDate || taskDate)
  const [isRecurring, setIsRecurring] = useState(editTask?.isRecurring || false)
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly'>(
    (editTask?.recurring?.pattern as 'daily' | 'weekly') || 'daily'
  )
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    editTask?.recurring?.daysOfWeek || []
  )
  const [error, setError] = useState('')
  const [recurringEditMode, setRecurringEditMode] = useState<'today' | 'all' | null>(null)
  const [naturalInput, setNaturalInput] = useState('')
  const [showNaturalPreview, setShowNaturalPreview] = useState(false)
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; done: boolean }[]>(editTask?.subtasks || [])
  const [subtaskInput, setSubtaskInput] = useState('')
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(() => !!editTask)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const profile = useProfileStore((s) => s.currentProfile)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isEditingRecurring = editTask?.isRecurring && editTask?.recurring !== null

  // Tutup form saat event close-modals dikirim (dari Escape shortcut)
  useEffect(() => {
    const handler = () => onClose()
    document.addEventListener('close-modals', handler)
    return () => document.removeEventListener('close-modals', handler)
  }, [onClose])

  const startVoiceInput = () => {
    setVoiceError('')

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceError(t('voice.notSupported'))
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }

    try {
      const recognition = new SR()
      recognition.lang = useAppStore.getState().lang === 'en' ? 'en-US' : 'id-ID'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.continuous = false

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        const parsed = parseNaturalLanguage(transcript)
        if (parsed.title && parsed.title !== t('voice.defaultTitle')) {
          setTitle(sanitizeInput(parsed.title))
        }
        if (parsed.time) setTime(parsed.time)
        if (parsed.date) setDueDate(parsed.date)
        setIsListening(false)
        setVoiceError('')
        recognitionRef.current = null
      }

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (import.meta.env.DEV) console.error('Speech error:', e.error)
        setIsListening(false)
        recognitionRef.current = null
        if (e.error === 'not-allowed') {
          setVoiceError(t('voice.microphoneBlocked'))
        } else if (e.error === 'no-speech') {
          setVoiceError(t('voice.noSpeech'))
        } else if (e.error === 'network') {
          setVoiceError(t('voice.networkError'))
        } else {
          setVoiceError('Error: ' + e.error)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error('Voice start error:', err)
      const errMessage = err instanceof Error ? err.message : 'Unknown error'
      setVoiceError(t('taskForm.voiceStartError', { error: errMessage }))
      setIsListening(false)
    }
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setIsListening(false)
  }

  useEffect(() => {
    if (defaultSession && !editTask) {
      const sessionTimes: Record<SessionType, string> = {
        pagi: '08:00',
        siang: '12:30',
        sore: '15:30',
        malam: '19:00'
      }
      setTime(sessionTimes[defaultSession])
    }
  }, [defaultSession, editTask])

  useEffect(() => {
    if (profile) {
      setTemplates(getTemplates(profile.id))
    }
  }, [profile])

  const handleSaveAsTemplate = () => {
    if (!profile || !title.trim()) return
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      name: title.trim(),
      title: title.trim(),
      time,
      session: getSessionFromTime(time),
      notes,
      color,
      priority,
      tags,
      createdAt: Date.now()
    }
    saveTemplate(template)
    setTemplates(getTemplates(profile.id))
  }

  const handleUseTemplate = (template: TaskTemplate) => {
    setTitle(template.title)
    setTime(template.time)
    setNotes(template.notes)
    setColor(template.color)
    setPriority(template.priority)
    setTags(template.tags)
    setShowTemplates(false)
  }

  const handleSubmit = async () => {
    try {
      taskSchema.parse({ title: title.trim(), notes })
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(t(err.issues[0].message))
      }
      return
    }

    if (isRecurring && recurringPattern === 'weekly' && daysOfWeek.length === 0) {
      setError(t('taskForm.validationDays'))
      return
    }

    setError('')

    if (isEditingRecurring && !recurringEditMode) {
      setRecurringEditMode('today')
      return
    }

    const recurringConfig: RecurringConfig | null = isRecurring
      ? { pattern: recurringPattern, daysOfWeek: recurringPattern === 'daily' ? [] : daysOfWeek }
      : null

    try {
      if (editTask) {
        if (isEditingRecurring && recurringEditMode === 'today') {
          const copyTask: Task = {
            ...editTask,
            id: crypto.randomUUID(),
            isRecurring: false,
            recurring: null,
            recurringId: null,
            title: title.trim(),
            time,
            notes,
            color,
            priority,
            tags,
            dueDate,
            session: getSessionFromTime(time),
            date: getTodayDate(),
            updatedAt: Date.now()
          }
          await saveTask(copyTask)
          // Reload tasks agar UI langsung update
          await updateTask(editTask.id, {})
        } else {
          await updateTask(editTask.id, {
            title: title.trim(),
            time,
            session: getSessionFromTime(time),
            notes,
            color,
            priority,
            tags,
            subtasks,
            dueDate,
            isRecurring,
            recurring: recurringConfig
          })
        }
      } else {
        await addTask({
          title: title.trim(),
          time,
          notes,
          color,
          priority,
          tags,
          subtasks,
          date: taskDate,
          dueDate,
          recurring: recurringConfig
        })
      }
      onClose()
    } catch {
      setError(t('taskForm.saveError'))
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  if (isEditingRecurring && !recurringEditMode) {
    return (
      <div className="modal-overlay">
        <div className="modal-content p-6 max-w-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{t('taskForm.editRecurring')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t('taskForm.recurringPrompt', { title: editTask.title })}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setRecurringEditMode('today')
                setTimeout(() => handleSubmit(), 0)
              }}
              className="w-full py-3 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors text-left min-h-tap"
            >
              <span className="font-semibold text-sm">{t('taskForm.onlyToday')}</span>
              <p className="text-xs text-white/70 mt-0.5">{t('taskForm.onlyTodayDesc')}</p>
            </button>
            <button
              onClick={() => {
                setRecurringEditMode('all')
                setTimeout(() => handleSubmit(), 0)
              }}
              className="w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-card transition-colors text-left min-h-tap"
            >
              <span className="font-semibold text-sm">{t('taskForm.allRecurrences')}</span>
              <p className="text-xs text-gray-400 mt-0.5">{t('taskForm.allRecurrencesDesc')}</p>
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm min-h-tap"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay items-end md:items-center">
      <div
        className="modal-content p-6 max-w-lg max-h-[90vh]"
        role="dialog"
        aria-label={editTask ? t('task.edit') : t('task.add')}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {editTask ? t('task.edit') : t('task.add')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors min-h-tap min-w-tap flex items-center justify-center"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {!editTask && (
            <div>
              <label htmlFor="task-quick" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('taskForm.quickInput')}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                  <input
                    id="task-quick"
                    type="text"
                    value={naturalInput}
                    onChange={(e) => {
                      setNaturalInput(sanitizeInput(e.target.value))
                      if (hasTimeIndicator(e.target.value) || hasDateIndicator(e.target.value)) {
                        const parsed = parseNaturalLanguage(e.target.value)
                        if (parsed.time) setTime(parsed.time)
                        if (parsed.date) setDueDate(parsed.date)
                        if (parsed.title) setTitle(parsed.title)
                        setShowNaturalPreview(true)
                      } else {
                        setShowNaturalPreview(false)
                      }
                    }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && naturalInput.trim()) {
                      e.preventDefault()
                      const parsed = parseNaturalLanguage(naturalInput)
                      if (parsed.title) setTitle(parsed.title)
                      if (parsed.time) setTime(parsed.time)
                      if (parsed.date) setDueDate(parsed.date)
                      setNaturalInput('')
                      setShowNaturalPreview(false)
                    }
                  }}
                  placeholder={t('taskForm.quickPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors text-sm"
                />
                </div>
                <button
                  type="button"
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  className={`px-3 py-3 rounded-xl border transition-colors min-h-tap ${
                    isListening
                      ? 'bg-red-500 border-red-500 text-white animate-pulse'
                      : 'border-gray-300 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card'
                  }`}
                  aria-label={isListening ? t('voice.stop') : t('voice.start')}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
              {showNaturalPreview && (
                <div aria-live="polite" className="mt-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-xs text-primary-700 dark:text-primary-300">
                  <span className="font-medium">{t('taskForm.preview')}</span> {title} · {time} · {dueDate}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">{t('taskForm.quickHint')}</p>
              {isListening && (
                <p aria-live="polite" className="text-xs text-red-500 mt-1 animate-pulse">{t('voice.listening')}</p>
              )}
              {voiceError && (
                <p role="alert" className="text-xs text-red-500 mt-1">{voiceError}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('task.title')} <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(sanitizeInput(e.target.value))}
              placeholder={t('taskForm.titlePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              autoFocus
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('task.time')}
              </label>
              <div className="flex gap-2">
                <input
                  id="task-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                />
                {!editTask && (
                  <button
                    type="button"
                    onClick={async () => {
                      const profile = useProfileStore.getState().currentProfile
                      if (!profile) return
                      const todayTasks = useTaskStore.getState().todayTasks
                      const result = await suggestOptimalTime(priority, todayTasks, profile.id)
                      setTime(result.suggestedTime)
                      toastSuccess(t('smartPlan.suggested', { time: result.suggestedTime }))
                    }}
                    className="px-3 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs font-medium flex-shrink-0"
                    title={t('smartPlan.suggestTime')}
                    aria-label={t('smartPlan.suggestTime')}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="task-session" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('task.session')}
              </label>
              <select
                id="task-session"
                value={getSessionFromTime(time)}
                onChange={(e) => {
                  const session = e.target.value as SessionType
                  const sessionTimes: Record<SessionType, string> = {
                    pagi: '08:00',
                    siang: '12:30',
                    sore: '15:30',
                    malam: '19:00'
                  }
                  if (!editTask) setTime(sessionTimes[session])
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              >
                {(['pagi', 'siang', 'sore', 'malam'] as const).map((s) => (
                  <option key={s} value={s}>{t(`session.short${s.charAt(0).toUpperCase() + s.slice(1)}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-duedate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('task.dueDate')}
            </label>
            <input
              id="task-duedate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="task-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('task.notes')}
            </label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(sanitizeInput(e.target.value))}
              placeholder={t('taskForm.notesPlaceholder')}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors resize-none"
              maxLength={500}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-dark-border px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors min-h-tap"
            aria-expanded={showAdvanced}
          >
            <span>{t('taskForm.advancedDetails')}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-1">
              {!editTask && templates.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 min-h-tap"
                    aria-expanded={showTemplates}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>{t('taskForm.useTemplate')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                  </button>
                  {showTemplates && (
                    <div className="mt-2 space-y-1">
                      {templates.map(tmpl => (
                        <div key={tmpl.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card">
                          <button
                            type="button"
                            onClick={() => handleUseTemplate(tmpl)}
                            className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300"
                          >
                            {tmpl.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => { deleteTemplate(tmpl.id); setTemplates(getTemplates(profile!.id)) }}
                            className="text-gray-400 hover:text-red-500 min-h-tap p-1"
                            aria-label={t('taskForm.deleteTemplate', { name: tmpl.name })}
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('task.subtasks')}
            </label>
            <div className="space-y-2">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => setSubtasks(subtasks.map(s => s.id === st.id ? { ...s, done: !s.done } : s))}
                    className="w-4 h-4 text-primary-600 rounded"
                    aria-label={st.title}
                  />
                  <span className={`flex-1 text-sm ${st.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {st.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubtasks(subtasks.filter(s => s.id !== st.id))}
                    className="text-gray-400 hover:text-red-500 min-h-tap"
                    aria-label={t('taskForm.deleteSubtask', { title: st.title })}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && subtaskInput.trim()) {
                      e.preventDefault()
                      setSubtasks([...subtasks, { id: crypto.randomUUID(), title: subtaskInput.trim(), done: false }])
                      setSubtaskInput('')
                    }
                  }}
                  placeholder={t('taskForm.addSubtask')}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('task.priority')}
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors min-h-tap ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-red-500 text-white'
                        : p === 'medium'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {({ low: t('priority.low'), medium: t('priority.medium'), high: t('priority.high') })[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('task.tags')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary-800 dark:hover:text-primary-200 min-h-tap min-w-tap flex items-center justify-center"
                    aria-label={t('taskForm.deleteTag', { tag })}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={t('taskForm.tagPlaceholder')}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                maxLength={20}
              />
              <button
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium transition-colors min-h-tap"
              >
                {t('common.add')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('taskForm.colorLabel')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {TASK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all min-h-tap min-w-tap ${
                    color === c ? 'ring-2 ring-offset-2 dark:ring-offset-dark-surface ring-primary-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={t('taskForm.colorAria', { color: c })}
                />
              ))}
            </div>
          </div>

          {!editTask && (
            <div className="border-t border-gray-200 dark:border-dark-border pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="sr-only peer"
                    aria-label={t('taskForm.enableRecurring')}
                  />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-primary-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('taskForm.recurring')}
                </span>
              </label>

              {isRecurring && (
                <div className="mt-4 space-y-3 ml-1">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRecurringPattern('daily')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-tap ${
                        recurringPattern === 'daily'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {t('taskForm.recurringEveryDay')}
                    </button>
                    <button
                      onClick={() => setRecurringPattern('weekly')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-tap ${
                        recurringPattern === 'weekly'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {t('taskForm.specificDays')}
                    </button>
                  </div>

                  {recurringPattern === 'weekly' && (
                    <div className="flex gap-1.5">
                      {[0,1,2,3,4,5,6].map((i) => (
                        <button
                          key={i}
                          onClick={() => toggleDay(i)}
                          className={`w-9 h-9 rounded-full text-xs font-medium transition-colors min-h-tap min-w-tap ${
                            daysOfWeek.includes(i)
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
                          }`}
                          aria-label={`${t('habits.weekDay'+i)}${daysOfWeek.includes(i) ? t('taskForm.daySelected') : ''}`}
                        >
                          {t('habits.weekDay'+i)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm" role="alert">{error}</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-card transition-colors min-h-tap"
          >
            {t('common.cancel')}
          </button>
          {!editTask && title.trim() && (
            <button
              onClick={handleSaveAsTemplate}
              className="py-3 px-4 rounded-xl border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors min-h-tap"
              title={t('taskForm.saveAsTemplate')}
              aria-label={t('taskForm.saveAsTemplate')}
            >
              <Bookmark className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors min-h-tap"
          >
            {editTask ? t('common.save') : t('task.add')}
          </button>
        </div>
      </div>
    </div>
  )
}
