import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { useProfileStore, useTaskStore, useAppStore } = vi.hoisted(() => {
  const mockAddTask = vi.fn()
  const mockUpdateTask = vi.fn()
  const mockloadTodayTasks = vi.fn()
  function mkStore(initial: any) {
    const store: any = (selector?: any) => selector ? selector(initial) : initial
    store.getState = () => initial
    return store
  }
  return {
    useProfileStore: mkStore({ currentProfile: { id: 'profile-1', name: 'Test' } }),
    useTaskStore: mkStore({ todayTasks: [], addTask: mockAddTask, updateTask: mockUpdateTask, loadTodayTasks: mockloadTodayTasks }),
    useAppStore: mkStore({ lang: 'id', addTaskRequestId: 0, requestAddTask: vi.fn() })
  }
})

vi.mock('../stores/useProfileStore', () => ({ useProfileStore }))
vi.mock('../stores/useTaskStore', () => ({ useTaskStore }))
vi.mock('../stores/useAppStore', () => ({ useAppStore }))
vi.mock('../database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../database')>()
  const mocked: Record<string, unknown> = {}
  for (const key of Object.keys(actual)) {
    mocked[key] = typeof actual[key as keyof typeof actual] === 'function'
      ? vi.fn().mockResolvedValue([])
      : actual[key as keyof typeof actual]
  }
  return mocked as typeof actual
})
vi.mock('../utils/templates', () => ({ getTemplates: () => [] }))
vi.mock('../i18n', () => ({ useT: () => (key: string) => key }))
vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    checkAndNotify: vi.fn(),
    requestPermission: vi.fn().mockResolvedValue(true),
    updatePrefs: vi.fn()
  })
}))
vi.mock('../hooks/useHaptic', () => ({ useHaptic: () => ({ trigger: vi.fn() }) }))
vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), toast: vi.fn() })
}))
vi.mock('../hooks/useConfirm', () => ({
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true), ConfirmDialog: () => null })
}))
vi.mock('../hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    containerRef: { current: null },
    pulling: false,
    pullDistance: 0,
    refreshing: false,
    isActive: false
  })
}))
vi.mock('../hooks/usePerformance', () => ({ usePerformance: vi.fn() }))
vi.mock('../hooks/useOffline', () => ({
  useOffline: () => ({ isOffline: false, queueToggleDone: vi.fn(), queueDelete: vi.fn() })
}))
vi.mock('./SmartReminder', () => ({ default: () => null }))
vi.mock('./VoiceToTask', () => ({ default: () => null }))

import Dashboard from './Dashboard'

describe('Dashboard integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard with session cards', () => {
    render(<Dashboard />)
    const sessions = screen.getAllByText(/session\.short/)
    expect(sessions.length).toBeGreaterThanOrEqual(4)
  })

  it('shows start session buttons', () => {
    render(<Dashboard />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
