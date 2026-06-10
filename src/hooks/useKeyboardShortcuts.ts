import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/useAppStore'

interface ShortcutHandlers {
  onNewTask?: () => void
  onSearch?: () => void
  onToggleDark?: () => void
  onCloseModal?: () => void
  onShowHelp?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const setPage = useAppStore((s) => s.setPage)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? or / to show help (when not in input)
      if ((e.key === '?' || e.key === '/') && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        handlers.onShowHelp?.()
        return
      }

      // Ctrl/Cmd + key
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault()
            handlers.onNewTask?.()
            break
          case 'k':
            e.preventDefault()
            handlers.onSearch?.()
            break
          case 'd':
            e.preventDefault()
            toggleDarkMode()
            break
          case '1':
            e.preventDefault()
            setPage('dashboard')
            break
          case '2':
            e.preventDefault()
            setPage('calendar')
            break
          case '3':
            e.preventDefault()
            setPage('pomodoro')
            break
          case '4':
            e.preventDefault()
            setPage('habits')
            break
          case '5':
            e.preventDefault()
            setPage('goals')
            break
          case '6':
            e.preventDefault()
            setPage('stats')
            break
          case '7':
            e.preventDefault()
            setPage('profile')
            break
          case '8':
            e.preventDefault()
            setPage('settings')
            break
        }
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        handlers.onCloseModal?.()
        document.dispatchEvent(new CustomEvent('close-modals'))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlers, setPage, toggleDarkMode])
}
