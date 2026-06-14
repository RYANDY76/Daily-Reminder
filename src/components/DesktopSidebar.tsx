import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import { useProfileStore } from '../stores/useProfileStore'
import AvoraLogo from './AvoraLogo'
import {
  Home, Calendar, Clock, ListTodo, Heart,
  Target, BarChart3, User, Settings, Info
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, key: 'today' },
  { path: '/calendar', icon: Calendar, key: 'calendar' },
  { path: '/pomodoro', icon: Clock, key: 'focus' },
  { path: '/habits', icon: ListTodo, key: 'habits' },
  { path: '/couple', icon: Heart, key: 'couple' },
  { path: '/goals', icon: Target, key: 'goals' },
  { path: '/stats', icon: BarChart3, key: 'stats' },
  { path: '/profile', icon: User, key: 'profile' },
  { path: '/settings', icon: Settings, key: 'settings' },
  { path: '/about', icon: Info, key: 'more' },
]

export default function DesktopSidebar() {
  const t = useT()
  const profile = useProfileStore(s => s.currentProfile)

  return (
    <nav className="desktop-sidebar" role="navigation" aria-label="Main navigation">
      <div className="px-4 mb-6">
        <AvoraLogo className="w-8 h-8" />
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">v1.0</p>
      </div>

      <div className="flex-1 space-y-0.5 px-2">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'
              }`
            }
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            <span>{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
      </div>

      {profile && (
        <div className="px-4 pt-4 border-t border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile.name}</p>
              <p className="text-[10px] text-gray-400">{profile.googleEmail || 'Profil Lokal'}</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
