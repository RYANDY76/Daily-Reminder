import { useState } from 'react'
import { verifyPin } from '../crypto'
import { useProfileStore } from '../stores/useProfileStore'
import { Lock } from 'lucide-react'
import { useT } from '../i18n'
import PinRecoveryModal from './PinRecoveryModal'

export default function PinModal() {
  const t = useT()
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const unlockProfile = useProfileStore((s) => s.unlockProfile)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)

  if (!currentProfile?.pin) return null

  const handleSubmit = async (enteredPin?: string) => {
    const pinToCheck = enteredPin ?? pin
    if (pinToCheck.length !== 4) return
    const valid = await verifyPin(pinToCheck, currentProfile.pin!)
    if (valid) {
      unlockProfile()
      setPin('')
      setError('')
    } else {
      setError(t('pin.wrongPin'))
      setPin('')
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

        <button
          type="button"
          onClick={() => setShowRecovery(true)}
          className="mt-4 text-xs text-primary-500 hover:text-primary-600 font-medium"
        >
          {t('pin.forgotPin')}
        </button>
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
