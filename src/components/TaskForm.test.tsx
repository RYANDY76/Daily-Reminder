import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { useProfileStore, useTaskStore, useAppStore } = vi.hoisted(() => {
  function mkStore(initial: any) {
    const store: any = (selector?: any) => selector ? selector(initial) : initial
    store.getState = () => initial
    return store
  }
  return {
    useProfileStore: mkStore({ currentProfile: { id: 'profile-1', name: 'Test' } }),
    useTaskStore: mkStore({ addTask: vi.fn(), updateTask: vi.fn() }),
    useAppStore: mkStore({ lang: 'id' })
  }
})

vi.mock('../stores/useProfileStore', () => ({ useProfileStore }))
vi.mock('../stores/useTaskStore', () => ({ useTaskStore }))
vi.mock('../stores/useAppStore', () => ({ useAppStore }))

vi.mock('../i18n', () => ({
  useT: () => (key: string) => key,
  t: (key: string) => key
}))

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn() })
}))

vi.mock('../utils/naturalLanguageParser', () => ({
  parseNaturalLanguage: () => ({ title: 'Parsed', time: '09:00', date: '2026-06-13' })
}))

vi.mock('../utils/naturalLanguage', () => ({
  hasTimeIndicator: () => false,
  hasDateIndicator: () => false
}))

vi.mock('../utils/templates', () => ({
  getTemplates: () => [],
  saveTemplate: vi.fn(),
  deleteTemplate: vi.fn()
}))

vi.mock('../database', () => ({
  saveTask: vi.fn()
}))

vi.mock('../services/smartSchedule', () => ({
  suggestOptimalTime: () => '09:00'
}))

import TaskForm from './TaskForm'

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<TaskForm onClose={vi.fn()} />)
    expect(screen.getAllByText('task.title').length).toBeGreaterThan(0)
  })

  it('pre-fills fields when editing a task', () => {
    const editTask = {
      id: 'task-edit', title: 'Edit Me', time: '10:00', date: '2026-06-13',
      notes: 'Some notes', priority: 'high' as const, color: '#EF4444', tags: ['work'],
      session: 'pagi' as const, done: false, status: 'pending' as const,
      subtasks: [], timeTracking: null, isRecurring: false, recurring: null,
      recurringId: null, sortOrder: 0, createdAt: Date.now(), updatedAt: Date.now(),
      snoozedUntil: null, dueDate: '2026-06-13', profileId: 'profile-1'
    }
    render(<TaskForm onClose={vi.fn()} editTask={editTask} />)
    expect(screen.getByDisplayValue('Edit Me')).toBeDefined()
  })
})
