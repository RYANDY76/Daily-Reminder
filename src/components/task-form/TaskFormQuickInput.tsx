import { Sparkles, Mic, MicOff, X } from 'lucide-react'
import { useT } from '../../i18n'
import { sanitizeInput } from '../../utils/sanitize'

interface Props {
  naturalInput: string
  showNaturalPreview: boolean
  title: string
  time: string
  dueDate: string
  isListening: boolean
  voiceError: string
  onNaturalInputChange: (value: string, parsed: { title?: string; time?: string; date?: string }) => void
  onNaturalInputEnter: () => void
  onToggleVoice: () => void
  onClearVoiceError: () => void
}

export default function TaskFormQuickInput({
  naturalInput, showNaturalPreview, title, time, dueDate,
  isListening, voiceError,
  onNaturalInputChange, onNaturalInputEnter,
  onToggleVoice, onClearVoiceError
}: Props) {
  const t = useT()

  return (
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
              const val = sanitizeInput(e.target.value)
              onNaturalInputChange(val, {})
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && naturalInput.trim()) {
                e.preventDefault()
                onNaturalInputEnter()
              }
            }}
            placeholder={t('taskForm.quickPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onToggleVoice}
          className={`px-3 py-3 rounded-xl border transition-colors min-h-tap ${
            isListening
              ? 'bg-red-500 border-red-500 text-white animate-pulse'
              : voiceError
                ? 'border-red-300 dark:border-red-700 text-red-500 bg-red-50 dark:bg-red-900/10'
                : 'border-gray-300 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card'
          }`}
          aria-label={isListening ? t('voice.stop') : t('voice.start')}
        >
          {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : voiceError ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
        <div className="flex items-start gap-2 mt-1">
          <p role="alert" className="text-xs text-red-500 flex-1">{voiceError}</p>
          <button
            onClick={onClearVoiceError}
            className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
            aria-label={t('common.close')}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
