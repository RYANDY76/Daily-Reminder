import { describe, it, expect } from 'vitest'
import {
  isValidString,
  isValidUUID,
  isValidCoupleId,
  isValidProfileId,
  isValidTimestamp,
  sanitizeString,
  isValidInviteCode,
  validateCoupleConnection,
  validateCoupleData
} from './validation'

describe('validation', () => {
  describe('isValidString', () => {
    it('accepts valid strings', () => {
      expect(isValidString('hello')).toBe(true)
      expect(isValidString('a')).toBe(true)
    })
    it('rejects empty/whitespace strings', () => {
      expect(isValidString('')).toBe(false)
      expect(isValidString('   ')).toBe(false)
    })
    it('rejects non-strings', () => {
      expect(isValidString(null)).toBe(false)
      expect(isValidString(undefined)).toBe(false)
      expect(isValidString(123)).toBe(false)
    })
    it('respects maxLength', () => {
      expect(isValidString('x'.repeat(500), 500)).toBe(true)
      expect(isValidString('x'.repeat(501), 500)).toBe(false)
    })
  })

  describe('isValidUUID', () => {
    it('accepts valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })
    it('rejects invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID(123)).toBe(false)
    })
  })

  describe('isValidTimestamp', () => {
    it('accepts valid timestamps', () => {
      expect(isValidTimestamp(Date.now())).toBe(true)
      expect(isValidTimestamp(1)).toBe(true)
    })
    it('rejects invalid timestamps', () => {
      expect(isValidTimestamp(0)).toBe(false)
      expect(isValidTimestamp(-1)).toBe(false)
      expect(isValidTimestamp(Infinity)).toBe(false)
      expect(isValidTimestamp('now')).toBe(false)
    })
  })

  describe('sanitizeString', () => {
    it('trims and truncates', () => {
      expect(sanitizeString('  hello  ')).toBe('hello')
      expect(sanitizeString('x'.repeat(600), 10)).toBe('x'.repeat(10))
    })
    it('removes null bytes', () => {
      expect(sanitizeString('hel\0lo')).toBe('hello')
    })
  })

  describe('isValidInviteCode', () => {
    it('accepts valid codes', () => {
      expect(isValidInviteCode('ABCDEF')).toBe(true)
      expect(isValidInviteCode('1234')).toBe(true)
    })
    it('rejects short codes', () => {
      expect(isValidInviteCode('ABC')).toBe(false)
      expect(isValidInviteCode('')).toBe(false)
    })
  })

  describe('validateCoupleConnection', () => {
    it('returns null for valid data', () => {
      expect(validateCoupleConnection({})).toBeNull()
    })
    it('rejects invalid UUID', () => {
      expect(validateCoupleConnection({ id: 'bad' })).toBe('Invalid connection ID format')
    })
    it('rejects invalid status', () => {
      expect(validateCoupleConnection({ status: 'deleted' })).toBe('Invalid status')
    })
    it('accepts valid status', () => {
      expect(validateCoupleConnection({ status: 'active' })).toBeNull()
    })
  })

  describe('validateCoupleData', () => {
    it('returns null for valid data', () => {
      expect(validateCoupleData({ coupleId: 'abc', data: {} })).toBeNull()
    })
    it('rejects missing coupleId', () => {
      expect(validateCoupleData({ data: {} })).toBe('Invalid or missing couple_id')
    })
    it('rejects null data', () => {
      expect(validateCoupleData({ coupleId: 'abc', data: null })).toBe('Data payload is required')
    })
  })
})
