import { useState, useEffect } from 'react'
import { DEFAULT_ACCESSIBILITY, MODE_CONFIG, type AccessibilitySettings, type AppMode } from '../types/accessibility'
import ToggleSwitch from './ToggleSwitch'
import { Eye, Type, Palette } from 'lucide-react'

const STORAGE_KEY = 'avora_accessibility'

function loadSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(raw) } : DEFAULT_ACCESSIBILITY
  } catch { return DEFAULT_ACCESSIBILITY }
}

function saveSettings(s: AccessibilitySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  applyAccessibility(s)
}

export function applyAccessibility(s: AccessibilitySettings) {
  const root = document.documentElement
  root.style.removeProperty('--font-size-offset')
  switch (s.fontSize) {
    case 'small': root.style.setProperty('--font-size-offset', '0'); break
    case 'normal': root.style.setProperty('--font-size-offset', '0.125rem'); break
    case 'large': root.style.setProperty('--font-size-offset', '0.25rem'); break
    case 'xlarge': root.style.setProperty('--font-size-offset', '0.5rem'); break
  }
  if (s.highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }
  if (s.bigButtons) {
    root.classList.add('big-buttons')
  } else {
    root.classList.remove('big-buttons')
  }
  if (s.reducedMotion) {
    root.classList.add('reduced-motion')
  } else {
    root.classList.remove('reduced-motion')
  }
  // Mode-specific classes
  root.classList.remove('mode-anak', 'mode-mudah')
  if (s.appMode === 'anak') root.classList.add('mode-anak')
  if (s.appMode === 'mudah') root.classList.add('mode-mudah')
}

export function initAccessibility() {
  const s = loadSettings()
  applyAccessibility(s)
  return s
}

export function getAccessibilitySettings(): AccessibilitySettings {
  return loadSettings()
}

export default function AccessibilitySettingsPanel() {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings)

  useEffect(() => { applyAccessibility(settings) }, [settings])

  const update = (partial: Partial<AccessibilitySettings>) => {
    const next = { ...settings, ...partial }
    setSettings(next)
    saveSettings(next)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          Mode Pengguna
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MODE_CONFIG) as AppMode[]).map(mode => {
            const config = MODE_CONFIG[mode]
            const active = settings.appMode === mode
            return (
              <button
                key={mode}
                onClick={() => {
                  const cfg = MODE_CONFIG[mode]
                  update({ appMode: mode, fontSize: cfg.fontSize, bigButtons: cfg.bigButtons })
                }}
                className={`p-3 rounded-xl text-center transition-all border-2 ${
                  active
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card'
                }`}
              >
                <span className="text-xl block mb-1">{config.icon}</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white block">{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-dark-border pt-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" />
          Ukuran Teks
        </p>
        <div className="flex gap-2">
          {(['small', 'normal', 'large', 'xlarge'] as const).map(size => (
            <button
              key={size}
              onClick={() => update({ fontSize: size })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                settings.fontSize === size
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-400'
              }`}
            >
              {size === 'small' ? 'Kecil' : size === 'normal' ? 'Normal' : size === 'large' ? 'Besar' : 'Sangat Besar'}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-dark-border pt-4 space-y-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Aksesibilitas
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Kontras Tinggi</p>
            <p className="text-[11px] text-gray-400">Teks lebih tajam, warna lebih pekat</p>
          </div>
          <ToggleSwitch enabled={settings.highContrast} onToggle={() => update({ highContrast: !settings.highContrast })} ariaLabel="High contrast" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Tombol Besar</p>
            <p className="text-[11px] text-gray-400">Area sentuh lebih besar</p>
          </div>
          <ToggleSwitch enabled={settings.bigButtons} onToggle={() => update({ bigButtons: !settings.bigButtons })} ariaLabel="Big buttons" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Kurangi Animasi</p>
            <p className="text-[11px] text-gray-400">Nonaktifkan transisi & animasi</p>
          </div>
          <ToggleSwitch enabled={settings.reducedMotion} onToggle={() => update({ reducedMotion: !settings.reducedMotion })} ariaLabel="Reduced motion" />
        </div>
      </div>
    </div>
  )
}
