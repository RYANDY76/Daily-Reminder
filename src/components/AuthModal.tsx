import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { z } from 'zod'
import { useAuthStore } from '../stores/useAuthStore'
import { X, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useT } from '../i18n'

const authSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
})

interface AuthModalProps {
  onClose: () => void
  onSuccess?: () => void
  defaultMode?: 'login' | 'register'
}

export default function AuthModal({ onClose, onSuccess, defaultMode = 'login' }: AuthModalProps) {
  const t = useT()
  const session = useAuthStore(s => s.session)
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = getSupabase()

  useEffect(() => {
    if (!session) return
    onSuccess?.()
    onClose()
  }, [session, onSuccess, onClose])

  if (session) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    try {
      setError(null)
      authSchema.parse({ email, password })
      
      setLoading(true)
      
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        
        // Supabase might require email confirmation, but for now we assume success
        // or auto-login if email confirmation is disabled
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError(t('auth.registerSuccess'))
          setLoading(false)
          return
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
      
      onSuccess?.()
      onClose()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message)
      } else {
        setError((err as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? t('auth.loginToCloud') : t('auth.createAccount')}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card focus:bg-white dark:focus:bg-dark-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card focus:bg-white dark:focus:bg-dark-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? t('auth.login') : t('auth.register'))}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
              className="text-primary-500 font-semibold hover:underline"
            >
              {mode === 'login' ? t('auth.registerNow') : t('auth.loginHere')}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
