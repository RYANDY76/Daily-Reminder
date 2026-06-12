import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskStore } from './useTaskStore'
import type { Task } from '../types'

vi.mock('../database', () => ({
  saveTask: vi.fn(),
  getTasksForDate: vi.fn(),
  deleteTask: vi.fn(),
  getAllTasksForProfile: vi.fn(),
  saveDailyHistory: vi.fn(),
  getTaskById: vi.fn()
}))

vi.mock('../dates', () => ({
  getSessionFromTime: vi.fn().mockReturnValue('pagi'),
  getTodayDate: vi.fn().mockReturnValue('2026-06-11'),
  isPast: vi.fn().mockReturnValue(false)
}))

vi.mock('./useProfileStore', () => ({
  useProfileStore: {
    getState: vi.fn().mockReturnValue({
      currentProfile: { id: 'test-profile', name: 'Test' }
    })
  }
}))

vi.mock('./useCoupleStore', () => ({
  useCoupleStore: {
    getState: vi.fn().mockReturnValue({
      connection: null,
      addPoints: vi.fn()
    })
  }
}))

vi.mock('./useAppStore', () => ({
  useAppStore: {
    getState: vi.fn().mockReturnValue({
      addToast: vi.fn()
    })
  }
}))

vi.mock('../utils/errorHandler', () => ({
  AppErrorHandler: {
    logError: vi.fn()
  },
  retryAsync: vi.fn((fn: () => Promise<unknown>) => fn())
}))

vi.mock('../services/autoCloudSync', () => ({
  scheduleAutoCloudSync: vi.fn()
}))

const mockTask: Task = {
  id: '1',
  profileId: 'test-profile',
  title: 'Test Task',
  time: '08:00',
  session: 'pagi',
  notes: '',
  color: '#1D9E75',
  done: false,
  status: 'pending',
  priority: 'medium',
  tags: [],
  dueDate: '2026-06-11',
  subtasks: [],
  timeTracking: null,
  recurring: null,
  isRecurring: false,
  recurringId: null,
  date: '2026-06-11',
  sortOrder: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  snoozedUntil: null
}

beforeEach(() => {
  useTaskStore.setState({ todayTasks: [], loading: true, tasks: [] })
})

describe('useTaskStore', () => {
  it('should have the expected actions', () => {
    const store = useTaskStore.getState()
    expect(typeof store.loadTodayTasks).toBe('function')
    expect(typeof store.addTask).toBe('function')
    expect(typeof store.toggleTaskDone).toBe('function')
    expect(typeof store.removeTask).toBe('function')
    expect(typeof store.checkDayChange).toBe('function')
    expect(typeof store.updateTask).toBe('function')
  })

  it('should start with expected initial state', () => {
    const store = useTaskStore.getState()
    expect(store.todayTasks).toEqual([])
    expect(store.loading).toBe(true)
    expect(store.tasks).toEqual([])
  })

  it('should load today tasks', async () => {
    const { getTasksForDate } = await import('../database')
    vi.mocked(getTasksForDate).mockResolvedValue([mockTask])

    await useTaskStore.getState().loadTodayTasks()

    const state = useTaskStore.getState()
    expect(state.loading).toBe(false)
    expect(state.todayTasks).toHaveLength(1)
    expect(state.todayTasks[0].title).toBe('Test Task')
  })

  it('should add a task and update state', async () => {
    const { saveTask, getTasksForDate } = await import('../database')
    vi.mocked(saveTask).mockResolvedValue(undefined)
    vi.mocked(getTasksForDate).mockResolvedValue([mockTask])

    const task = await useTaskStore.getState().addTask({
      title: 'Test Task',
      time: '08:00'
    })

    expect(task.title).toBe('Test Task')
    expect(saveTask).toHaveBeenCalled()
  })

  it('should toggle task done status', async () => {
    const { saveTask } = await import('../database')
    vi.mocked(saveTask).mockResolvedValue(undefined)

    useTaskStore.setState({ tasks: [mockTask], todayTasks: [mockTask], loading: false })
    await useTaskStore.getState().toggleTaskDone('1')

    expect(saveTask).toHaveBeenCalled()
  })

  it('should remove a task', async () => {
    const { deleteTask } = await import('../database')
    vi.mocked(deleteTask).mockResolvedValue(undefined)

    useTaskStore.setState({ tasks: [mockTask], todayTasks: [mockTask], loading: false })
    await useTaskStore.getState().removeTask('1')

    expect(deleteTask).toHaveBeenCalledWith('1')
  })

  it('should update a task', async () => {
    const { saveTask } = await import('../database')
    vi.mocked(saveTask).mockResolvedValue(undefined)

    useTaskStore.setState({ tasks: [mockTask], todayTasks: [mockTask], loading: false })
    await useTaskStore.getState().updateTask('1', { title: 'Updated' })

    expect(saveTask).toHaveBeenCalled()
  })

  it('should handle loadTodayTasks with error', async () => {
    const { getTasksForDate } = await import('../database')
    vi.mocked(getTasksForDate).mockRejectedValue(new Error('DB error'))

    await expect(useTaskStore.getState().loadTodayTasks()).rejects.toThrow('DB error')

    const state = useTaskStore.getState()
    expect(state.loading).toBe(false)
  })
})
