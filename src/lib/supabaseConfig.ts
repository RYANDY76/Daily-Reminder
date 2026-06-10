const URL_STORAGE_KEY = 'daily_reminder_supabase_url'
const ANON_STORAGE_KEY = 'daily_reminder_supabase_anon_key'

export type SupabaseConfigSource = 'env' | 'storage' | 'none'

export interface SupabaseConfig {
  url: string
  anonKey: string
  source: SupabaseConfigSource
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
    return { url: storedUrl, anonKey: storedKey, source: 'storage' }
  }

  return { url: '', anonKey: '', source: 'none' }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig()
  return !!(url && anonKey)
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(URL_STORAGE_KEY, url.trim())
  localStorage.setItem(ANON_STORAGE_KEY, anonKey.trim())
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(URL_STORAGE_KEY)
  localStorage.removeItem(ANON_STORAGE_KEY)
}
