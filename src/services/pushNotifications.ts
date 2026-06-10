import { getSupabase } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useProfileStore } from '../stores/useProfileStore'

export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  const session = useAuthStore.getState().session
  const profile = useProfileStore.getState().currentProfile

  if (!sb || !session || !profile) {
    return { ok: false, error: 'Login cloud dan aktifkan push terlebih dahulu' }
  }

  const { data, error } = await sb.functions.invoke('send-push', {
    body: {
      profileId: profile.id,
      title: 'Daily Reminder',
      body: 'Push notifikasi berhasil! 🎉',
      url: '/',
      tag: `test-${Date.now()}`
    }
  })

  if (error) return { ok: false, error: error.message }
  if (data?.error) return { ok: false, error: data.error }
  return { ok: true }
}
