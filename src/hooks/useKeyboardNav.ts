import { useEffect } from 'react'

export function useKeyboardNav() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav')
      }
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]')
        if (modal) {
          const closeBtn = modal.querySelector('[aria-label="Close"], [data-close]') as HTMLElement
          closeBtn?.click()
        }
      }
    }

    function handleMouseDown() {
      document.body.classList.remove('keyboard-nav')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])
}
