import { useState, useEffect } from 'react'
import { Palette, Check } from 'lucide-react'
import { PRESET_THEMES, applyTheme, saveThemePreference, loadThemePreference, type Theme } from '../types/theme'
import { useT } from '../i18n'

export default function ThemeSelector() {
  const t = useT()
  const [selectedTheme, setSelectedTheme] = useState<string>(loadThemePreference())
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    const theme = PRESET_THEMES.find(t => t.id === selectedTheme)
    if (theme) {
      applyTheme(theme)
    }
  }, [selectedTheme])

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId)
    saveThemePreference(themeId)
    const theme = PRESET_THEMES.find(t => t.id === themeId)
    if (theme) {
      applyTheme(theme)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('settings.theme')}
          </h3>
        </div>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
        >
          {showPicker ? t('common.close') : t('common.change')}
        </button>
      </div>

      {showPicker && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                ${selectedTheme === theme.id
                  ? 'border-primary-500 shadow-lg scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:scale-102'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {theme.name}
                </span>
                {selectedTheme === theme.id && (
                  <Check className="w-5 h-5 text-primary-500" />
                )}
              </div>
              
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: theme.primary }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: theme.secondary }}
                  title="Secondary"
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: theme.accent }}
                  title="Accent"
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: theme.success }}
                  title="Success"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {!showPicker && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.currentTheme')}:
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {PRESET_THEMES.find(t => t.id === selectedTheme)?.name}
          </span>
        </div>
      )}
    </div>
  )
}
