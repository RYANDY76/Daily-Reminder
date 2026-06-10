import { generateVapidKeys } from 'web-push'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const keys = generateVapidKeys()

console.log('=== VAPID Keys Generated ===\n')
console.log('Add to .env:')
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log('\nAdd to Supabase Edge Function secrets:')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('VAPID_SUBJECT=mailto:your@email.com')
console.log('REMINDER_TIMEZONE=Asia/Jakarta')
console.log('CRON_SECRET=<random-secret-for-cron>')

const envPath = path.join(__dirname, '../.env.vapid.example')
fs.writeFileSync(envPath, `# Generated VAPID keys — copy to .env and Supabase secrets
VITE_VAPID_PUBLIC_KEY=${keys.publicKey}
VAPID_PUBLIC_KEY=${keys.publicKey}
VAPID_PRIVATE_KEY=${keys.privateKey}
VAPID_SUBJECT=mailto:admin@daily-reminder.app
REMINDER_TIMEZONE=Asia/Jakarta
`)
console.log(`\nSaved to ${envPath}`)
