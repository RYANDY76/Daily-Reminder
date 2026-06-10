/**
 * Keyboard Shortcuts Help Modal
 * Shows all available keyboard shortcuts
 */

import { X } from 'lucide-react'
import { useT } from '../i18n'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
const modKey = isMac ? '⌘' : 'Ctrl'

const shortcuts = [
  {
    category: 'shortcuts.navigation',
    items: [
      { key: `${modKey} + 1`, action: 'shortcuts.goToDashboard' },
      { key: `${modKey} + 2`, action: 'shortcuts.goToCalendar' },
      { key: `${modKey} + 3`, action: 'shortcuts.goToFocus' },
      { key: `${modKey} + 4`, action: 'shortcuts.goToHabits' },
      { key: `${modKey} + 5`, action: 'shortcuts.goToGoals' },
      { key: `${modKey} + 6`, action: 'shortcuts.goToStats' },
      { key: `${modKey} + 7`, action: 'shortcuts.goToProfile' },
      { key: `${modKey} + 8`, action: 'shortcuts.goToSettings' }
    ]
  },
  {
    category: 'shortcuts.actions',
    items: [
      { key: `${modKey} + N`, action: 'shortcuts.newTask' },
      { key: `${modKey} + K`, action: 'shortcuts.search' },
      { key: `${modKey} + D`, action: 'shortcuts.toggleDark' },
      { key: 'Esc', action: 'shortcuts.closeModal' }
    ]
  }
]

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const t = useT()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-dark-surface rounded-2xl shadow-2xl animate-slide-in-up max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('shortcuts.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('shortcuts.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {shortcuts.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {t(section.category)}
                </h3>
                <div className="space-y-2">
                  {section.items.map((shortcut, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t(shortcut.action)}
                      </span>
                      <kbd className="px-3 py-1.5 text-xs font-mono font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer tip */}
          <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              💡 <strong>{t('shortcuts.tip')}:</strong> {t('shortcuts.tipText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
