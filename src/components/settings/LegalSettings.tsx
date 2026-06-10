import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../../i18n'
import { PAGE_TO_ROUTE } from '../../router'
import { ExternalLink } from 'lucide-react'
import { PrivacyPolicy, TermsOfService } from '../Legal'

export default function LegalSettings() {
  const t = useT()
  const navigate = useNavigate()
  const [legalPage, setLegalPage] = useState<'privacy' | 'terms' | null>(null)

  return (
    <>
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.legal')}</h3>
        </div>
        <div className="p-4 space-y-2">
          <button
            onClick={() => setLegalPage('privacy')}
            className="w-full flex items-center justify-between py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors"
          >
            <span>{t('settings.privacyPolicy')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLegalPage('terms')}
            className="w-full flex items-center justify-between py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors"
          >
            <span>{t('settings.termsOfService')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate(PAGE_TO_ROUTE.about)}
            className="w-full flex items-center justify-between py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors"
          >
            <span>{t('settings.about')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500 pb-4 mt-6">
        {t('settings.footer')}
      </p>

      {legalPage === 'privacy' && (
        <div className="fixed inset-0 z-50">
          <PrivacyPolicy onBack={() => setLegalPage(null)} />
        </div>
      )}
      {legalPage === 'terms' && (
        <div className="fixed inset-0 z-50">
          <TermsOfService onBack={() => setLegalPage(null)} />
        </div>
      )}
    </>
  )
}
