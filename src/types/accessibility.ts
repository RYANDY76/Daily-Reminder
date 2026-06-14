export type AppMode = 'anak' | 'pelajar' | 'mudah'

export interface AccessibilitySettings {
  fontSize: 'small' | 'normal' | 'large' | 'xlarge'
  highContrast: boolean
  reducedMotion: boolean
  bigButtons: boolean
  appMode: AppMode
}

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  reducedMotion: false,
  bigButtons: false,
  appMode: 'pelajar'
}

export interface ModeConfig {
  label: string
  description: string
  icon: string
  accentColor: string
  fontSize: 'small' | 'normal' | 'large' | 'xlarge'
  bigButtons: boolean
  hiddenFeatures: string[]
  prompts: { title: string; body: string }
}

export const MODE_CONFIG: Record<AppMode, ModeConfig> = {
  anak: {
    label: 'Anak',
    description: 'Tema ceria, reward warna-warni',
    icon: '🎨',
    accentColor: '#F59E0B',
    fontSize: 'large',
    bigButtons: true,
    hiddenFeatures: ['pomodoro', 'goals', 'calendar', 'couple', 'settings_advanced', 'csv_import', 'cloud_sync', 'developer'],
    prompts: {
      title: 'Halo! Selamat Datang!',
      body: 'Ini aplikasi pengingat kamu! Setiap hari kamu bisa tulis kegiatan yang mau dilakukan — seperti mengerjakan PR, minum susu, atau latihan piano. Kalau sudah selesai, centang! Ayo kumpulkan streak sebanyak-banyaknya!'
    }
  },
  pelajar: {
    label: 'Pelajar / Kerja',
    description: 'Fitur lengkap, produktivitas tinggi',
    icon: '📚',
    accentColor: '#55C8FF',
    fontSize: 'normal',
    bigButtons: false,
    hiddenFeatures: [],
    prompts: {
      title: 'Hei! Siap Produktif?',
      body: 'Aplikasi ini adalah teman harian kamu. Kamu bisa catat tugas sekolah, lacak kebiasaan baik (olahraga, baca, belajar), dan atur waktu belajar pakai timer Pomodoro supaya lebih fokus. Tap tanda [+] untuk tambah tugas baru. Semangat!'
    }
  },
  mudah: {
    label: 'Mudah',
    description: 'Tombol besar, font besar',
    icon: '🌟',
    accentColor: '#1D9E75',
    fontSize: 'xlarge',
    bigButtons: true,
    hiddenFeatures: ['pomodoro', 'goals', 'habits', 'couple', 'stats', 'calendar', 'settings_advanced', 'csv_import', 'cloud_sync', 'developer'],
    prompts: {
      title: 'Selamat Datang',
      body: 'Aplikasi pengingat harian ini mudah digunakan. Tekan tombol besar [+] untuk menambah pengingat. Pilih waktu — Pagi, Siang, Sore, atau Malam. Tulis apa yang perlu diingat. Aktifkan notifikasi agar HP mengingatkan Anda.'
    }
  }
}

export function isFeatureHidden(feature: string): boolean {
  try {
    const raw = localStorage.getItem('avora_accessibility')
    if (!raw) return false
    const settings: AccessibilitySettings = JSON.parse(raw)
    const config = MODE_CONFIG[settings.appMode]
    return config.hiddenFeatures.includes(feature)
  } catch {
    return false
  }
}

export function getCurrentMode(): AppMode {
  try {
    const raw = localStorage.getItem('avora_accessibility')
    if (!raw) return 'pelajar'
    const settings: AccessibilitySettings = JSON.parse(raw)
    return settings.appMode || 'pelajar'
  } catch {
    return 'pelajar'
  }
}

export const FONT_SIZE_CLASSES: Record<AccessibilitySettings['fontSize'], string> = {
  small: 'text-sm',
  normal: 'text-base',
  large: 'text-lg',
  xlarge: 'text-xl'
}
