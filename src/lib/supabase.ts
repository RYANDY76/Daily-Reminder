import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './supabaseConfig'

let client: SupabaseClient | null = null
let cachedKey = ''

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig()
  if (!url || !anonKey) {
    client = null
    cachedKey = ''
    return null
  }

  const cacheId = `${url}:${anonKey.slice(0, 8)}`
  if (client && cachedKey === cacheId) return client

  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  })
  cachedKey = cacheId
  return client
}

export function resetSupabaseClient(): void {
  client = null
  cachedKey = ''
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'not_configured' }

  const { error } = await sb.from('couple_connections').select('id').limit(1)
  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return { ok: false, error: 'schema_missing' }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
