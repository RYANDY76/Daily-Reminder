import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { useT } from '../i18n'

export default function UpdatePrompt() {
  const t = useT()
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered() {
      setVisible(true)
    },
    onRegisterError() {
      /* ignore */
    }
  })

  useEffect(() => {
    if (needRefresh) {
      setVisible(true)
    }
  }, [needRefresh])

  useEffect(() => {
    if (!dismissed) return
    const timer = setTimeout(() => updateServiceWorker(true), 24 * 60 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [dismissed, updateServiceWorker])

  if (!visible || dismissed || !needRefresh) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-[60] animate-slide-in-down">
      <div className="bg-white dark:bg-dark-surface shadow-lg border border-gray-100 dark:border-dark-border rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-primary-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('update.title')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('update.desc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors text-gray-400"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-colors"
          >
            {t('update.button')}
          </button>
        </div>
      </div>
    </div>
  )
}
