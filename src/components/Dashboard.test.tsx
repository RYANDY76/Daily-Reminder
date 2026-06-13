import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const { useProfileStore, useTaskStore, useAppStore } = vi.hoisted(() => {
  function mkStore(initial: any) {
    const store: any = (selector?: any) => selector ? selector(initial) : initial
    store.getState = () => initial
    return store
  }
  return {
    useProfileStore: mkStore({
      currentProfile: { id: 'profile-1', name: 'Test User', accentColor: '#1D9E75' },
      profiles: [{ id: 'profile-1', name: 'Test User' }],
      loading: false
    }),
    useTaskStore: mkStore({
      todayTasks: [
        { id: 'task-1', title: 'Test Task 1', session: 'pagi', priority: 'medium', done: false, status: 'pending', tags: [], time: '08:00', date: '2026-06-13', profileId: 'profile-1', color: '#1D9E75', createdAt: Date.now(), updatedAt: Date.now(), snoozedUntil: null, sortOrder: 0, isRecurring: false, recurring: null, recurringId: null, notes: '', subtasks: [], timeTracking: null, dueDate: '2026-06-13' }
      ],
      loading: false,
      loadTodayTasks: vi.fn(),
      checkDayChange: vi.fn(),
      toggleTaskDone: vi.fn(),
      removeTask: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn()
    }),
    useAppStore: mkStore({
      currentPage: 'dashboard',
      darkMode: false,
      lang: 'id',
      notificationEnabled: false,
      addTaskRequestId: 0,
      toastQueue: [],
      setPage: vi.fn(),
      requestAddTask: vi.fn(),
      removeToast: vi.fn(),
      setNotificationEnabled: vi.fn(),
      setGlobalSearchOpen: vi.fn()
    })
  }
})

vi.mock('../stores/useProfileStore', () => ({ useProfileStore }))
vi.mock('../stores/useTaskStore', () => ({ useTaskStore }))
vi.mock('../stores/useAppStore', () => ({ useAppStore }))

vi.mock('../i18n', () => ({
  useT: () => (key: string) => key,
  t: (key: string) => key
}))

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({ checkAndNotify: vi.fn(), requestPermission: vi.fn(), updatePrefs: vi.fn() })
}))

vi.mock('../hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({ containerRef: { current: null } })
}))

vi.mock('../hooks/useOffline', () => ({
  useOffline: () => ({ isOffline: false, queueToggleDone: vi.fn(), queueDelete: vi.fn() })
}))

vi.mock('../hooks/useHaptic', () => ({
  useHaptic: () => ({ trigger: vi.fn() })
}))

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() })
}))

vi.mock('../hooks/useConfirm', () => ({
  useConfirm: () => ({ confirm: vi.fn(), ConfirmDialog: () => null })
}))

vi.mock('../hooks/usePerformance', () => ({
  usePerformance: () => {}
}))

vi.mock('../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: () => {}
}))

vi.mock('../database', () => ({
  getHabitsForProfile: () => Promise.resolve([]),
  getLastNDaysHistory: () => Promise.resolve([]),
  getMoodLog: () => Promise.resolve(null),
  saveMoodLog: vi.fn(),
  getLast7DaysHistory: () => Promise.resolve([]),
  getPomodoroSessionsRange: () => Promise.resolve([]),
  getAllTasksForProfile: () => Promise.resolve([]),
  saveTask: vi.fn(),
  saveHabit: vi.fn(),
  deleteHabit: vi.fn(),
  saveGoal: vi.fn(),
  getGoalsForProfile: () => Promise.resolve([]),
  deleteGoal: vi.fn(),
  getTasksForDateRange: () => Promise.resolve([]),
  getTasksForDate: () => Promise.resolve([]),
  getDailyHistory: () => Promise.resolve([]),
  db: { get: vi.fn(), getAll: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

vi.mock('../services/autoCloudSync', () => ({
  scheduleAutoCloudSync: vi.fn()
}))

import Dashboard from './Dashboard'

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders task list', () => {
    renderDashboard()
    expect(screen.getByText('Test Task 1')).toBeDefined()
  })

  it('renders without crashing', () => {
    renderDashboard()
    expect(screen.getByText('Test Task 1')).toBeDefined()
  })
})
