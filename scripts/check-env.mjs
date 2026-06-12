const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_VAPID_PUBLIC_KEY'
]

const OPTIONAL_VARS = [
  'VITE_VAPID_PUBLIC_KEY',
  'VITE_SENTRY_DSN'
]

const missing = REQUIRED_VARS.filter(
  (key) => !OPTIONAL_VARS.includes(key) && !process.env[key]
)

if (missing.length > 0) {
  console.warn(
    `\n  \x1b[33m⚠  Missing environment variables:\x1b[0m\n` +
    missing.map((key) => `    \x1b[33m→ ${key}\x1b[0m`).join('\n') +
    `\n  \x1b[90m  Copy .env.example to .env and fill in the values.\x1b[0m\n`
  )
}

const configured = REQUIRED_VARS.filter((key) => process.env[key])
if (configured.length > 0) {
  console.log(
    `  \x1b[32m✓\x1b[0m ${configured.length}/${REQUIRED_VARS.length} env vars configured\n`
  )
}
