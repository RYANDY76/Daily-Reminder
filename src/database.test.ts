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
  encryptToken: vi.fn((t: string) => Promise.resolve(`v2:encrypted_${t}`)),
  decryptToken: vi.fn((t: string) => {
    if (t.startsWith('v2:encrypted_')) {
      return Promise.resolve(t.replace('v2:encrypted_', ''))
    }
    return Promise.resolve('')
  }),
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

  it('encrypts google tokens on saveProfile', async () => {
    const { saveProfile } = await import('./database')
    const profile = {
      id: 'test-profile',
      name: 'Test',
      avatar: '',
      accentColor: '#1D9E75',
      pin: null,
      darkMode: 'system' as const,
      googleId: 'google-123',
      googleEmail: 'test@gmail.com',
      googlePhotoUrl: null,
      googleAccessToken: 'secret-token',
      googleRefreshToken: 'refresh-secret',
      supabaseUserId: null,
      biometricEnabled: false,
      biometricCredentialId: null,
      consentGiven: true,
      createdAt: Date.now(),
      lastSyncAt: null
    }
    const { encryptToken } = await import('./crypto')
    await saveProfile(profile)
    expect(encryptToken).toHaveBeenCalledTimes(2)
    expect(encryptToken).toHaveBeenCalledWith('secret-token')
    expect(encryptToken).toHaveBeenCalledWith('refresh-secret')
  })

  it('does not call encrypt when tokens are null', async () => {
    const { saveProfile } = await import('./database')
    const profile = {
      id: 'test-profile-2',
      name: 'Test',
      avatar: '',
      accentColor: '#1D9E75',
      pin: null,
      darkMode: 'system' as const,
      googleId: null,
      googleEmail: null,
      googlePhotoUrl: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      supabaseUserId: null,
      biometricEnabled: false,
      biometricCredentialId: null,
      consentGiven: true,
      createdAt: Date.now(),
      lastSyncAt: null
    }
    const { encryptToken } = await import('./crypto')
    await saveProfile(profile)
    expect(encryptToken).not.toHaveBeenCalled()
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
