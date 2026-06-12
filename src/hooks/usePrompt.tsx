import { useState, useCallback, useRef } from 'react'
import { useFocusTrap } from './useFocusTrap'

export interface PromptOptions {
  title: string
  message?: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
}

function PromptDialogInner({ options, value, onChange, onConfirm, onCancel }: { options: PromptOptions; value: string; onChange: (v: string) => void; onConfirm: () => void; onCancel: () => void }) {
  const trapRef = useFocusTrap(true)
  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-dark-surface rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 dark:border-dark-border animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{options.title}</h3>
        {options.message && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{options.message}</p>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
          placeholder={options.placeholder}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors mb-6"
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors min-h-tap"
          >
            {options.cancelText || 'Batal'}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors min-h-tap"
          >
            {options.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function usePrompt() {
  const [options, setOptions] = useState<PromptOptions | null>(null)
  const [value, setValue] = useState('')
  const resolveRef = useRef<((value: string | null) => void) | null>(null)

  const prompt = useCallback((opts: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setValue(opts.defaultValue || '')
      setOptions(opts)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(value)
    setOptions(null)
    resolveRef.current = null
  }, [value])

  const handleCancel = useCallback(() => {
    resolveRef.current?.(null)
    setOptions(null)
    resolveRef.current = null
  }, [])

  const PromptDialog = useCallback(() => {
    if (!options) return null
    return <PromptDialogInner options={options} value={value} onChange={setValue} onConfirm={handleConfirm} onCancel={handleCancel} />
  }, [options, value, handleConfirm, handleCancel])

  return { prompt, PromptDialog }
}
