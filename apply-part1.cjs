const fs = require('fs');
const path = require('path');

const root = __dirname;
function w(file, content) {
  const fp = path.join(root, file);
  fs.writeFileSync(fp, content, 'utf8');
  console.log(`  [OK] ${file}`);
}
function r(file, old, rep) {
  const fp = path.join(root, file);
  let c = fs.readFileSync(fp, 'utf8');
  if (!c.includes(old)) { console.log(`  [SKIP] ${file} - pattern not found`); return; }
  c = c.split(old).join(rep);
  fs.writeFileSync(fp, c, 'utf8');
  console.log(`  [OK] ${file}`);
}

console.log('=== Part 1: Foundation ===\n');

// 1. constants.ts (FULL REWRITE)
w('src/constants.ts', `export const STORAGE_KEYS = {
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
`);

// 2. index.html (targeted fix)
r('index.html', "localStorage.getItem('daily_reminder_lang')", "localStorage.getItem('avora_lang')");

// 3. main.tsx (add migration import + sentry fix)
r('src/main.tsx', "import './index.css'", "import './index.css'\nimport { migrateStorageKeys, STORAGE_KEYS } from './constants'\n\nmigrateStorageKeys()");
r('src/main.tsx', "localStorage.getItem('daily_reminder_sentry_enabled')", "localStorage.getItem(STORAGE_KEYS.SENTRY_ENABLED)");

// 4. tailwind.config.js (remove shadow variants)
r('tailwind.config.js',
  `boxShadow: {
        soft: '0 1px 3px 0 rgba(0,0,0,0.03), 0 1px 2px -1px rgba(0,0,0,0.03)',
        card: '0 2px 8px 0 rgba(0,0,0,0.05), 0 1px 3px -1px rgba(0,0,0,0.03)',
        elevated: '0 4px 16px -2px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.04)',
        modal: '0 20px 60px -8px rgba(0,0,0,0.15), 0 4px 16px -4px rgba(0,0,0,0.08)',
      },`,
  `boxShadow: {
        modal: '0 20px 60px -8px rgba(0,0,0,0.15), 0 4px 16px -4px rgba(0,0,0,0.08)',
      },`);

// 5. Storage key fixes across 10 files
console.log('\n=== Storage Key Fixes ===\n');

r('src/crypto.ts', "sessionStorage.getItem('daily_reminder_crypto_key_v2')", "sessionStorage.getItem(STORAGE_KEYS.CRYPTO_KEY_V2)");
r('src/crypto.ts', "localStorage.getItem('daily_reminder_crypto_key_v2')", "localStorage.getItem(STORAGE_KEYS.CRYPTO_KEY_V2)");
r('src/crypto.ts', "sessionStorage.setItem('daily_reminder_crypto_key_v2'", "sessionStorage.setItem(STORAGE_KEYS.CRYPTO_KEY_V2");
{
  const fp = path.join(root, 'src/crypto.ts');
  let c = fs.readFileSync(fp, 'utf8');
  if (!c.includes("import { STORAGE_KEYS }")) {
    c = "import { STORAGE_KEYS } from './constants'\n\n" + c;
    fs.writeFileSync(fp, c, 'utf8');
    console.log('  [OK] crypto.ts (added import)');
  }
}

r('src/components/OnboardingTour.tsx', "'daily_reminder_onboarding_done'", "'avora_onboarding_done'");
r('src/components/ErrorBoundary.tsx', "localStorage.getItem('daily_reminder_lang')", "localStorage.getItem('avora_lang')");
r('src/components/ProfileManager.tsx', "localStorage.removeItem('daily_reminder_guest')", "localStorage.removeItem('avora_guest')");
r('src/components/ProfileManager.tsx', "localStorage.removeItem('daily_reminder_last_profile')", "localStorage.removeItem('avora_last_profile')");
r('src/types/theme.ts', "localStorage.setItem('daily_reminder_theme'", "localStorage.setItem('avora_theme'");
r('src/types/theme.ts', "localStorage.getItem('daily_reminder_theme')", "localStorage.getItem('avora_theme')");
r('src/hooks/useNotifications.ts', "'daily_reminder_notif_prefs'", "'avora_notif_prefs'");
r('src/hooks/useGoogleAuth.ts', "'daily_reminder_google_client_id'", "'avora_google_client_id'");
r('src/hooks/useHolidays.ts', "'daily_reminder_holidays_cache'", "'avora_holidays_cache'");
r('src/components/Settings.tsx', "localStorage.getItem('daily_reminder_sentry_enabled')", "localStorage.getItem('avora_sentry_enabled')");
r('src/components/Settings.tsx', "localStorage.setItem('daily_reminder_sentry_enabled'", "localStorage.setItem('avora_sentry_enabled'");
r('src/components/settings/DisplaySettings.tsx', "localStorage.setItem('daily_reminder_accent'", "localStorage.setItem('avora_accent'");

// 6. Contrast fixes
console.log('\n=== Contrast & Accessibility ===\n');

r('src/components/dashboard/StatCards.tsx', 'text-xs text-gray-400 dark:text-gray-500', 'text-xs text-gray-500 dark:text-gray-500');
r('src/components/dashboard/DashboardHeader.tsx', 'text-xs font-normal text-gray-400 dark:text-gray-500 tabular-nums', 'text-xs font-normal text-gray-500 dark:text-gray-500 tabular-nums');
r('src/components/dashboard/SearchBar.tsx', 'w-4 h-4 text-gray-400', 'w-4 h-4 text-gray-500 dark:text-gray-400');
r('src/components/HabitTracker.tsx', 'text-[10px] text-gray-500 dark:text-gray-400', 'text-[11px] text-gray-500 dark:text-gray-500');
r('src/components/WeeklyReview.tsx', 'text-[10px] text-gray-400', 'text-[11px] text-gray-500 dark:text-gray-500');
r('src/components/WeeklyReview.tsx', 'text-[8px] text-gray-400', 'text-[11px] text-gray-500 dark:text-gray-500');
r('src/components/Goals.tsx', 'text-xs text-gray-500 dark:text-gray-400', 'text-xs text-gray-500 dark:text-gray-500');

// 7. BottomNav label fix
r('src/components/BottomNav.tsx', 'text-[10px] font-medium leading-none mt-0.5', 'text-xs font-semibold leading-none mt-0.5');

// 8. PageHero.tsx (NEW FILE)
w('src/components/PageHero.tsx', `import type { ReactNode } from 'react'

interface PageHeroProps {
  icon: ReactNode
  title: string
  subtitle?: string
  gradient?: string
  children?: ReactNode
}

export default function PageHero({ icon, title, subtitle, gradient = 'from-primary-500 to-primary-600', children }: PageHeroProps) {
  return (
    <div className="page-hero">
      <div className={\`page-hero-gradient bg-gradient-to-br \${gradient}\`} />
      <div className="page-hero-content">
        <div className="page-hero-icon bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm">
          {icon}
        </div>
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}
`);

console.log('\n=== Done! ===');
console.log('Next: create apply-part2.js for CSS + remaining changes');
console.log('Then run: npm run build');
