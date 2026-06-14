import { useState, useEffect, useMemo } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { getSupabase } from '../lib/supabase'
import { useT } from '../i18n'
import { Loader2, ArrowRight, Mail, Lock, AlertCircle, CheckCircle2, Timer, Target, BarChart3, UserPlus } from 'lucide-react'
import AvoraLogo from './AvoraLogo'

interface LoginPageProps {
  onComplete: () => void
  onGuest: () => void
}

function FloatingShape({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full opacity-20 animate-float ${className}`}
      style={{ animationDelay: `${delay}s`, animationDuration: '6s' }}
    />
  )
}

export default function LoginPage({ onComplete, onGuest: _onGuest }: LoginPageProps) {
  const t = useT()
  const createProfileFromGoogle = useProfileStore((s) => s.createProfileFromGoogle)
  const createProfileFromSupabase = useProfileStore((s) => s.createProfileFromSupabase)
  const { login, loading: googleLoading, error: googleError, clearError } = useGoogleAuth()

  const [step, setStep] = useState<'auth' | 'profile'>('auth')
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [googleProfileError, setGoogleProfileError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [profileError, setProfileError] = useState('')

  useEffect(() => { setMounted(true) }, [])

  const handleGoogleLogin = async () => {
    clearError()
    setGoogleProfileError(null)
    const userInfo = await login()
    if (!userInfo) return
    try {
      await createProfileFromGoogle(userInfo)
      onComplete()
    } catch (err) {
      setGoogleProfileError((err as Error).message)
    }
  }

  const features = useMemo(() => [
    { icon: CheckCircle2, text: t('login.feature1') },
    { icon: Timer, text: t('login.feature2') },
    { icon: Target, text: t('login.feature3') },
    { icon: BarChart3, text: t('login.feature4') },
  ], [t])

  const supabase = getSupabase()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setEmailError(t('login.supabaseNotConfigured'))
      return
    }
    if (!email || password.length < 6) {
      setEmailError(t('login.invalidEmail'))
      return
    }
    setEmailLoading(true)
    setEmailError(null)
    try {
      if (emailMode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }

      const session = await supabase.auth.getSession()
      const userId = session.data.session?.user?.id
      if (userId) {
        await createProfileFromSupabase(userId, email)
      }
      onComplete()
    } catch (err) {
      setEmailError((err as Error).message)
    } finally {
      setEmailLoading(false)
    }
  }

  const handleGuestProfile = async () => {
    if (!name.trim()) { setProfileError(t('welcome.nameRequired')); return }
    if (!consentGiven) { setProfileError(t('welcome.consentRequired')); return }
    setProfileError('')
    await useProfileStore.getState().createProfile(name.trim(), pin.length === 4 ? pin : null, true)
    onComplete()
  }

  const fadeClass = () =>
    `transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-dark-bg dark:via-dark-bg dark:to-[#0c0c1a] flex flex-col items-center justify-center overflow-hidden px-4 py-8">
      <FloatingShape className="w-72 h-72 bg-primary-400 -top-20 -left-20 blur-3xl" delay={0} />
      <FloatingShape className="w-96 h-96 bg-indigo-400 -bottom-32 -right-32 blur-3xl" delay={1.5} />
      <FloatingShape className="w-48 h-48 bg-purple-400 top-1/3 right-10 blur-3xl" delay={3} />
      <FloatingShape className="w-56 h-56 bg-emerald-400 bottom-1/4 left-10 blur-3xl" delay={0.8} />

      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo + Brand */}
        <div
          className={`text-center mb-8 ${fadeClass()}`}
          style={{ transitionDelay: '0ms' }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#55C8FF] via-[#8B5CF6] to-[#EC6BFF] shadow-lg shadow-purple-500/30 mb-4 ring-1 ring-white/20">
            <AvoraLogo className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Avora
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {t('login.subtitle')}, <br />{t('login.subtitle2')}
          </p>
        </div>

        {/* Feature pills */}
        <div
          className={`flex items-center justify-center gap-2 flex-wrap mb-6 ${fadeClass()}`}
          style={{ transitionDelay: '150ms' }}
        >
          {features.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm border border-gray-200/60 dark:border-dark-border/60 shadow-xs"
            >
              <Icon className="w-3 h-3 text-primary-600 dark:text-primary-400" />
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{text}</span>
            </div>
          ))}
        </div>

        {/* Auth card */}
        <div
          className={`${fadeClass()}`}
          style={{ transitionDelay: '300ms' }}
        >
          <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-dark-border/60 shadow-xl shadow-black/5 p-6 space-y-4">
            {step === 'auth' ? (
              <>
                {/* Google */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-surface transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xs"
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {googleLoading ? t('google.processing') : t('google.continue')}
                  </span>
                </button>

                {(googleError || googleProfileError) && (
                  <p className="text-xs text-red-500 text-center">{googleProfileError || googleError}</p>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-dark-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-dark-card px-3 text-xs text-gray-400">{t('welcome.or')}</span>
                  </div>
                </div>

                {showEmailForm ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    {emailError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>{emailError}</p>
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all text-sm"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all text-sm"
                        required
                        minLength={6}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 active:scale-[0.98] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                    >
                      {emailLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : emailMode === 'login' ? (
                        t('login.loginEmail')
                      ) : (
                        t('login.registerEmail')
                      )}
                    </button>

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {emailMode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                      <button
                        type="button"
                        onClick={() => { setEmailMode(emailMode === 'login' ? 'register' : 'login'); setEmailError(null) }}
                        className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                      >
                        {emailMode === 'login' ? t('auth.register') : t('auth.login')}
                      </button>
                    </p>

                    <button
                      type="button"
                      onClick={() => { setShowEmailForm(false); setEmailError(null) }}
                      className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {t('login.backOptions')}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowEmailForm(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-surface transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] shadow-xs"
                    >
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('auth.email')}
                      </span>
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-dark-border" />
                      </div>
                      <div className="relative flex justify-center">
                <span className="bg-white dark:bg-dark-card px-3 text-xs text-gray-400">{t('welcome.or')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep('profile')}
                      className="w-full py-2.5 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      {t('welcome.createAccount')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Step 2: Profile creation (for guest/local users) */
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Langkah 2 dari 2</p>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white mt-1">{t('welcome.createAccount')}</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('profile.nameLabel')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuestProfile()}
                    placeholder={t('profile.namePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all text-sm"
                    autoFocus
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('profile.pinLabel')}
                    <span className="ml-2 text-xs font-normal text-gray-400">{t('profile.pinOptional')}</span>
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all text-center text-2xl tracking-[0.5em]"
                    maxLength={4}
                    inputMode="numeric"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">{t('profile.pinHint')}</p>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-border cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{t('welcome.consentLabel')}</span>
                </label>

                {profileError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                    <span className="text-red-500 text-sm">{profileError}</span>
                  </div>
                )}

                <button
                  onClick={handleGuestProfile}
                  disabled={!name.trim() || !consentGiven}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {name.trim()
                    ? t('welcome.hello', { name: name.trim().split(' ')[0] })
                    : t('welcome.create')
                  }
                  {name.trim() && <ArrowRight className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setStep('auth')}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  ← Kembali
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p
          className={`text-[11px] text-gray-400 dark:text-gray-600 text-center mt-6 leading-relaxed ${fadeClass()}`}
          style={{ transitionDelay: '450ms' }}
        >
          {t('login.agreeText')}{' '}
          <span className="underline underline-offset-2 hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer">{t('login.terms')}</span>
          {t('login.and')}
          <span className="underline underline-offset-2 hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer">{t('login.privacy')}</span>
        </p>
      </div>
    </div>
  )
}
