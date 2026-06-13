import { getSupabase } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useProfileStore } from '../stores/useProfileStore'

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
const SUBSCRIPTION_KEY = 'daily_reminder_push_subscription'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i)
  return arr
}

export function isWebPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isWebPushSubscribed(): boolean {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return !!(parsed.endpoint && parsed.keys?.p256dh && parsed.keys?.auth)
  } catch {
    if (import.meta.env.DEV) console.warn('[WebPush] subscription check failed')
    return false
  }
}

export async function subscribeToWebPush(): Promise<{ ok: boolean; error?: string }> {
  if (!isWebPushSupported()) return { ok: false, error: 'not_supported' }
  if (!VAPID_KEY) return { ok: false, error: 'no_vapid' }

  const user = useAuthStore.getState().user
  const profile = useProfileStore.getState().currentProfile
  if (!user || !profile) return { ok: false, error: 'login_required' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, error: 'denied' }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()

  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as BufferSource
    })
  }

  const json = sub.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Invalid push subscription: missing required fields')
  }
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(json))
  await savePushSubscriptionToCloud(sub)
  return { ok: true }
}

export async function unsubscribeFromWebPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    try {
      await sub.unsubscribe()
    } catch (err) {
      if (import.meta.env.DEV) console.error('[WebPush] Unsubscribe failed:', err)
    }
  }
  localStorage.removeItem(SUBSCRIPTION_KEY)

  const sb = getSupabase()
  const user = useAuthStore.getState().user
  const profile = useProfileStore.getState().currentProfile
  if (sb && user && profile) {
    await sb.from('push_subscriptions').delete().eq('auth_user_id', user.id).eq('profile_id', profile.id)
  }
}

async function savePushSubscriptionToCloud(sub: PushSubscription): Promise<void> {
  const sb = getSupabase()
  const user = useAuthStore.getState().user
  const profile = useProfileStore.getState().currentProfile
  if (!sb || !user || !profile) return

  const json = sub.toJSON()
  let attempts = 0
  const maxAttempts = 3
  while (attempts < maxAttempts) {
    try {
      const { error } = await sb.from('push_subscriptions').upsert({
        id: `${user.id}_${profile.id}`,
        auth_user_id: user.id,
        profile_id: profile.id,
        endpoint: json.endpoint,
        subscription: json,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      if (!error) return
      throw error
    } catch (err) {
      attempts++
      if (attempts >= maxAttempts) {
        if (import.meta.env.DEV) console.error('[WebPush] Failed to save subscription to cloud after retries:', err)
        return
      }
      await new Promise(r => setTimeout(r, 1000 * attempts))
    }
  }
}
