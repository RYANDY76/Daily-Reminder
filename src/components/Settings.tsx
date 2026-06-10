import { useProfileStore } from '../stores/useProfileStore'
import { useNavigate } from 'react-router-dom'
import { PAGE_TO_ROUTE } from '../router'
import { useT } from '../i18n'
import { User, ChevronRight } from 'lucide-react'

import DisplaySettings from './settings/DisplaySettings'
import NotificationSettings from './settings/NotificationSettings'
import ExportSettings from './settings/ExportSettings'
import BackupSettings from './settings/BackupSettings'
import GoogleSettings from './settings/GoogleSettings'
import SupabaseSettings from './SupabaseSettings'
import LegalSettings from './settings/LegalSettings'

export default function Settings() {
  const profile = useProfileStore((s) => s.currentProfile)
  const navigate = useNavigate()
  const t = useT()

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>

      <button
        onClick={() => navigate(PAGE_TO_ROUTE['profile'])}
        className="w-full card p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.manageProfile')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.name || t('settings.manageProfileDesc')}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      <DisplaySettings />
      <NotificationSettings />
      <GoogleSettings />
      <SupabaseSettings />
      <ExportSettings />
      <BackupSettings />
      <LegalSettings />
    </div>
  )
}
