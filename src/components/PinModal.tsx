import { useState, useRef, useEffect } from 'react'
import { verifyPin } from '../crypto'
import { useProfileStore } from '../stores/useProfileStore'
import { useBiometricAuth } from '../hooks/useBiometricAuth'
import { Lock, Clock, Fingerprint } from 'lucide-react'
import { useT } from '../i18n'
import { useFocusTrap } from '../hooks/useFocusTrap'
import PinRecoveryModal from './PinRecoveryModal'

const LOCKOUT_THRESHOLD_1 = 3
const LOCKOUT_DURATION_1 = 30_000
const LOCKOUT_THRESHOLD_2 = 6
const LOCKOUT_DURATION_2 = 300_000

export default function PinModal() {
  const t = useT()
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const unlockProfile = useProfileStore((s) => s.unlockProfile)
  const { authenticate, isAvailable, loading: bioLoading, error: bioError, clearError: clearBioError } = useBiometricAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [bioSupported, setBioSupported] = useState(false)
  const lockTimerRef = useRef<ReturnType<typeof setInterval>>()
  const trapRef = useFocusTrap(true)
  const bioTriedRef = useRef(false)

  useEffect(() => {
    isAvailable().then(setBioSupported)
  }, [isAvailable])

  useEffect(() => {
    return () => { if (lockTimerRef.current) clearInterval(lockTimerRef.current) }
  }, [])

  useEffect(() => {
    if (lockedUntil <= Date.now()) {
      if (lockTimerRef.current) clearInterval(lockTimerRef.current)
      setTimeLeft(0)
      return
    }
    lockTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, lockedUntil - Date.now())
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(lockTimerRef.current)
        setTimeLeft(0)
      }
    }, 1000)
    return () => { if (lockTimerRef.current) clearInterval(lockTimerRef.current) }
  }, [lockedUntil])

  // Auto-trigger biometric on mount if enabled
  useEffect(() => {
    if (!currentProfile?.biometricEnabled || !currentProfile?.biometricCredentialId || !bioSupported) return
    if (bioTriedRef.current) return
    bioTriedRef.current = true
    handleBiometric()
  }, [currentProfile?.biometricEnabled, currentProfile?.biometricCredentialId, bioSupported])

  if (!currentProfile?.pin) return null

  const isLocked = Date.now() < lockedUntil

  const handleBiometric = async () => {
    clearBioError()
    const ok = await authenticate(currentProfile.biometricCredentialId ?? undefined)
    if (ok) {
      setAttempts(0)
      unlockProfile()
    }
  }

  const handleSubmit = async (enteredPin?: string) => {
    if (isLocked) return
    const pinToCheck = enteredPin ?? pin
    if (pinToCheck.length !== 4) return
    const valid = await verifyPin(pinToCheck, currentProfile.pin!, currentProfile.id)
    if (valid) {
      setAttempts(0)
      unlockProfile()
      setPin('')
      setError('')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setError(t('pin.wrongPin'))
      setPin('')

      if (newAttempts >= LOCKOUT_THRESHOLD_2) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION_2)
        setError(t('pin.lockedLong'))
      } else if (newAttempts >= LOCKOUT_THRESHOLD_1) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION_1)
        setError(t('pin.lockedShort'))
      }
    }
  }

  return (
    <div ref={trapRef} role="alertdialog" aria-modal="true" aria-labelledby="pin-heading" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100 dark:border-dark-border animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-primary-500" />
        </div>
        <h2 id="pin-heading" className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {t('pin.welcomeBack', { name: currentProfile.name })}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          {t('pin.enterPin')}
        </p>

        <div className="flex justify-center gap-3 mb-6" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                pin.length > i
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
          ))}
        </div>

        {isLocked ? (
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">{t('pin.locked')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {Math.ceil(timeLeft / 1000)}s
            </p>
          </div>
        ) : (
          <>
            {currentProfile.biometricEnabled && bioSupported && (
              <div className="mb-4">
                <button
                  onClick={handleBiometric}
                  disabled={bioLoading}
                  className="w-full py-3 px-4 rounded-2xl border border-primary-200 dark:border-primary-800/30 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all duration-200 flex items-center justify-center gap-2 min-h-tap"
                >
                  <Fingerprint className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    {bioLoading ? 'Memproses...' : t('pin.biometricUnlock')}
                  </span>
                </button>
                {bioError && (
                  <p role="alert" className="text-xs text-red-500 text-center mt-2">{bioError}</p>
                )}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-dark-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-dark-surface px-2 text-xs text-gray-400">atau</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-center mb-6">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                autoComplete="one-time-code"
                value={pin}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setPin(digits)
                  if (digits.length === 4) {
                    setTimeout(() => handleSubmit(digits), 150)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                }}
                className="w-48 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                placeholder="• • • •"
                aria-label={t('pin.enterPin')}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm animate-fade-in" role="alert">
                {error}
              </p>
            )}

            {attempts > 0 && !isLocked && attempts < LOCKOUT_THRESHOLD_1 && (
              <p className="text-xs text-gray-400 mt-1">
                {t('pin.attemptsLeft', { count: LOCKOUT_THRESHOLD_1 - attempts })}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowRecovery(true)}
              className="mt-4 text-xs text-primary-500 hover:text-primary-600 font-medium"
            >
              {t('pin.forgotPin')}
            </button>
          </>
        )}
      </div>

      {showRecovery && (
        <PinRecoveryModal
          onClose={() => setShowRecovery(false)}
          onSuccess={() => setShowRecovery(false)}
        />
      )}
    </div>
  )
}
