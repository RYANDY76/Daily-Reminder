# Rotasi Kredensial

Kredensial berikut bocor di file ZIP dan harus segera di-rotate:

## 1. Google OAuth Client ID

1. Buka https://console.cloud.google.com/apis/credentials
2. Pilih project yang digunakan
3. Cari OAuth 2.0 Client ID yang bocor
4. Klik ikon pensil (edit)
5. Scroll ke bawah → **Delete** atau buat Client ID baru
6. Buat Client ID baru dengan Authorized JavaScript origins:
   - `http://localhost:5173` (dev)
   - `https://your-domain.vercel.app` (production)
7. Update `VITE_GOOGLE_CLIENT_ID` di `.env` dengan Client ID baru

## 2. Supabase Anon Key

1. Buka https://supabase.com/dashboard/projects
2. Pilih project Anda
3. Settings → API
4. Klik **Reveal** lalu **Regenerate** pada anon public key
5. Update `VITE_SUPABASE_ANON_KEY` di `.env`
6. Update `VITE_SUPABASE_URL` juga jika berubah

## 3. Setelah Rotasi

- Hapus file ZIP yang berisi kredensial lama
- Hapus riwayat git jika kredensial sempat ter-commit:
  ```bash
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch .env" \
    --prune-empty --tag-name-filter cat -- --all
  ```
- Regenerate `.env` dari `.env.example`
- Deploy ulang ke Vercel/Netlify dengan environment variable baru
