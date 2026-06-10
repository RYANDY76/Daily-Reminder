import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin, encryptToken, decryptToken } from './crypto'

describe('crypto', () => {
  it('hashes and verifies PIN', async () => {
    const hash = await hashPin('1234')
    expect(await verifyPin('1234', hash)).toBe(true)
    expect(await verifyPin('9999', hash)).toBe(false)
  })

  it('encrypts and decrypts tokens with AES', async () => {
    const secret = 'google-access-token-abc'
    const encrypted = await encryptToken(secret)
    expect(encrypted.startsWith('v2:')).toBe(true)
    expect(await decryptToken(encrypted)).toBe(secret)
  })

  it('decrypts legacy tokens', async () => {
    const legacy = btoa('mytoken'.split('').reverse().join(''))
    expect(await decryptToken(legacy)).toBe('mytoken')
  })
})
