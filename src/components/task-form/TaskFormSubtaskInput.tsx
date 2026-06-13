import { useState } from 'react'
import { X } from 'lucide-react'
import { useT } from '../../i18n'

interface Subtask {
  id: string
  title: string
  done: boolean
}

interface Props {
  subtasks: Subtask[]
  onChange: (subtasks: Subtask[]) => void
}

export default function TaskFormSubtaskInput({ subtasks, onChange }: Props) {
  const t = useT()
  const [subtaskInput, setSubtaskInput] = useState('')

  const addSubtask = () => {
    if (!subtaskInput.trim()) return
    onChange([...subtasks, { id: crypto.randomUUID(), title: subtaskInput.trim(), done: false }])
    setSubtaskInput('')
  }

  return (
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
              onChange={() => onChange(subtasks.map(s => s.id === st.id ? { ...s, done: !s.done } : s))}
              className="w-4 h-4 text-primary-600 rounded"
              aria-label={st.title}
            />
            <span className={`flex-1 text-sm ${st.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {st.title}
            </span>
            <button
              type="button"
              onClick={() => onChange(subtasks.filter(s => s.id !== st.id))}
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
              if (e.key === 'Enter') {
                e.preventDefault()
                addSubtask()
              }
            }}
            placeholder={t('taskForm.addSubtask')}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  )
}
