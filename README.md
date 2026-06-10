# Daily Reminder

Aplikasi pengingat harian berbasis web (PWA) untuk mengatur jadwal, kebiasaan, pomodoro, goals, dan mode couple.

## Fitur

- Dashboard tugas harian dengan sesi pagi/siang/sore/malam
- Kalender (tampilan bulan & minggu) + integrasi Google Calendar
- Pomodoro timer, habit tracker, goals, statistik
- Mode Couple (goals, love notes, activity feed) via Supabase
- Backup/restore JSON, cloud sync Supabase
- Notifikasi tugas & kebiasaan (PWA + service worker + Web Push opsional)
- Google Calendar dua arah (create/update/delete/import)
- Cloud sync otomatis dengan status indicator
- Reset PIN via akun Supabase
- Onboarding tour untuk pengguna baru
- Pencarian global dengan filter (Ctrl+K)
- Import tugas dari CSV
- Kalender agenda + sync Google berkala
- Multi-profil, PIN, dark mode, i18n (ID/EN)

## Persyaratan

- Node.js 18+
- npm

## Setup Lokal

```bash
npm install
cp .env.example .env
# Isi VITE_GOOGLE_CLIENT_ID, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (opsional)
npm run generate-icons
npm run dev
```

Buka http://localhost:5173

## Environment Variables

| Variabel | Deskripsi |
|----------|-----------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (Sign-In & Calendar) |
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key untuk Web Push (opsional) |

## Supabase Schema

Jalankan **`supabase-schema.sql`** di SQL Editor Supabase (satu file lengkap dengan RLS).

> Catatan: folder `supabase/migrations/` berisi migrasi couple sync lama. Untuk setup baru, gunakan `supabase-schema.sql`.

```bash
npm run supabase:login
npm run supabase:link
npm run supabase:push
```

## Scripts

| Command | Fungsi |
|---------|--------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run lint` | ESLint |
| `npm run generate-icons` | Generate PWA icons |
| `npm run generate-vapid` | Generate VAPID keys untuk Web Push |

## Web Push (Edge Functions)

1. Generate VAPID keys: `npm run generate-vapid`
2. Salin `VITE_VAPID_PUBLIC_KEY` ke `.env`
3. Set secrets di Supabase:
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@email.com REMINDER_TIMEZONE=Asia/Jakarta
   ```
4. Deploy functions:
   ```bash
   npm run supabase:deploy-push
   npm run supabase:deploy-reminders
   ```
5. Jadwalkan `check-reminders` di Supabase Dashboard → Edge Functions → Cron (setiap menit), dengan header `Authorization: Bearer <CRON_SECRET>` jika `CRON_SECRET` diset.

Push server-side membutuhkan **cloud sync** aktif (data tugas/kebiasaan di Supabase).

## E2E Tests

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

## Deploy

### Vercel / Netlify / Static host

```bash
npm run build
```

Deploy folder `dist/`. File `vercel.json` sudah disertakan untuk SPA routing.

## Struktur

```
src/
  components/     # UI React
  stores/         # Zustand state
  services/       # Cloud sync, auto sync
  hooks/          # Custom hooks
  utils/          # Helpers
public/
  icons/          # PWA icons (generated)
  sw-notifications.js
```

## Lisensi

Private project.
