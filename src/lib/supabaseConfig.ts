const URL_STORAGE_KEY = 'daily_reminder_supabase_url'
const ANON_STORAGE_KEY = 'daily_reminder_supabase_anon_key'

export type SupabaseConfigSource = 'env' | 'storage' | 'none'

export interface SupabaseConfig {
  url: string
  anonKey: string
  source: SupabaseConfigSource
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && url.includes('.supabase.')
  } catch {
    return false
  }
}

function isValidAnonKey(key: string): boolean {
  return key.length >= 30 && /^[A-Za-z0-9._-]+$/.test(key)
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, source: 'env' }
  }

  const storedUrl = localStorage.getItem(URL_STORAGE_KEY)?.trim() || ''
  const storedKey = localStorage.getItem(ANON_STORAGE_KEY)?.trim() || ''

  if (storedUrl && storedKey) {
    if (import.meta.env.DEV) console.warn('[Supabase] Using localStorage fallback for config')
    return { url: storedUrl, anonKey: storedKey, source: 'storage' }
  }

  return { url: '', anonKey: '', source: 'none' }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig()
  return !!(url && anonKey)
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  const trimmedUrl = url.trim()
  const trimmedKey = anonKey.trim()

  if (!isValidUrl(trimmedUrl)) {
    throw new Error('Invalid Supabase URL: must be a valid HTTPS URL containing .supabase.')
  }
  if (!isValidAnonKey(trimmedKey)) {
    throw new Error('Invalid Supabase anon key: must be at least 30 characters and contain only alphanumeric, dot, underscore, or hyphen characters')
  }

  localStorage.setItem(URL_STORAGE_KEY, trimmedUrl)
  localStorage.setItem(ANON_STORAGE_KEY, trimmedKey)
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(URL_STORAGE_KEY)
  localStorage.removeItem(ANON_STORAGE_KEY)
}
