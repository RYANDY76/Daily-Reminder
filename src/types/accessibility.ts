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

export const MODE_CONFIG: Record<AppMode, { label: string; description: string; icon: string; accentColor: string; fontSize: 'small' | 'normal' | 'large' | 'xlarge'; bigButtons: boolean }> = {
  anak: { label: 'Anak', description: 'Tema ceria, reward warna-warni', icon: '🎨', accentColor: '#F59E0B', fontSize: 'large', bigButtons: true },
  pelajar: { label: 'Pelajar / Kerja', description: 'Fitur lengkap, produktivitas tinggi', icon: '📚', accentColor: '#55C8FF', fontSize: 'normal', bigButtons: false },
  mudah: { label: 'Mudah', description: 'Tombol besar, font besar', icon: '🌟', accentColor: '#1D9E75', fontSize: 'xlarge', bigButtons: true }
}

export const FONT_SIZE_CLASSES: Record<AccessibilitySettings['fontSize'], string> = {
  small: 'text-sm',
  normal: 'text-base',
  large: 'text-lg',
  xlarge: 'text-xl'
}
