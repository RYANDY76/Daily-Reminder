import { useState } from 'react'
import { X, Mail, Lock, KeyRound } from 'lucide-react'
import { useT } from '../i18n'
import { useProfileStore } from '../stores/useProfileStore'
import { getSupabase } from '../lib/supabase'
import { hashPin } from '../crypto'
import { z } from 'zod'

interface PinRecoveryModalProps {
  onClose: () => void
  onSuccess: () => void
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  newPin: z.string().length(4)
})

export default function PinRecoveryModal({ onClose, onSuccess }: PinRecoveryModalProps) {
  const t = useT()
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const unlockProfile = useProfileStore((s) => s.unlockProfile)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const sb = getSupabase()
    if (!sb) {
      setError(t('pin.recoveryNoCloud'))
      return
    }

    try {
      schema.parse({ email, password, newPin })
      setLoading(true)

      const { error: signInError } = await sb.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      const pinHash = await hashPin(newPin)
      await updateProfile({ pin: pinHash })
      unlockProfile()
      onSuccess()
      onClose()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message)
      } else {
        setError((err as Error).message || t('pin.recoveryFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 dark:border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t('pin.recoveryTitle')}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card" aria-label={t('common.close')}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('pin.recoveryDesc')}</p>

        <form onSubmit={handleReset} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm"
              required
            />
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder={t('pin.newPin')}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-center tracking-[0.5em] font-mono"
            required
          />

          {error && <p className="text-xs text-red-500" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={loading || newPin.length !== 4}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? t('common.loading') : t('pin.resetPin')}
          </button>
        </form>
      </div>
    </div>
  )
}
