import { useState } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { CheckCircle2, Sparkles, ArrowRight, UserPlus, LogIn, Target, Timer, BarChart3, ShieldCheck } from 'lucide-react'
import GoogleSignInButton from './GoogleSignInButton'
import type { GoogleUserInfo } from '../hooks/useGoogleAuth'
import { useT } from '../i18n'

interface WelcomeProps {
  onComplete: () => void
}

const features = [
  { icon: CheckCircle2, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', key: 'welcome.feature1' },
  { icon: Timer,        color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/20',  key: 'welcome.feature2' },
  { icon: Target,       color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20',      key: 'welcome.feature3' },
  { icon: BarChart3,    color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/20',  key: 'welcome.feature4' },
]

export default function Welcome({ onComplete }: WelcomeProps) {
  const t = useT()
  const createProfile = useProfileStore((s) => s.createProfile)
  const createProfileFromGoogle = useProfileStore((s) => s.createProfileFromGoogle)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [googleError, setGoogleError] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) { setError(t('welcome.nameRequired')); return }
    setStep(2)
  }

  const handleFinalCreate = async () => {
    if (!consentGiven) { setError(t('welcome.consentRequired')); return }
    setError('')
    await createProfile(name.trim(), pin.length === 4 ? pin : null, true)
    onComplete()
  }

  const handleGoogleSuccess = async (userInfo: GoogleUserInfo) => {
    setGoogleError('')
    await createProfileFromGoogle(userInfo)
    onComplete()
  }

  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-dark-bg">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 px-6 pt-16 pb-12 text-white text-center">
          {/* decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-white/10" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm mb-5 animate-bounce-in shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              {t('app.name')}
            </h1>
            <p className="text-primary-100 text-base leading-relaxed max-w-xs mx-auto">
              {t('welcome.subtitle')}
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar">
          {features.map(({ icon: Icon, color, bg, key }) => (
            <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bg} flex-shrink-0`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className={`text-xs font-medium ${color}`}>{t(key)}</span>
            </div>
          ))}
        </div>

        {/* Auth options */}
        <div className="flex-1 px-6 pb-8 space-y-4">
          {/* Google login */}
          <div className="card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{t('welcome.login')}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('welcome.loginDesc')}</p>
              </div>
            </div>
            <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={(err) => setGoogleError(err)} />
            {googleError && <p className="text-red-500 text-xs mt-2 text-center">{googleError}</p>}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-dark-bg px-3 text-gray-400">{t('welcome.or')}</span>
            </div>
          </div>

          {/* Manual register */}
          <div className="card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{t('welcome.register')}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('welcome.registerDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 min-h-tap flex items-center justify-center gap-2 shadow-sm"
            >
              {t('welcome.createAccount')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-dark-bg">
        <div className="h-1 bg-gray-100 dark:bg-dark-card">
          <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: '33%' }} />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              {t('welcome.back')}
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 mb-5 shadow-lg animate-bounce-in">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('welcome.createAccount')}
              </h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {t('welcome.createAccountDesc')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.nameLabel')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder={t('profile.namePlaceholder')}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm"
                  autoFocus
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.pinLabel')}
                  <span className="ml-2 text-xs font-normal text-gray-400">{t('profile.pinOptional')}</span>
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="• • • •"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-center text-2xl tracking-[0.5em]"
                  maxLength={4}
                  inputMode="numeric"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                  {t('profile.pinHint')}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                  <span className="text-red-500 text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="w-full py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-semibold transition-all duration-200 min-h-tap shadow-sm flex items-center justify-center gap-2"
              >
                {name.trim()
                  ? t('welcome.hello', { name: name.trim().split(' ')[0] })
                  : t('welcome.create')
                }
                {name.trim() && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-dark-bg">
      <div className="h-1 bg-gray-100 dark:bg-dark-card">
        <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: '66%' }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            {t('welcome.back')}
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-900/20 mb-5 shadow-lg animate-bounce-in">
              <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('welcome.consentTitle')}
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {t('welcome.consentDesc')}
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('welcome.consentLabel')}
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                <span className="text-red-500 text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleFinalCreate}
              disabled={!consentGiven}
              className="w-full py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-semibold transition-all duration-200 min-h-tap shadow-sm flex items-center justify-center gap-2"
            >
              {t('welcome.create')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
