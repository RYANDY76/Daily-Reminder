export interface Theme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  backgroundDark: string
  surface: string
  surfaceDark: string
  text: string
  textDark: string
  success: string
  warning: string
  error: string
  info: string
}

export const PRESET_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Ocean Blue',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#ffffff',
    backgroundDark: '#0f172a',
    surface: '#f8fafc',
    surfaceDark: '#1e293b',
    text: '#1e293b',
    textDark: '#f1f5f9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#fbbf24',
    background: '#ffffff',
    backgroundDark: '#1c1917',
    surface: '#fafaf9',
    surfaceDark: '#292524',
    text: '#1c1917',
    textDark: '#fafaf9',
    success: '#84cc16',
    warning: '#eab308',
    error: '#dc2626',
    info: '#0ea5e9'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primary: '#16a34a',
    secondary: '#22c55e',
    accent: '#14b8a6',
    background: '#ffffff',
    backgroundDark: '#0a0f0a',
    surface: '#f7fef7',
    surfaceDark: '#1a2e1a',
    text: '#14532d',
    textDark: '#f0fdf4',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#38bdf8'
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    primary: '#a855f7',
    secondary: '#c084fc',
    accent: '#e879f9',
    background: '#ffffff',
    backgroundDark: '#1e1b2e',
    surface: '#faf5ff',
    surfaceDark: '#2d2640',
    text: '#581c87',
    textDark: '#faf5ff',
    success: '#86efac',
    warning: '#fcd34d',
    error: '#fb7185',
    info: '#60a5fa'
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    primary: '#f43f5e',
    secondary: '#fb7185',
    accent: '#ec4899',
    background: '#ffffff',
    backgroundDark: '#2d1520',
    surface: '#fff1f2',
    surfaceDark: '#3d1f29',
    text: '#881337',
    textDark: '#ffe4e6',
    success: '#4ade80',
    warning: '#fb923c',
    error: '#dc2626',
    info: '#38bdf8'
  }
]

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  
  // Apply CSS variables
  root.style.setProperty('--color-primary', theme.primary)
  root.style.setProperty('--color-secondary', theme.secondary)
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-success', theme.success)
  root.style.setProperty('--color-warning', theme.warning)
  root.style.setProperty('--color-error', theme.error)
  root.style.setProperty('--color-info', theme.info)
  
  // Update Tailwind classes dynamically
  const isDark = document.documentElement.classList.contains('dark')
  if (isDark) {
    root.style.setProperty('--color-background', theme.backgroundDark)
    root.style.setProperty('--color-surface', theme.surfaceDark)
    root.style.setProperty('--color-text', theme.textDark)
  } else {
    root.style.setProperty('--color-background', theme.background)
    root.style.setProperty('--color-surface', theme.surface)
    root.style.setProperty('--color-text', theme.text)
  }
}

export function getThemeById(id: string): Theme | undefined {
  return PRESET_THEMES.find(t => t.id === id)
}

export function saveThemePreference(themeId: string): void {
  localStorage.setItem('daily_reminder_theme', themeId)
}

export function loadThemePreference(): string {
  return localStorage.getItem('daily_reminder_theme') || 'default'
}
