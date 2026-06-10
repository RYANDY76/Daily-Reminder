const CLIENT_ID_KEY = 'daily_reminder_google_client_id'
const CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly'

function getClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem(CLIENT_ID_KEY) || ''
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.accounts) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Google Identity Services'))
    document.head.appendChild(script)
  })
}

export async function requestGoogleAccessToken(scope = CALENDAR_SCOPES): Promise<string | null> {
  const clientId = getClientId()
  if (!clientId) return null

  try {
    await loadGisScript()
    return await new Promise<string>((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope,
        callback: (response: { access_token?: string; error?: string; error_description?: string }) => {
          if (response.access_token) resolve(response.access_token)
          else reject(new Error(response.error_description || response.error || 'Auth failed'))
        },
        error_callback: (err: { message?: string; type?: string }) => {
          reject(new Error(err?.message || err?.type || 'Popup closed'))
        }
      })
      client.requestAccessToken()
    })
  } catch {
    return null
  }
}
