function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const SHADES: Record<number, number> = {
  50: 97, 100: 93, 200: 86, 300: 76, 400: 64,
  500: 50, 600: 42, 700: 33, 800: 24, 900: 14
}

export function applyAccentColor(hex: string) {
  const { h, s } = hexToHSL(hex)
  const root = document.documentElement
  for (const [shade, lightness] of Object.entries(SHADES)) {
    root.style.setProperty(`--color-primary-${shade}`, hslToHex(h, s, lightness))
  }
  root.style.setProperty('--tw-primary-50', `var(--color-primary-50)`)
  root.style.setProperty('--tw-primary-100', `var(--color-primary-100)`)
  root.style.setProperty('--tw-primary-200', `var(--color-primary-200)`)
  root.style.setProperty('--tw-primary-300', `var(--color-primary-300)`)
  root.style.setProperty('--tw-primary-400', `var(--color-primary-400)`)
  root.style.setProperty('--tw-primary-500', `var(--color-primary-500)`)
  root.style.setProperty('--tw-primary-600', `var(--color-primary-600)`)
  root.style.setProperty('--tw-primary-700', `var(--color-primary-700)`)
  root.style.setProperty('--tw-primary-800', `var(--color-primary-800)`)
  root.style.setProperty('--tw-primary-900', `var(--color-primary-900)`)
}

export function loadAccentColor() {
  const saved = localStorage.getItem('daily_reminder_accent')
  if (saved) applyAccentColor(saved)
}
