import { useState } from 'react'
import { X } from 'lucide-react'
import { useT } from '../../i18n'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
}

export default function TaskFormTagInput({ tags, onChange }: Props) {
  const t = useT()
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  return (
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
  )
}
