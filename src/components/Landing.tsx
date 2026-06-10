import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { CheckCircle2, Timer, Target, BarChart3, Heart, ArrowRight, ClipboardList } from 'lucide-react'

const features = [
  { icon: CheckCircle2, color: 'text-primary-500', key: 'welcome.feature1' },
  { icon: Timer, color: 'text-orange-500', key: 'welcome.feature2' },
  { icon: Target, color: 'text-blue-500', key: 'welcome.feature3' },
  { icon: BarChart3, color: 'text-purple-500', key: 'welcome.feature4' },
]

export default function Landing() {
  const t = useT()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 px-6 pt-16 pb-20 text-white text-center">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm mb-5 shadow-lg">
            <ClipboardList className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">{t('app.name')}</h1>
          <p className="text-primary-100 text-base leading-relaxed">{t('landing.subtitle')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-600 font-semibold hover:bg-primary-50 transition-colors shadow-lg"
          >
            {t('landing.getStarted')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('landing.featuresTitle')}</h2>
        <div className="grid gap-3">
          {features.map(({ icon: Icon, color, key }) => (
            <div key={key} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-dark-card flex items-center justify-center">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t(key)}</p>
            </div>
          ))}
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-dark-card flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('landing.coupleFeature')}</p>
          </div>
        </div>

        <div className="card p-5 space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('landing.pwaTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('landing.pwaDesc')}</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
        >
          {t('landing.openApp')}
        </button>
      </div>
    </div>
  )
}
