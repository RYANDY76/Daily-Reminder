export const STORAGE_KEYS = {
  LANG: 'avora_lang',
  REMINDER_LEAD_MINUTES: 'avora_reminder_lead_minutes',
  CRYPTO_KEY_V2: 'avora_crypto_key_v2',
  ACCENT_COLOR: 'avora_accent',
  SENTRY_ENABLED: 'avora_sentry_enabled',
  GUEST_FLAG: 'avora_guest',
  OFFLINE_QUEUE: 'avora_offline_queue',
  ERROR_LOG: 'app_error_log',
  THEME: 'avora_theme',
  FONT_SIZE: 'avora_font_size'
} as const

const LEGACY_MAP: Record<string, string> = {
  daily_reminder_lang: STORAGE_KEYS.LANG,
  daily_reminder_reminder_lead_minutes: STORAGE_KEYS.REMINDER_LEAD_MINUTES,
  daily_reminder_crypto_key_v2: STORAGE_KEYS.CRYPTO_KEY_V2,
  daily_reminder_accent: STORAGE_KEYS.ACCENT_COLOR,
  daily_reminder_sentry_enabled: STORAGE_KEYS.SENTRY_ENABLED,
  daily_reminder_guest: STORAGE_KEYS.GUEST_FLAG,
  daily_reminder_offline_queue: STORAGE_KEYS.OFFLINE_QUEUE,
  daily_reminder_theme: STORAGE_KEYS.THEME,
  daily_reminder_onboarding_done: 'avora_onboarding_done',
  daily_reminder_notif_prefs: 'avora_notif_prefs',
  daily_reminder_holidays_cache: 'avora_holidays_cache',
  daily_reminder_google_client_id: 'avora_google_client_id',
  daily_reminder_last_profile: 'avora_last_profile',
  daily_reminder_font_size: STORAGE_KEYS.FONT_SIZE,
}

export function migrateStorageKeys(): void {
  const migrated = sessionStorage.getItem('avora_migrated')
  if (migrated === '1') return
  for (const [oldKey, newKey] of Object.entries(LEGACY_MAP)) {
    try {
      const val = localStorage.getItem(oldKey)
      if (val !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, val)
        localStorage.removeItem(oldKey)
      }
    } catch {}
  }
  try {
    const cryptoSession = sessionStorage.getItem('daily_reminder_crypto_key_v2')
    if (cryptoSession && !sessionStorage.getItem(STORAGE_KEYS.CRYPTO_KEY_V2)) {
      sessionStorage.setItem(STORAGE_KEYS.CRYPTO_KEY_V2, cryptoSession)
      sessionStorage.removeItem('daily_reminder_crypto_key_v2')
    }
  } catch {}
  sessionStorage.setItem('avora_migrated', '1')
}
