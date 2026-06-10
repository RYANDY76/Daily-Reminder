const PIN_SALT = 'daily_reminder_pin_v1'
const CRYPTO_KEY_STORAGE = 'daily_reminder_crypto_key'
const V2_PREFIX = 'v2:'

function simpleHash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export async function hashPin(pin: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
      const encoder = new TextEncoder()
      const data = encoder.encode(PIN_SALT + pin)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {
    // fall through
  }
  return simpleHash(PIN_SALT + pin)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin)
  return pinHash === hash
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(CRYPTO_KEY_STORAGE)
  if (stored) {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const exported = await crypto.subtle.exportKey('raw', key)
  localStorage.setItem(CRYPTO_KEY_STORAGE, btoa(String.fromCharCode(...new Uint8Array(exported))))
  return key
}

function legacyDecrypt(encrypted: string): string {
  try {
    return atob(encrypted).split('').reverse().join('')
  } catch {
    return ''
  }
}

export async function encryptToken(token: string): Promise<string> {
  if (!token) return ''
  try {
    const key = await getOrCreateKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(token)
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
    const combined = new Uint8Array(iv.length + cipher.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(cipher), iv.length)
    return V2_PREFIX + btoa(String.fromCharCode(...combined))
  } catch {
    return btoa(token.split('').reverse().join(''))
  }
}

export async function decryptToken(encrypted: string): Promise<string> {
  if (!encrypted) return ''
  if (encrypted.startsWith(V2_PREFIX)) {
    try {
      const key = await getOrCreateKey()
      const combined = Uint8Array.from(atob(encrypted.slice(V2_PREFIX.length)), c => c.charCodeAt(0))
      const iv = combined.slice(0, 12)
      const cipher = combined.slice(12)
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
      return new TextDecoder().decode(plain)
    } catch {
      return ''
    }
  }
  return legacyDecrypt(encrypted)
}
