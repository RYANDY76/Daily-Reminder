import { useCallback } from 'react'
import { useAppStore } from './stores/useAppStore'
import type { Lang } from './types'
import idTranslations from './translations/id'

let enTranslations: Record<string, string> = {}
let enReady = false
import('./translations/en').then(mod => {
  enTranslations = mod.default
  enReady = true
})

function lookup(key: string, lang: Lang, params?: Record<string, string | number>): string {
  if (lang === 'en' && !enReady && import.meta.env.DEV) {
    console.warn(`[i18n] EN not loaded yet, falling back to ID for "${key}"`)
  }
  const map = lang === 'en' ? enTranslations : idTranslations
  let text = map[key] ?? idTranslations[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.split(`{${k}}`).join(String(v))
    }
  }
  return text
}

export function t(key: string, params?: Record<string, string | number>): string {
  return lookup(key, useAppStore.getState().lang, params)
}

export function getLang(): Lang {
  return useAppStore.getState().lang
}

export function useT() {
  const lang = useAppStore((s) => s.lang)
  return useCallback((key: string, params?: Record<string, string | number>): string => {
    return lookup(key, lang, params)
  }, [lang])
}
