import React, { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import BottomNav from './BottomNav'
import Header from './Header'
import GlobalSearch from './GlobalSearch'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
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
    <>
      <Header />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div
          ref={contentRef}
          className="max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 py-4 md:py-8 page-enter"
        >
          {children}
        </div>
      </main>
      <BottomNav />
      <GlobalSearch isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </>
  )
}
