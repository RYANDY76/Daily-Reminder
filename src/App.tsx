import { lazy, Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useProfileStore } from './stores/useProfileStore'
import { useAppStore } from './stores/useAppStore'
import { useAuthStore } from './stores/useAuthStore'
import { useTaskStore } from './stores/useTaskStore'
import { useRecurringStore } from './stores/useRecurringStore'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { loadAccentColor } from './utils/theme'
import { loadThemePreference, getThemeById, applyTheme } from './types/theme'
import { useT } from './i18n'
import Layout from './components/Layout'
import Welcome from './components/Welcome'
import PinModal from './components/PinModal'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import FAB from './components/FAB'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import InstallPrompt from './components/InstallPrompt'
import OnboardingTour from './components/OnboardingTour'
import AppRoutes, { ROUTE_TO_PAGE } from './router'
import { fetchGoogleCalendarEvents } from './services/googleCalendarService'
import type { Page } from './types'

const LazyLanding = lazy(() => import('./components/Landing'))
const PUBLIC_PATHS = new Set(['/about'])

export default function App() {
  const t = useT()
  const location = useLocation()
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const showWelcome = useProfileStore((s) => s.showWelcome)
  const pinLocked = useProfileStore((s) => s.pinLocked)
  const loadProfiles = useProfileStore((s) => s.loadProfiles)
  const loading = useProfileStore((s) => s.loading)

  const setPage = useAppStore((s) => s.setPage)
  const currentPage = useAppStore((s) => s.currentPage)
  const toastQueue = useAppStore((s) => s.toastQueue)
  const removeToast = useAppStore((s) => s.removeToast)
  const setDarkMode = useAppStore((s) => s.setDarkMode)
  const initAuth = useAuthStore((s) => s.initialize)

  const loadTodayTasks = useTaskStore((s) => s.loadTodayTasks)
  const checkDayChange = useTaskStore((s) => s.checkDayChange)
  const checkAndGenerate = useRecurringStore((s) => s.checkAndGenerate)

  const [initialized, setInitialized] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  // Track if initial data load has been done
  const dataLoadedRef = useRef(false)
  // Track last visibility-change refresh timestamp
  const lastRefreshRef = useRef(0)

  useIdleTimeout()

  // Sync URL to Zustand state
  useEffect(() => {
    const pageFromUrl = ROUTE_TO_PAGE[location.pathname] as Page
    if (pageFromUrl && pageFromUrl !== currentPage) {
      setPage(pageFromUrl)
    }
  }, [location.pathname, currentPage, setPage])

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onShowHelp: () => setShowShortcutsHelp(true),
    onCloseModal: () => setShowShortcutsHelp(false),
    onSearch: () => useAppStore.getState().setGlobalSearchOpen(true)
  })

  // Core data refresh function — reusable
  const refreshCoreData = useCallback(async () => {
    try {
      await checkDayChange()
      await checkAndGenerate()
      await loadTodayTasks()
    } catch {
      // silently fail — individual stores handle errors
    }
  }, [checkDayChange, checkAndGenerate, loadTodayTasks])

  // Bootstrap: init auth + profiles + immediate data load
  useEffect(() => {
    initAuth()
    loadProfiles()
      .then(async () => {
        setInitialized(true)
        // Pre-load tasks right after profiles are ready — avoids waiting for Dashboard mount
        const profile = useProfileStore.getState().currentProfile
        if (profile && !dataLoadedRef.current) {
          dataLoadedRef.current = true
          await refreshCoreData()
        }
      })
      .catch(() => setInitialized(true))
    loadAccentColor()

    // Load saved theme
    const savedThemeId = loadThemePreference()
    const theme = getThemeById(savedThemeId)
    if (theme) {
      applyTheme(theme)
    }
  }, [loadProfiles]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply system dark mode preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    if (prefersDark) {
      document.documentElement.classList.add('dark')
      setDarkMode(true)
    }
  }, [setDarkMode])

  // Re-load data when profile becomes available (after Welcome screen)
  useEffect(() => {
    if (currentProfile && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      refreshCoreData()
    }
  }, [currentProfile, refreshCoreData])

  // Auto-refresh when app becomes visible again (coming from background/lock screen)
  // This ensures APK/PWA shows fresh data instantly without manual pull-to-refresh
  useEffect(() => {
    const REFRESH_COOLDOWN_MS = 30_000 // only refresh if >30s since last refresh

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        if (now - lastRefreshRef.current < REFRESH_COOLDOWN_MS) return
        lastRefreshRef.current = now

        const profile = useProfileStore.getState().currentProfile
        if (!profile) return

        // Refresh data silently in the background
        await refreshCoreData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    // Also handle the `pageshow` event for PWA/iOS Safari which fires on app resume
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) handleVisibilityChange()
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshCoreData])

  // Periodic Google Calendar sync every 30 minutes when connected
  useEffect(() => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile?.googleCalendarConnected) return

    fetchGoogleCalendarEvents(14).catch(() => {})
    const interval = setInterval(() => {
      const p = useProfileStore.getState().currentProfile
      if (p?.googleCalendarConnected) fetchGoogleCalendarEvents(14).catch(() => {})
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [currentProfile?.googleCalendarConnected])

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" role="status">
            <span className="sr-only">{t('common.loading')}</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (showWelcome || !currentProfile) {
    if (PUBLIC_PATHS.has(location.pathname)) {
      return <Suspense fallback={null}><LazyLanding /></Suspense>
    }
    return (
      <Welcome
        onComplete={() => {
          dataLoadedRef.current = false
          loadProfiles()
        }}
      />
    )
  }

  return (
    <>
      <ToastContainer toasts={toastQueue} onRemove={removeToast} />
      <KeyboardShortcutsHelp isOpen={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />
      {pinLocked && <PinModal />}
      <Layout>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </Layout>
      {/* Floating Action Button only on dashboard */}
      {currentPage === 'dashboard' && (
        <FAB
          onClick={() => useAppStore.getState().requestAddTask()}
          label={t('task.add')}
          className="!bottom-24 md:!bottom-8"
        />
      )}
      <InstallPrompt />
      <OnboardingTour />
    </>
  )
}
