import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { Home } from 'lucide-react'

export default function NotFound() {
  const t = useT()
  const navigate = useNavigate()

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center mb-6">
        <span className="text-4xl font-bold text-gray-300 dark:text-gray-600">404</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('notFound.title')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
        {t('notFound.message')}
      </p>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors min-h-tap"
      >
        <Home className="w-4 h-4" />
        {t('notFound.backHome')}
      </button>
    </div>
  )
}
