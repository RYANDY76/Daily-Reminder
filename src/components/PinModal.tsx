import { useState, useRef, useEffect } from 'react'
import { verifyPin } from '../crypto'
import { useProfileStore } from '../stores/useProfileStore'
import { Lock, Clock } from 'lucide-react'
import { useT } from '../i18n'
import PinRecoveryModal from './PinRecoveryModal'

const LOCKOUT_THRESHOLD_1 = 3
const LOCKOUT_DURATION_1 = 30_000
const LOCKOUT_THRESHOLD_2 = 6
const LOCKOUT_DURATION_2 = 300_000

export default function PinModal() {
  const t = useT()
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const unlockProfile = useProfileStore((s) => s.unlockProfile)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const lockTimerRef = useRef<ReturnType<typeof setInterval>>()

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

  if (!currentProfile?.pin) return null

  const isLocked = Date.now() < lockedUntil

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100 dark:border-dark-border animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-primary-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {t('pin.welcomeBack', { name: currentProfile.name })}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          {t('pin.enterPin')}
        </p>

        <div className="flex justify-center gap-3 mb-6">
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
            <div className="grid grid-cols-3 gap-3 max-w-[200px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (pin.length < 4) {
                      const newPin = pin + num
                      setPin(newPin)
                      if (newPin.length === 4) {
                        setTimeout(() => handleSubmit(newPin), 150)
                      }
                    }
                  }}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-card text-gray-900 dark:text-white text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 min-h-tap min-w-tap"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => {
                  if (pin.length < 4) {
                    const newPin = pin + '0'
                    setPin(newPin)
                    if (newPin.length === 4) {
                      setTimeout(() => handleSubmit(newPin), 150)
                    }
                  }
                }}
                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-card text-gray-900 dark:text-white text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 min-h-tap min-w-tap"
              >
                0
              </button>
              <button
                onClick={() => setPin(pin.slice(0, -1))}
                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-card text-gray-900 dark:text-white text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 min-h-tap min-w-tap flex items-center justify-center"
                aria-label={t('pin.deleteDigit')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              </button>
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
