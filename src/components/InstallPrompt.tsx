import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { Download, X } from 'lucide-react'
import { useState } from 'react'
import { useT } from '../i18n'

export default function InstallPrompt() {
  const t = useT()
  const { installPrompt, promptInstall, isStandalone } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  // Only show if it's installable, not already installed, and not dismissed
  if (!installPrompt || isStandalone || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 animate-fade-up">
      <div className="bg-white dark:bg-dark-surface shadow-lg border border-gray-100 dark:border-dark-border rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
          <Download className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('install.title')}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('install.desc')}</p>
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
            onClick={promptInstall}
            className="px-3 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-colors shadow-sm"
          >
            {t('install.button')}
          </button>
        </div>
      </div>
    </div>
  )
}
