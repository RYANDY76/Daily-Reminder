import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('dexie', () => {
  const mockTable = {
    where: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    get: vi.fn(),
    put: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
    bulkPut: vi.fn(),
    filter: vi.fn().mockReturnThis(),
    count: vi.fn(),
    equals: vi.fn().mockReturnThis(),
    first: vi.fn(),
    clear: vi.fn()
  }
  class MockDexie {
    connections = mockTable
    sharedTasks = mockTable
    coupleGoals = mockTable
    loveNotes = mockTable
    activityFeed = mockTable
    taskComments = mockTable
    version() { return { stores: () => this } }
  }
  return { default: MockDexie, Dexie: MockDexie }
})

vi.mock('./database', () => {
  const mockTable = {
    add: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    where: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    equals: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    filter: vi.fn().mockReturnThis(),
    count: vi.fn().mockResolvedValue(0),
    bulkPut: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined)
  }
  return {
    db: {
      connections: mockTable,
      sharedTasks: mockTable,
      coupleGoals: mockTable,
      loveNotes: mockTable,
      activityFeed: mockTable,
      taskComments: mockTable
    }
  }
})

vi.mock('./services/coupleSync', () => ({
  isCoupleSyncEnabled: vi.fn(() => false),
  syncCreateConnection: vi.fn(),
  syncJoinConnection: vi.fn(),
  syncGetConnectionByProfile: vi.fn(),
  syncDeleteConnection: vi.fn(),
  syncGoal: vi.fn(),
  syncDeleteGoal: vi.fn(),
  syncLoveNote: vi.fn(),
  syncActivity: vi.fn(),
  syncSharedTask: vi.fn(),
  syncTaskComment: vi.fn(),
  pullCoupleData: vi.fn(),
  syncUpdateConnectionGamification: vi.fn()
}))

vi.mock('./utils/rateLimiter', () => {
  let attempts = 0
  return {
    isRateLimited: vi.fn(() => false),
    recordAttempt: vi.fn(() => {
      attempts++
      return { allowed: attempts < 5, remaining: 5 - attempts }
    }),
    getRemainingAttempts: vi.fn(() => 5)
  }
})

vi.mock('./utils/errorHandler', () => ({
  AppErrorHandler: { logError: vi.fn() }
}))

describe('database-couple', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('creates a couple connection with invite code', async () => {
    const { createCoupleConnection } = await import('./database-couple')
    const conn = await createCoupleConnection('profile-1', 'Alice')
    expect(conn.profile1Id).toBe('profile-1')
    expect(conn.profile1Name).toBe('Alice')
    expect(conn.status).toBe('pending')
    expect(conn.inviteCode).toMatch(/^[A-Z2-9]{6}$/)
  })

  it('returns null for invalid invite code (rate limited)', async () => {
    const rateLimiter = await import('./utils/rateLimiter')
    vi.mocked(rateLimiter.isRateLimited).mockReturnValue(true)
    const { joinCoupleConnection } = await import('./database-couple')
    const result = await joinCoupleConnection('XXXXXX', 'profile-2', 'Bob')
    expect(result).toBeNull()
  })
})
