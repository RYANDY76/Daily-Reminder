import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, recordAttempt, isRateLimited, getRemainingAttempts } from './rateLimiter'

describe('rateLimiter', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('allows first attempt', () => {
    expect(checkRateLimit('test-key')).toBe(true)
    const result = recordAttempt('test-key')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('tracks remaining attempts', () => {
    for (let i = 0; i < 3; i++) {
      const result = recordAttempt('test-key-2')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4 - i)
    }
  })

  it('blocks after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      recordAttempt('test-key-3')
    }
    expect(isRateLimited('test-key-3')).toBe(true)
    const result = recordAttempt('test-key-3')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('returns zero remaining when rate limited', () => {
    const key = 'test-key-4'
    expect(getRemainingAttempts(key)).toBe(5)
    for (let i = 0; i < 5; i++) recordAttempt(key)
    expect(getRemainingAttempts(key)).toBe(0)
  })

  it('handles unknown keys gracefully', () => {
    expect(isRateLimited('unknown')).toBe(false)
    expect(getRemainingAttempts('unknown')).toBe(5)
  })
})
