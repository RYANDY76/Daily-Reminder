import { describe, it, expect, vi, beforeEach } from 'vitest'

// We need to test that dbCall properly logs errors
// Since dbCall is not exported, we test through public functions
// Mock Dexie
vi.mock('dexie', () => {
  const mockTable = {
    where: vi.fn().mockReturnThis(),
    toArray: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
    bulkPut: vi.fn(),
    filter: vi.fn().mockReturnThis(),
    count: vi.fn(),
    equals: vi.fn().mockReturnThis(),
  }
  
  class MockDexie {
    tasks = mockTable
    profiles = mockTable
    history = mockTable
    habits = mockTable
    moodLogs = mockTable
    pomodoroSessions = mockTable
    goals = mockTable
    version() { return { stores: () => this } }
  }
  
  return { default: MockDexie, Dexie: MockDexie }
})

vi.mock('./utils/errorHandler', () => ({
  AppErrorHandler: {
    logError: vi.fn()
  }
}))

vi.mock('./crypto', () => ({
  hashPin: vi.fn(),
  verifyPin: vi.fn(),
  encryptToken: vi.fn(),
  decryptToken: vi.fn(),
}))

describe('database', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return empty array fallback on getTasksForDate error', async () => {
    const dexie = await import('dexie')
    const MockDexie = (dexie as any).default
    const instance = new MockDexie()
    instance.tasks.where.mockImplementation(() => {
      throw new Error('DB connection failed')
    })

    // Re-mock to use our throwing instance
    vi.doMock('dexie', () => {
      const ThrowingMockDexie = class extends MockDexie {
        constructor() {
          super()
          this.tasks = instance.tasks
        }
      }
      return { default: ThrowingMockDexie, Dexie: ThrowingMockDexie }
    })

    const { getTasksForDate } = await import('./database')
    const { AppErrorHandler } = await import('./utils/errorHandler')
    
    const result = await getTasksForDate('test-profile', '2024-01-01')
    expect(result).toEqual([])
    expect(AppErrorHandler.logError).toHaveBeenCalledWith(
      'DB_ERROR',
      expect.stringContaining('getTasksForDate'),
      'high',
      expect.any(Object)
    )
  })

  it('should return undefined fallback on getTaskById error', async () => {
    const dexie = await import('dexie')
    const MockDexie = (dexie as any).default
    const instance = new MockDexie()
    instance.tasks.get.mockRejectedValue(new Error('Not found'))

    vi.doMock('dexie', () => {
      const ThrowingMockDexie = class extends MockDexie {
        constructor() {
          super()
          this.tasks = instance.tasks
        }
      }
      return { default: ThrowingMockDexie, Dexie: ThrowingMockDexie }
    })

    const { getTaskById } = await import('./database')
    const result = await getTaskById('non-existent-id')
    expect(result).toBeUndefined()
  })
})
