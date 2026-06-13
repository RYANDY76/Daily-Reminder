import { useState } from 'react'
import { Bookmark, ChevronDown, X } from 'lucide-react'
import { useT } from '../../i18n'
import type { TaskTemplate } from '../../utils/templates'

interface Props {
  templates: TaskTemplate[]
  onUse: (template: TaskTemplate) => void
  onDelete: (id: string) => void
}

export default function TaskFormTemplateSelector({ templates, onUse, onDelete }: Props) {
  const t = useT()
  const [showTemplates, setShowTemplates] = useState(false)

  if (templates.length === 0) return null

  return (
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
                onClick={() => onUse(tmpl)}
                className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300"
              >
                {tmpl.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(tmpl.id)}
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
  )
}
