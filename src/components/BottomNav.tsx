import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { useNavigate } from 'react-router-dom'
import { PAGE_TO_ROUTE } from '../router'
import { useProfileStore } from '../stores/useProfileStore'
import { useT } from '../i18n'
import {
  LayoutDashboard,
  CalendarDays,
  Timer,
  Target,
  MoreHorizontal,
  Flag,
  BarChart3,
  Settings,
  User,
  Heart,
  X
} from 'lucide-react'
import type { Page } from '../types'

// 5 tab utama
const mainTabs: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'nav.today', icon: LayoutDashboard },
  { id: 'calendar', label: 'nav.calendar', icon: CalendarDays },
  { id: 'pomodoro', label: 'nav.focus', icon: Timer },
  { id: 'habits', label: 'nav.habits', icon: Target },
]

// Tab tambahan di "More"
const moreTabs: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'couple', label: 'nav.couple', icon: Heart },
  { id: 'goals', label: 'nav.goals', icon: Flag },
  { id: 'stats', label: 'nav.stats', icon: BarChart3 },
  { id: 'profile', label: 'nav.profile', icon: User },
  { id: 'settings', label: 'nav.settings', icon: Settings },
]

const allMoreIds = moreTabs.map(t => t.id)

export default function BottomNav() {
  const t = useT()
  const currentPage = useAppStore((s) => s.currentPage)
  const navigate = useNavigate()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMore, setShowMore] = useState(false)
  const coupleLoadedRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  // Lazily load couple store for love notes badge
  useEffect(() => {
    const profile = currentProfile
    if (!profile || coupleLoadedRef.current) return
    coupleLoadedRef.current = true
    const profileId = profile.id

    async function initCouple() {
      try {
        const { useCoupleStore } = await import('../stores/useCoupleStore')
        const state = useCoupleStore.getState()

        if (state.connection?.status === 'active') {
          await state.loadLoveNotes(profileId)
          const notes = useCoupleStore.getState().loveNotes
          setUnreadCount(notes.filter(n => !n.read && n.toProfileId === profileId).length)

          pollRef.current = setInterval(async () => {
            await state.loadLoveNotes(profileId)
            const updated = useCoupleStore.getState().loveNotes
            setUnreadCount(updated.filter(n => !n.read && n.toProfileId === profileId).length)
          }, 30000)
        }
      } catch { /* couple feature unavailable */ }
    }

    initCouple()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [currentProfile?.id])

  const isMoreActive = allMoreIds.includes(currentPage)

  const handleTabClick = (id: Page) => {
    navigate(PAGE_TO_ROUTE[id])
    setShowMore(false)
  }

  return (
    <>
      {/* More drawer overlay */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More drawer panel */}
      {showMore && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border animate-slide-in-up overflow-hidden safe-area-pb">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('nav.more')}</span>
            <button
              onClick={() => setShowMore(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 p-3">
            {moreTabs.map((tab) => {
              const isActive = currentPage === tab.id
              const Icon = tab.icon
              const showBadge = tab.id === 'couple' && unreadCount > 0
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-tap ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span>{t(tab.label)}</span>
                  {showBadge && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 bg-pink-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl border-t border-gray-200/80 dark:border-dark-border z-30 safe-area-pb">
        <div className="flex justify-around items-center h-16 px-1">
          {mainTabs.map((tab) => {
            const isActive = currentPage === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-1 h-full transition-all duration-200 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
                aria-label={t(tab.label)}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && <span className="nav-pill" />}
                <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium leading-none">{t(tab.label)}</span>
              </button>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-1 h-full transition-all duration-200 ${
              isMoreActive || showMore
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
            aria-label={t('nav.more')}
            aria-expanded={showMore}
          >
            {(isMoreActive || showMore) && <span className="nav-pill" />}
            <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
              isMoreActive || showMore ? 'bg-primary-50 dark:bg-primary-900/20' : ''
            }`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
