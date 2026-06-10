import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { PAGE_TO_ROUTE } from '../router'
import { X, ChevronRight } from 'lucide-react'

const ONBOARDING_KEY = 'daily_reminder_onboarding_done'

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

interface Step {
  titleKey: string
  descKey: string
  route?: string
}

const steps: Step[] = [
  { titleKey: 'onboarding.step1Title', descKey: 'onboarding.step1Desc' },
  { titleKey: 'onboarding.step2Title', descKey: 'onboarding.step2Desc', route: 'calendar' },
  { titleKey: 'onboarding.step3Title', descKey: 'onboarding.step3Desc', route: 'habits' },
  { titleKey: 'onboarding.step4Title', descKey: 'onboarding.step4Desc', route: 'settings' }
]

export default function OnboardingTour() {
  const t = useT()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(!isOnboardingComplete())

  if (!visible) return null

  const current = steps[step]
  const isLast = step === steps.length - 1

  const finish = () => {
    markOnboardingComplete()
    setVisible(false)
  }

  const next = () => {
    if (current.route) navigate(PAGE_TO_ROUTE[current.route])
    if (isLast) finish()
    else setStep(step + 1)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end md:items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-dark-border animate-slide-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-primary-500">
            {t('onboarding.progress', { current: step + 1, total: steps.length })}
          </span>
          <button onClick={finish} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card" aria-label={t('onboarding.skip')}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <h2 id="onboarding-title" className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {t(current.titleKey)}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t(current.descKey)}</p>

        <div className="flex gap-2">
          <button
            onClick={finish}
            className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 text-sm font-medium"
          >
            {t('onboarding.skip')}
          </button>
          <button
            onClick={next}
            className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex items-center justify-center gap-1"
          >
            {isLast ? t('onboarding.finish') : t('onboarding.next')}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
