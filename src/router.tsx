import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useT } from './i18n'
import Dashboard from './components/Dashboard'

const Calendar = lazy(() => import('./components/Calendar'))
const Pomodoro = lazy(() => import('./components/Pomodoro'))
const HabitTracker = lazy(() => import('./components/HabitTracker'))
const CoupleDashboard = lazy(() => import('./components/CoupleDashboard'))
const Stats = lazy(() => import('./components/Stats'))
const ProfileManager = lazy(() => import('./components/ProfileManager'))
const Settings = lazy(() => import('./components/Settings'))
const Goals = lazy(() => import('./components/Goals'))
const Landing = lazy(() => import('./components/Landing'))

function PageLoader() {
  const t = useT()
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" role="status">
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    </div>
  )
}

function LazyPage({ Component }: { Component: React.LazyExoticComponent<() => JSX.Element> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}

/**
 * Map from URL path to Page type for syncing with useAppStore.
 */
export const ROUTE_TO_PAGE: Record<string, string> = {
  '/': 'dashboard',
  '/calendar': 'calendar',
  '/pomodoro': 'pomodoro',
  '/habits': 'habits',
  '/couple': 'couple',
  '/goals': 'goals',
  '/stats': 'stats',
  '/profile': 'profile',
  '/settings': 'settings',
  '/about': 'about'
}

export const PAGE_TO_ROUTE: Record<string, string> = {
  dashboard: '/',
  calendar: '/calendar',
  pomodoro: '/pomodoro',
  habits: '/habits',
  couple: '/couple',
  goals: '/goals',
  stats: '/stats',
  profile: '/profile',
  settings: '/settings',
  about: '/about'
}

export default function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/calendar" element={<PageTransition><LazyPage Component={Calendar as any} /></PageTransition>} />
        <Route path="/pomodoro" element={<PageTransition><LazyPage Component={Pomodoro as any} /></PageTransition>} />
        <Route path="/habits" element={<PageTransition><LazyPage Component={HabitTracker as any} /></PageTransition>} />
        <Route path="/couple" element={<PageTransition><LazyPage Component={CoupleDashboard as any} /></PageTransition>} />
        <Route path="/goals" element={<PageTransition><LazyPage Component={Goals as any} /></PageTransition>} />
        <Route path="/stats" element={<PageTransition><LazyPage Component={Stats as any} /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><LazyPage Component={ProfileManager as any} /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><LazyPage Component={Settings as any} /></PageTransition>} />
        <Route path="/about" element={<PageTransition><LazyPage Component={Landing as any} /></PageTransition>} />
        {/* Fallback — redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
