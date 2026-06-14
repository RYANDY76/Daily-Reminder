import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useProfileStore } from './stores/useProfileStore'
import { useAppStore } from './stores/useAppStore'
import { useAuthStore } from './stores/useAuthStore'
import { useTaskStore } from './stores/useTaskStore'
import { useRecurringStore } from './stores/useRecurringStore'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import { useAnalytics } from './hooks/useAnalytics'
import { loadAccentColor } from './utils/theme'
import { initAccessibility } from './components/AccessibilitySettings'
import { useT } from './i18n'
import Layout from './components/Layout'
import Welcome from './components/Welcome'
import PinModal from './components/PinModal'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import FAB from './components/FAB'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import InstallPrompt from './components/InstallPrompt'
import UpdatePrompt from './components/UpdatePrompt'
import OnboardingTour from './components/OnboardingTour'
import ModeSelector from './components/ModeSelector'
import DesktopSidebar from './components/DesktopSidebar'
import Landing from './components/Landing'
import LoginPage from './components/LoginPage'
import AppRoutes, { ROUTE_TO_PAGE, preloadRoutes } from './router'
import { initWebVitals } from './lib/webVitals'
import type { Page } from './types'
import { STORAGE_KEYS } from './constants'

const PUBLIC_PATHS = new Set(['/about'])
const GUEST_FLAG_KEY = STORAGE_KEYS.GUEST_FLAG

function useAuthGate() {
  const authUser = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const signedOut = useAuthStore((s) => s.signedOut)
  const profiles = useProfileStore((s) => s.profiles)
  const profileLoading = useProfileStore((s) => s.loading)

  const [guestMode, setGuestMode] = useState(() => localStorage.getItem(GUEST_FLAG_KEY) === 'true')

  const hasExistingProfile = profiles.length > 0
  const hasSupabaseSession = authUser !== null

  return {
    authenticated: !signedOut && (guestMode || hasExistingProfile || hasSupabaseSession),
    authReady: !authLoading && !profileLoading,
    showWelcome: profiles.length === 0 && !guestMode && !hasSupabaseSession,
    enableGuest: () => {
      localStorage.setItem(GUEST_FLAG_KEY, 'true')
      setGuestMode(true)
    },
    disableGuest: () => {
      localStorage.removeItem(GUEST_FLAG_KEY)
      setGuestMode(false)
    }
  }
}

export default function App() {
  const t = useT()
  const location = useLocation()
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const pinLocked = useProfileStore((s) => s.pinLocked)
  const loadProfiles = useProfileStore((s) => s.loadProfiles)

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
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const dataLoadedRef = useRef(false)
  const lastRefreshRef = useRef(0)

  const { authenticated, authReady, showWelcome, enableGuest, disableGuest } = useAuthGate()

  useIdleTimeout()
  useAnalytics()
  useKeyboardNav()

  // Desktop detection
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Sync URL to Zustand state
  useEffect(() => {
    const pageFromUrl = ROUTE_TO_PAGE[location.pathname] as Page
    if (pageFromUrl && pageFromUrl !== currentPage) {
      setPage(pageFromUrl)
    }
  }, [location.pathname, currentPage, setPage])

  useEffect(() => {
    initWebVitals()
  }, [])

  // Sync dark mode changes to current profile (avoids circular dep)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { darkMode: boolean } | undefined
      if (detail) {
        const current = useProfileStore.getState().currentProfile
        if (current) {
          useProfileStore.getState().updateProfile({ darkMode: detail.darkMode ? 'dark' : 'light' })
        }
      }
    }
    window.addEventListener('darkmode-changed', handler)
    return () => window.removeEventListener('darkmode-changed', handler)
  }, [])

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
    loadAccentColor()
    initAccessibility()
    loadProfiles()
      .then(async () => {
        setInitialized(true)
        preloadRoutes()

        // Check if mode selector should be shown
        const profile = useProfileStore.getState().currentProfile
        const modeChosen = localStorage.getItem('avora_accessibility')
        if (profile && !modeChosen) {
          setShowModeSelector(true)
        }

        // Apply system preference only if profile has no explicit setting
        if (!profile || profile.darkMode === 'system') {
          const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
          if (prefersDark) {
            document.documentElement.classList.add('dark')
            setDarkMode(true)
          }
        }

        // Pre-load tasks right after profiles are ready
        if (profile && !dataLoadedRef.current) {
          dataLoadedRef.current = true
          await refreshCoreData()
        }
      })
      .catch(() => setInitialized(true))
  }, [loadProfiles]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for system dark mode changes in real-time
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return

    const handler = (e: MediaQueryListEvent) => {
      const profile = useProfileStore.getState().currentProfile
      // Only react to system changes if profile uses 'system' mode
      if (!profile || profile.darkMode === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark')
          setDarkMode(true)
        } else {
          document.documentElement.classList.remove('dark')
          setDarkMode(false)
        }
      }
    }

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [setDarkMode])

  // Re-load data when profile becomes available (after Welcome screen)
  useEffect(() => {
    if (currentProfile && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      preloadRoutes()
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

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) handleVisibilityChange()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    // Also handle the `pageshow` event for PWA/iOS Safari which fires on app resume
    window.addEventListener('pageshow', handlePageShow as EventListener)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow as EventListener)
    }
  }, [refreshCoreData])

  if (!initialized || !authReady) {
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

  if (PUBLIC_PATHS.has(location.pathname)) {
    return <Landing />
  }

  if (!authenticated) {
    return (
      <LoginPage
        onComplete={() => {
          useAuthStore.getState().resetSignedOut()
          disableGuest()
          dataLoadedRef.current = false
          loadProfiles()
        }}
        onGuest={async () => {
          useAuthStore.getState().resetSignedOut()
          const profiles = useProfileStore.getState().profiles
          if (profiles.length === 0) {
            await useProfileStore.getState().createProfile('Tamu', null, false)
          }
          enableGuest()
          loadProfiles()
        }}
      />
    )
  }

  if (showWelcome) {
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
      {showModeSelector && (
        <ModeSelector onSelect={() => setShowModeSelector(false)} />
      )}
      {pinLocked && <PinModal />}
      {isDesktop ? (
        <div className="flex min-h-screen">
          <DesktopSidebar />
          <main className="flex-1 desktop-main">
            <Layout>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </Layout>
          </main>
        </div>
      ) : (
        <Layout>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </Layout>
      )}
      {/* Floating Action Button only on dashboard */}
      {currentPage === 'dashboard' && (
        <FAB
          onClick={() => useAppStore.getState().requestAddTask()}
          label={t('task.add')}
          className="!bottom-24 md:!bottom-8 md:hidden"
        />
      )}
      <InstallPrompt />
      <UpdatePrompt />
      <OnboardingTour />
    </>
  )
}
