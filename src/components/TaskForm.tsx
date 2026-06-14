import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { useT } from '../i18n'
import type { Task, RecurringConfig, SessionType, TaskPriority } from '../types'
import { getSessionFromTime, getTodayDate } from '../dates'
import { TASK_COLORS } from '../types'
import { useTaskStore } from '../stores/useTaskStore'
import { useAppStore } from '../stores/useAppStore'
import { useProfileStore } from '../stores/useProfileStore'
import { saveTask } from '../database'
import { parseNaturalLanguage } from '../utils/naturalLanguageParser'
import { hasTimeIndicator, hasDateIndicator } from '../utils/naturalLanguage'
import { getTemplates, saveTemplate, deleteTemplate, type TaskTemplate } from '../utils/templates'
import { z } from 'zod'
import { sanitizeInput } from '../utils/sanitize'
import TaskFormHeader from './task-form/TaskFormHeader'
import TaskFormRecurringPrompt from './task-form/TaskFormRecurringPrompt'
import TaskFormQuickInput from './task-form/TaskFormQuickInput'
import TaskFormTimePicker from './task-form/TaskFormTimePicker'
import TaskFormTemplateSelector from './task-form/TaskFormTemplateSelector'
import TaskFormSubtaskInput from './task-form/TaskFormSubtaskInput'
import TaskFormPrioritySelector from './task-form/TaskFormPrioritySelector'
import TaskFormTagInput from './task-form/TaskFormTagInput'
import TaskFormColorPicker from './task-form/TaskFormColorPicker'
import TaskFormRecurringConfig from './task-form/TaskFormRecurringConfig'
import TaskFormActions from './task-form/TaskFormActions'

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
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)

  const [title, setTitle] = useState(editTask?.title || '')
  const [time, setTime] = useState(editTask?.time || '08:00')
  const [notes, setNotes] = useState(editTask?.notes || '')
  const [priority, setPriority] = useState<TaskPriority>(editTask?.priority || 'medium')
  const [tags, setTags] = useState<string[]>(editTask?.tags || [])
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
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [showAdvanced, setShowAdvanced] = useState(() => !!editTask)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const profile = useProfileStore((s) => s.currentProfile)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const voiceErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearVoiceError = useCallback(() => {
    setVoiceError('')
    if (voiceErrorTimerRef.current) {
      clearTimeout(voiceErrorTimerRef.current)
      voiceErrorTimerRef.current = null
    }
  }, [])

  const setVoiceErrorAutoClear = useCallback((msg: string) => {
    setVoiceError(msg)
    if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current)
    voiceErrorTimerRef.current = setTimeout(() => setVoiceError(''), 5000)
  }, [])

  useEffect(() => {
    return () => {
      if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current)
    }
  }, [])

  const isEditingRecurring = editTask?.isRecurring && editTask?.recurring !== null

  useEffect(() => {
    const handler = () => onClose()
    document.addEventListener('close-modals', handler)
    return () => document.removeEventListener('close-modals', handler)
  }, [onClose])

  const startVoiceInput = async () => {
    clearVoiceError()

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceErrorAutoClear(t('voice.notSupported'))
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceErrorAutoClear(t('voice.notSupported'))
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
    } catch {
      setVoiceErrorAutoClear(t('voice.microphoneBlocked'))
      return
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
        clearVoiceError()
        recognitionRef.current = null
      }

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (import.meta.env.DEV) console.error('Speech error:', e.error)
        setIsListening(false)
        recognitionRef.current = null
        if (e.error === 'not-allowed') {
          setVoiceErrorAutoClear(t('voice.microphoneBlocked'))
        } else if (e.error === 'no-speech') {
          setVoiceErrorAutoClear(t('voice.noSpeech'))
        } else if (e.error === 'network') {
          setVoiceErrorAutoClear(t('voice.networkError'))
        } else {
          setVoiceErrorAutoClear('Error: ' + e.error)
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
      setVoiceErrorAutoClear(t('taskForm.voiceStartError', { error: errMessage }))
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

  const handleQuickInputChange = (value: string) => {
    setNaturalInput(value)
    if (hasTimeIndicator(value) || hasDateIndicator(value)) {
      const parsed = parseNaturalLanguage(value)
      if (parsed.time) setTime(parsed.time)
      if (parsed.date) setDueDate(parsed.date)
      if (parsed.title) setTitle(parsed.title)
      setShowNaturalPreview(true)
    } else {
      setShowNaturalPreview(false)
    }
  }

  const handleQuickInputEnter = () => {
    const parsed = parseNaturalLanguage(naturalInput)
    if (parsed.title) setTitle(parsed.title)
    if (parsed.time) setTime(parsed.time)
    if (parsed.date) setDueDate(parsed.date)
    setNaturalInput('')
    setShowNaturalPreview(false)
  }

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  if (isEditingRecurring && !recurringEditMode) {
    return (
      <TaskFormRecurringPrompt
        editTask={editTask!}
        onOnlyToday={() => {
          setRecurringEditMode('today')
          setTimeout(() => handleSubmit(), 0)
        }}
        onAllRecurrences={() => {
          setRecurringEditMode('all')
          setTimeout(() => handleSubmit(), 0)
        }}
        onCancel={onClose}
      />
    )
  }

  return (
    <div className="modal-overlay items-end md:items-center">
      <div
        className="modal-content p-6 max-w-lg max-h-[90vh]"
        role="dialog"
        aria-label={editTask ? t('task.edit') : t('task.add')}
      >
        <TaskFormHeader isEditing={!!editTask} onClose={onClose} />

        <div className="space-y-4">
          {!editTask && (
            <TaskFormQuickInput
              naturalInput={naturalInput}
              showNaturalPreview={showNaturalPreview}
              title={title}
              time={time}
              dueDate={dueDate}
              isListening={isListening}
              voiceError={voiceError}
              onNaturalInputChange={handleQuickInputChange}
              onNaturalInputEnter={handleQuickInputEnter}
              onToggleVoice={isListening ? stopVoiceInput : startVoiceInput}
              onClearVoiceError={clearVoiceError}
            />
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

          <TaskFormTimePicker
            time={time}
            isEditing={!!editTask}
            onTimeChange={setTime}
          />

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-dark-border px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors min-h-tap"
            aria-expanded={showAdvanced}
          >
            <span>{showAdvanced ? 'Sembunyikan opsi lainnya' : 'Tampilkan opsi lainnya'}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-1">
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

              {!editTask && (
                <TaskFormTemplateSelector
                  templates={templates}
                  onUse={handleUseTemplate}
                  onDelete={(id) => { deleteTemplate(id); setTemplates(getTemplates(profile!.id)) }}
                />
              )}

              <TaskFormSubtaskInput
                subtasks={subtasks}
                onChange={setSubtasks}
              />

              <TaskFormPrioritySelector
                priority={priority}
                onChange={setPriority}
              />

              <TaskFormTagInput
                tags={tags}
                onChange={setTags}
              />

              <TaskFormColorPicker
                color={color}
                onChange={setColor}
              />

              {!editTask && (
                <TaskFormRecurringConfig
                  isRecurring={isRecurring}
                  recurringPattern={recurringPattern}
                  daysOfWeek={daysOfWeek}
                  onRecurringChange={setIsRecurring}
                  onPatternChange={setRecurringPattern}
                  onDayToggle={toggleDay}
                />
              )}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm" role="alert">{error}</p>
          )}
        </div>

        <TaskFormActions
          isEditing={!!editTask}
          hasTitle={!!title.trim()}
          onCancel={onClose}
          onSaveTemplate={handleSaveAsTemplate}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
