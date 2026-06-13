import { useAppStore } from '../../stores/useAppStore'
import { useT } from '../../i18n'
import type { Lang } from '../../types'
import { applyAccentColor } from '../../utils/theme'
import ToggleSwitch from '../ToggleSwitch'

export default function DisplaySettings() {
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)
  const darkMode = useAppStore((s) => s.darkMode)
  const lang = useAppStore((s) => s.lang)
  const t = useT()

  const handleLangChange = (newLang: Lang) => {
    useAppStore.getState().setLang(newLang)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.darkMode')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.darkModeDesc')}</p>
        </div>
        <ToggleSwitch enabled={darkMode} onToggle={toggleDarkMode} ariaLabel={t('settings.toggleDark')} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-border">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.language')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.languageDesc')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleLangChange('id')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-tap ${
              lang === 'id'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
            }`}
          >
            ID
          </button>
          <button
            onClick={() => handleLangChange('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-tap ${
              lang === 'en'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-dark-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.accentColor')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.accentColorDesc')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { name: t('settings.colorHijau'), color: '#1D9E75' },
            { name: t('settings.colorBiru'), color: '#3B82F6' },
            { name: t('settings.colorUngu'), color: '#8B5CF6' },
            { name: t('settings.colorMerah'), color: '#EF4444' },
            { name: t('settings.colorKuning'), color: '#F59E0B' },
            { name: t('settings.colorPink'), color: '#EC4899' },
            { name: t('settings.colorCyan'), color: '#06B6D4' },
            { name: t('settings.colorOrange'), color: '#F97316' },
          ].map((theme) => (
            <button
              key={theme.name}
              onClick={() => {
                applyAccentColor(theme.color)
                localStorage.setItem('daily_reminder_accent', theme.color)
              }}
              className="flex flex-col items-center gap-1 min-h-tap"
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                style={{ backgroundColor: theme.color }}
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
