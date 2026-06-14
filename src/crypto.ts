import { STORAGE_KEYS } from './constants'

const V2_PREFIX = 'v2:'

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
  const pinHash = await hashPin(pin, salt)
  return timingSafeEqual(pinHash, hash)
}

async function getKeyFromStorage(): Promise<CryptoKey | null> {
  try {
    let stored = sessionStorage.getItem(STORAGE_KEYS.CRYPTO_KEY_V2)
    if (!stored) {
      // Migration: check localStorage as fallback (read-only)
      const legacy = localStorage.getItem(STORAGE_KEYS.CRYPTO_KEY_V2)
      if (legacy) {
        sessionStorage.setItem(STORAGE_KEYS.CRYPTO_KEY_V2, legacy)
        localStorage.removeItem('daily_reminder_crypto_key_v2')
        stored = legacy
      } else {
        return null
      }
    }
    const parts = stored.split(':')
    if (parts.length !== 2) return null
    const raw = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  } catch {
    if (import.meta.env.DEV) console.warn('[Crypto] key retrieval failed')
    return null
  }
}

async function generateAndStoreKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const exported = await crypto.subtle.exportKey('raw', key)
  const keyId = crypto.randomUUID()
  const encoded = btoa(String.fromCharCode(...new Uint8Array(exported)))
  sessionStorage.setItem(STORAGE_KEYS.CRYPTO_KEY_V2, `${keyId}:${encoded}`)
  return key
}

let cachedKey: CryptoKey | null = null

async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  cachedKey = await getKeyFromStorage()
  if (!cachedKey) {
    cachedKey = await generateAndStoreKey()
  }
  return cachedKey
}

export async function encryptToken(token: string): Promise<string> {
  if (!token) return ''
  const key = await getOrCreateKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(token)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + cipher.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(cipher), iv.length)
  return V2_PREFIX + btoa(String.fromCharCode(...combined))
}

export async function decryptToken(encrypted: string): Promise<string> {
  if (!encrypted) return ''
  if (!encrypted.startsWith(V2_PREFIX)) return ''
  try {
    const key = await getOrCreateKey()
    const combined = Uint8Array.from(atob(encrypted.slice(V2_PREFIX.length)), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const cipher = combined.slice(12)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    return new TextDecoder().decode(plain)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    if (import.meta.env.DEV) console.error('Decryption failed:', error.message)
    return ''
  }
}
