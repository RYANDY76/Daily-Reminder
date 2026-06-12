import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin, encryptToken, decryptToken } from './crypto'

describe('crypto', () => {
  it('hashes and verifies PIN with per-user salt', async () => {
    const salt = crypto.randomUUID()
    const hash = await hashPin('1234', salt)
    expect(await verifyPin('1234', hash, salt)).toBe(true)
    expect(await verifyPin('9999', hash, salt)).toBe(false)
  })

  it('produces different hashes for different salts', async () => {
    const hash1 = await hashPin('1234', 'salt-a')
    const hash2 = await hashPin('1234', 'salt-b')
    expect(hash1).not.toBe(hash2)
  })

  it('encrypts and decrypts tokens with AES', async () => {
    const secret = 'test-secret-token-abc'
    const encrypted = await encryptToken(secret)
    expect(encrypted.startsWith('v2:')).toBe(true)
    expect(await decryptToken(encrypted)).toBe(secret)
  })

  it('rejects legacy tokens (fail securely)', async () => {
    const legacy = btoa('mytoken'.split('').reverse().join(''))
    expect(await decryptToken(legacy)).toBe('')
  })
})
