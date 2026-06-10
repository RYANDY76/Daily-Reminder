import React, { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import BottomNav from './BottomNav'
import Header from './Header'
import GlobalSearch from './GlobalSearch'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const darkMode = useAppStore((s) => s.darkMode)
  const currentPage = useAppStore((s) => s.currentPage)
  const globalSearchOpen = useAppStore((s) => s.globalSearchOpen)
  const setGlobalSearchOpen = useAppStore((s) => s.setGlobalSearchOpen)
  const prevPage = useRef(currentPage)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prevPage.current !== currentPage && contentRef.current) {
      contentRef.current.classList.remove('page-enter')
      // Force reflow to restart animation
      void contentRef.current.offsetHeight
      contentRef.current.classList.add('page-enter')
      prevPage.current = currentPage
    }
  }, [currentPage])

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <Header />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div
          ref={contentRef}
          className="max-w-4xl mx-auto px-4 py-4 md:py-6 page-enter"
        >
          {children}
        </div>
      </main>
      <BottomNav />
      <GlobalSearch isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </div>
  )
}
