import { useCallback, useState } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { encryptToken, decryptToken } from '../crypto'
import { useGoogleAuth } from './useGoogleAuth'
import { parseGoogleApiEvents, saveGoogleCalendarEvents } from '../utils/googleCalendarEvents'

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'

interface GoogleCalendarHook {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  syncEvents: () => Promise<any[]>
  createEvent: (summary: string, startTime: string, endTime: string) => Promise<string | null>
  isConnected: boolean
  isSyncing: boolean
  error: string | null
}

async function getValidAccessToken(
  profile: { googleAccessToken: string | null },
  login: () => Promise<{ accessToken?: string } | null>,
  updateProfile: (updates: Record<string, unknown>) => Promise<void>
): Promise<string | null> {
  if (!profile.googleAccessToken) return null
  let token = await decryptToken(profile.googleAccessToken)
  if (!token) return null

  const probe = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + encodeURIComponent(token))
  if (probe.ok) return token

  const user = await login()
  if (!user?.accessToken) return null

  const encrypted = await encryptToken(user.accessToken)
  await updateProfile({ googleAccessToken: encrypted, lastSyncAt: Date.now() })
  return user.accessToken
}

export function useGoogleCalendar(): GoogleCalendarHook {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const profile = useProfileStore((s) => s.currentProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const { login } = useGoogleAuth()

  const isConnected = profile?.googleCalendarConnected ?? false

  const connect = useCallback(async () => {
    setError(null)
    try {
      const user = await login()
      if (!user) {
        setError('Autentikasi Google gagal')
        return
      }

      const encryptedToken = user.accessToken ? await encryptToken(user.accessToken) : null

      await updateProfile({
        googleId: user.id,
        googleEmail: user.email,
        googlePhotoUrl: user.picture,
        googleCalendarConnected: true,
        googleCalendarId: 'primary',
        googleAccessToken: encryptedToken,
        lastSyncAt: Date.now()
      })
    } catch {
      setError('Gagal menghubungkan Google Calendar')
    }
  }, [login, updateProfile])

  const disconnect = useCallback(async () => {
    await updateProfile({
      googleCalendarConnected: false,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleCalendarId: null,
      lastSyncAt: null
    })
  }, [updateProfile])

  const syncEvents = useCallback(async (): Promise<any[]> => {
    if (!profile?.googleAccessToken) {
      setError('Belum terhubung ke Google Calendar')
      return []
    }

    setIsSyncing(true)
    setError(null)

    try {
      const token = await getValidAccessToken(profile, login, updateProfile)
      if (!token) {
        setError('Token tidak valid, silakan hubungkan ulang')
        return []
      }

      const now = new Date()
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${weekLater.toISOString()}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!response.ok) {
        throw new Error('Gagal mengambil data dari Google Calendar')
      }

      const data = await response.json()
      const events = parseGoogleApiEvents(data.items || [])
      if (profile?.id) {
        saveGoogleCalendarEvents(profile.id, events)
        window.dispatchEvent(new CustomEvent('google-calendar-updated'))
      }
      await updateProfile({ lastSyncAt: Date.now() })
      return data.items || []
    } catch (err) {
      setError('Gagal sinkronisasi: ' + (err as Error).message)
      return []
    } finally {
      setIsSyncing(false)
    }
  }, [profile, updateProfile, login])

  const createEvent = useCallback(async (
    summary: string,
    startTime: string,
    endTime: string
  ): Promise<string | null> => {
    if (!profile?.googleAccessToken) {
      setError('Belum terhubung ke Google Calendar')
      return null
    }

    try {
      const token = await getValidAccessToken(profile, login, updateProfile)
      if (!token) return null

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary,
            start: { dateTime: startTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end: { dateTime: endTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
          })
        }
      )

      if (!response.ok) throw new Error('Gagal membuat event')

      const data = await response.json()
      return data.id || null
    } catch (err) {
      setError('Gagal membuat event: ' + (err as Error).message)
      return null
    }
  }, [profile, login, updateProfile])

  return { connect, disconnect, syncEvents, createEvent, isConnected, isSyncing, error }
}
