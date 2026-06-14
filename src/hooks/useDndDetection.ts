import { useState, useEffect } from 'react'

export function useDndDetection() {
  const [isDnd, setIsDnd] = useState(false)

  useEffect(() => {
    const check = () => {
      const dnd = localStorage.getItem('avora_dnd_enabled') === 'true'
      setIsDnd(dnd)
    }
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  const setDnd = (enabled: boolean) => {
    localStorage.setItem('avora_dnd_enabled', String(enabled))
    setIsDnd(enabled)
  }

  return { isDnd, setDnd }
}
