import { useAppStore } from '../stores/useAppStore'
import { useNavigate } from 'react-router-dom'
import { PAGE_TO_ROUTE } from '../router'
import { useProfileStore } from '../stores/useProfileStore'
import { useT } from '../i18n'
import { getTimeGreeting, formatDate } from '../dates'
import { getTodayDate } from '../dates'
import {
  LayoutDashboard,
  BarChart3,
  User,
  Settings,
  CalendarDays,
  Timer,
  Sun,
  Moon,
  ClipboardList,
  Target,
  Flag,
  Heart,
  Search
} from 'lucide-react'
import type { Page } from '../types'
import SyncStatusBadge from './SyncStatusBadge'

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'nav.today', icon: LayoutDashboard },
  { id: 'calendar', label: 'nav.calendar', icon: CalendarDays },
  { id: 'pomodoro', label: 'nav.focus', icon: Timer },
  { id: 'habits', label: 'nav.habits', icon: Target },
  { id: 'couple', label: 'nav.couple', icon: Heart },
  { id: 'goals', label: 'nav.goals', icon: Flag },
  { id: 'stats', label: 'nav.stats', icon: BarChart3 },
  { id: 'profile', label: 'nav.profile', icon: User },
  { id: 'settings', label: 'nav.settings', icon: Settings }
]

export default function Header() {
  const t = useT()
  const currentPage = useAppStore((s) => s.currentPage)
  const navigate = useNavigate()
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)
  const darkMode = useAppStore((s) => s.darkMode)
  const setGlobalSearchOpen = useAppStore((s) => s.setGlobalSearchOpen)
  const profile = useProfileStore((s) => s.currentProfile)

  const todayFormatted = formatDate(getTodayDate())

  return (
    <>
      <header className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-dark-surface z-30 flex-col transition-colors duration-300">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {t('app.name')}
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{todayFormatted}</p>
            </div>
          </div>
        </div>

        <div className="px-4 mb-3">
          <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-primary-50/80 to-primary-100/40 dark:from-primary-900/15 dark:to-primary-900/5">
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
              {getTimeGreeting(t)}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 truncate">
              {profile?.name?.split(' ')[0] || t('common.guest')}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 min-h-0">
          {navItems.map((item) => {
            const isActive = currentPage === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => navigate(PAGE_TO_ROUTE[item.id])}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full text-left px-3 py-2 rounded-2xl text-sm font-medium transition-all duration-150 min-h-tap flex items-center gap-3 group ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-800/30'
                    : 'bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-dark-card'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1">{t(item.label)}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-primary-500" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-4 pb-2">
          <SyncStatusBadge />
        </div>

        <div className="p-3 space-y-0.5 border-t border-gray-100/80 dark:border-dark-border/60">
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card transition-all duration-200 min-h-tap"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-card flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <span>{t('search.title')}</span>
            <span className="ml-auto text-[10px] text-gray-400">Ctrl+K</span>
          </button>
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card transition-all duration-200 min-h-tap"
            aria-label={darkMode ? t('settings.lightMode') : t('settings.darkMode')}
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-card flex items-center justify-center">
              {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
            </div>
            <span>{darkMode ? t('settings.lightMode') : t('settings.darkMode')}</span>
          </button>
        </div>
      </header>

      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-gray-100/80 dark:border-dark-border/60 sticky top-0 z-20 transition-all duration-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {t('app.name')}
            </h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">{todayFormatted}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-all duration-200 flex items-center justify-center"
            aria-label={t('search.title')}
          >
            <Search className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-all duration-200 flex items-center justify-center"
            aria-label={darkMode ? t('settings.lightMode') : t('settings.darkMode')}
          >
            {darkMode
              ? <Sun className="w-4 h-4 text-yellow-500" />
              : <Moon className="w-4 h-4 text-gray-500" />
            }
          </button>
        </div>
      </div>
    </>
  )
}
