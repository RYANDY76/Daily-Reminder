import { useState, useCallback, useRef } from 'react'

const CLIENT_ID_KEY = 'avora_google_client_id'

export interface GoogleUserInfo {
  id: string
  name: string
  email: string
  picture: string
  accessToken?: string
}

function getEffectiveClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem(CLIENT_ID_KEY) || ''
}

function decodeJwt(credential: string): GoogleUserInfo {
  const payload = JSON.parse(atob(credential.split('.')[1]))
  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    picture: payload.picture
  }
}

function storeClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_KEY, clientId)
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

interface RenderButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  type?: 'standard' | 'icon'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  logo_alignment?: 'left' | 'center'
  width?: number
}

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const clientId = getEffectiveClientId()
  const initPromiseRef = useRef<Promise<void> | null>(null)

  const initGis = useCallback(async () => {
    if (initPromiseRef.current) return initPromiseRef.current
    initPromiseRef.current = (async () => {
      if (initialized) return
      const cid = getEffectiveClientId()
      if (!cid) throw new Error('Google Client ID belum dikonfigurasi')
      await loadGisScript()
      setInitialized(true)
    })()
    return initPromiseRef.current
  }, [initialized])

  const renderButton = useCallback((
    container: HTMLElement,
    onSuccess: (user: GoogleUserInfo) => void,
    onError?: (err: string) => void,
    options: RenderButtonOptions = {}
  ) => {
    const cid = getEffectiveClientId()
    if (!cid) {
      onError?.('Google Client ID belum dikonfigurasi')
      return
    }

    setLoading(true)
    setError(null)

    loadGisScript()
      .then(() => {
        google.accounts.id.initialize({
          client_id: cid,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              const userInfo = decodeJwt(response.credential)
              onSuccess(userInfo)
            } else {
              onError?.('Autentikasi gagal: tidak ada credential')
            }
          },
          cancel_on_tap_outside: false
        })
        google.accounts.id.renderButton(container, {
          theme: options.theme || 'outline',
          size: options.size || 'large',
          type: options.type || 'standard',
          shape: options.shape || 'rectangular',
          text: options.text || 'signin_with',
          logo_alignment: options.logo_alignment || 'left',
          width: options.width
        })
        setLoading(false)
      })
      .catch((err) => {
        const msg = (err as Error).message || 'Gagal memuat Google Identity Services'
        setError(msg)
        onError?.(msg)
        setLoading(false)
      })
  }, [])

  const login = useCallback(async (): Promise<GoogleUserInfo | null> => {
    const cid = getEffectiveClientId()
    if (!cid) {
      setError('Google Client ID belum dikonfigurasi')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      await loadGisScript()

      const accessToken = await new Promise<string>((resolve, reject) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: cid,
          scope: 'openid profile email',
          callback: (response: any) => {
            if (response.access_token) resolve(response.access_token)
            else if (response.error) reject(new Error(response.error_description || response.error))
            else reject(new Error('Autentikasi gagal'))
          },
          error_callback: (err: any) => {
            const msg = err?.message || err?.type || 'Popup ditutup'
            if (msg.includes('popup') || msg.includes('closed')) {
              reject(new Error('Popup ditutup. Pastikan popup tidak diblokir browser dan OAuth consent screen sudah diatur di Google Cloud Console (External, tambahkan email sebagai test user).'))
            } else if (err?.type === 'consent_required' || err?.type === 'interaction_required') {
              reject(new Error('Autentikasi memerlukan persetujuan. Buka Google Cloud Console > OAuth consent screen, pastikan sudah diatur ke External dan email kamu didaftarkan sebagai test user.'))
            } else {
              reject(new Error(msg))
            }
          }
        })
        client.requestAccessToken()
      })

      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) throw new Error('Gagal mengambil data pengguna')
      const userInfo: GoogleUserInfo = await res.json()
      return { ...userInfo, accessToken }
    } catch (err) {
      const msg = (err as Error).message || 'Gagal login dengan Google'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clientIdSource = import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'env' : localStorage.getItem(CLIENT_ID_KEY) ? 'storage' : 'none'

  const setClientId = useCallback((id: string) => {
    storeClientId(id)
  }, [])

  return {
    login,
    clientId,
    clientIdSource,
    setClientId,
    renderButton,
    initGis,
    loading,
    error,
    clearError: () => setError(null)
  }
}
