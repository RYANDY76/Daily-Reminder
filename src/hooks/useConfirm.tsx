import { useState, useCallback, useRef } from 'react'
import { useFocusTrap } from './useFocusTrap'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

function ConfirmDialogInner({ options, onConfirm, onCancel }: { options: ConfirmOptions; onConfirm: () => void; onCancel: () => void }) {
  const trapRef = useFocusTrap(true)
  return (
    <div
      ref={trapRef}
      className="modal-overlay"
      onClick={onCancel}
    >
      <div
        className="modal-content p-6 max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{options.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{options.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors min-h-tap"
          >
            {options.cancelText || 'Batal'}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors min-h-tap ${
              options.variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {options.confirmText || 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setOptions(opts)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true)
    setOptions(null)
    resolveRef.current = null
  }, [])

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false)
    setOptions(null)
    resolveRef.current = null
  }, [])

  const ConfirmDialog = useCallback(() => {
    if (!options) return null
    return <ConfirmDialogInner options={options} onConfirm={handleConfirm} onCancel={handleCancel} />
  }, [options, handleConfirm, handleCancel])

  return { confirm, ConfirmDialog }
}
