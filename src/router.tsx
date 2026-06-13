import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Dashboard from './components/Dashboard'
import ErrorBoundary from './components/ErrorBoundary'
import { CalendarSkeleton, StatsSkeleton, GoalsSkeleton, HabitsSkeleton, PomodoroSkeleton, ProfileSkeleton, SettingsSkeleton, CoupleSkeleton, LandingSkeleton, NotFoundSkeleton } from './components/Skeleton'

const Calendar = lazy(() => import('./components/Calendar'))
const Pomodoro = lazy(() => import('./components/Pomodoro'))
const HabitTracker = lazy(() => import('./components/HabitTracker'))
const CoupleDashboard = lazy(() => import('./components/CoupleDashboard'))
const Stats = lazy(() => import('./components/Stats'))
const ProfileManager = lazy(() => import('./components/ProfileManager'))
const Settings = lazy(() => import('./components/Settings'))
const Goals = lazy(() => import('./components/Goals'))
const Landing = lazy(() => import('./components/Landing'))
const NotFound = lazy(() => import('./components/NotFound'))

// Preload all lazy routes so they're ready before user navigates
export function preloadRoutes() {
  const routes = [
    () => import('./components/Calendar'),
    () => import('./components/Pomodoro'),
    () => import('./components/HabitTracker'),
    () => import('./components/CoupleDashboard'),
    () => import('./components/Stats'),
    () => import('./components/ProfileManager'),
    () => import('./components/Settings'),
    () => import('./components/Goals'),
    () => import('./components/Landing'),
  ]
    for (const route of routes) route()
    import('./components/NotFound')
}

function PageLoader({ page }: { page: string }) {
  const skeletons: Record<string, React.ReactNode> = {
    calendar: <CalendarSkeleton />,
    stats: <StatsSkeleton />,
    goals: <GoalsSkeleton />,
    habits: <HabitsSkeleton />,
    pomodoro: <PomodoroSkeleton />,
    profile: <ProfileSkeleton />,
    settings: <SettingsSkeleton />,
    couple: <CoupleSkeleton />,
    landing: <LandingSkeleton />,
    notfound: <NotFoundSkeleton />
  }
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
      {skeletons[page] || (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" role="status">
            <span className="sr-only">{'Loading...'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

type LazyComponent = React.LazyExoticComponent<React.ComponentType<Record<string, never>>>

function LazyPage({ Component, skeleton }: { Component: LazyComponent; skeleton: string }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader page={skeleton} />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
        <Route path="/calendar" element={<PageTransition><LazyPage Component={Calendar as LazyComponent} skeleton="calendar" /></PageTransition>} />
        <Route path="/pomodoro" element={<PageTransition><LazyPage Component={Pomodoro as LazyComponent} skeleton="pomodoro" /></PageTransition>} />
        <Route path="/habits" element={<PageTransition><LazyPage Component={HabitTracker as LazyComponent} skeleton="habits" /></PageTransition>} />
        <Route path="/couple" element={<PageTransition><LazyPage Component={CoupleDashboard as LazyComponent} skeleton="couple" /></PageTransition>} />
        <Route path="/goals" element={<PageTransition><LazyPage Component={Goals as LazyComponent} skeleton="goals" /></PageTransition>} />
        <Route path="/stats" element={<PageTransition><LazyPage Component={Stats as LazyComponent} skeleton="stats" /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><LazyPage Component={ProfileManager as LazyComponent} skeleton="profile" /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><LazyPage Component={Settings as LazyComponent} skeleton="settings" /></PageTransition>} />
        <Route path="/about" element={<PageTransition><LazyPage Component={Landing as LazyComponent} skeleton="landing" /></PageTransition>} />
        {/* 404 */}
        <Route path="*" element={<PageTransition><LazyPage Component={NotFound as LazyComponent} skeleton="notfound" /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}
