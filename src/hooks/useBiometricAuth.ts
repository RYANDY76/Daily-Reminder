import { useState, useCallback } from 'react'

const RP_NAME = 'Avora'

function generateChallenge(): ArrayBuffer {
  const challenge = new Uint8Array(32)
  crypto.getRandomValues(challenge)
  return challenge.buffer as ArrayBuffer
}

function base64urlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return Uint8Array.from(atob(base64 + padding), (c) => c.charCodeAt(0))
}

export function useBiometricAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAvailable = useCallback(async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      if (import.meta.env.DEV) console.warn('[Biometric] availability check failed')
      return false
    }
  }, [])

  const register = useCallback(async (profileId: string): Promise<string | null> => {
    if (!window.PublicKeyCredential) {
      setError('Biometric tidak didukung di browser ini')
      return null
    }
    setLoading(true)
    setError(null)
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: generateChallenge(),
          rp: { name: RP_NAME },
          user: {
            id: new TextEncoder().encode(profileId),
            name: profileId,
            displayName: 'Avora'
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred'
          },
          timeout: 60000
        }
      }) as PublicKeyCredential | null

      if (!credential) {
        setError('Pendaftaran biometric dibatalkan')
        return null
      }
      return credential.id
    } catch (err) {
      const msg = (err as Error).message || 'Gagal mendaftarkan biometric'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const authenticate = useCallback(async (credentialId?: string): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
      setError('Biometric tidak didukung di browser ini')
      return false
    }
    setLoading(true)
    setError(null)
    try {
      const allowCredentials = credentialId
        ? [{ id: base64urlToBytes(credentialId).buffer as ArrayBuffer, type: 'public-key' as const }]
        : undefined

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: generateChallenge(),
          allowCredentials,
          userVerification: 'required',
          timeout: 60000
        }
      }) as PublicKeyCredential | null

      if (!assertion) {
        setError('Verifikasi biometric dibatalkan')
        return false
      }
      return true
    } catch (err) {
      const msg = (err as Error).message || 'Verifikasi biometric gagal'
      setError(msg)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { register, authenticate, isAvailable, loading, error, clearError: () => setError(null) }
}
