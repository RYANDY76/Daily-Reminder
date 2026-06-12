import { useEffect, useRef } from 'react'
import { trackPageView } from '../utils/analytics'
import { useAppStore } from '../stores/useAppStore'

export function useAnalytics() {
  const currentPage = useAppStore((s) => s.currentPage)
  const lastPage = useRef(currentPage)

  useEffect(() => {
    if (currentPage !== lastPage.current) {
      lastPage.current = currentPage
      trackPageView(currentPage)
    }
  }, [currentPage])
}
