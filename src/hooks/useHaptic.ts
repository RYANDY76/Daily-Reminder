/**
 * Haptic Feedback Hook
 * Provides native-like vibration feedback for touch interactions
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

const patterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [15, 50, 15, 50, 15],
  error: [20, 50, 20]
}

export function useHaptic() {
  const trigger = (type: HapticType = 'light') => {
    if (!('vibrate' in navigator)) return
    
    try {
      const pattern = patterns[type]
      navigator.vibrate(pattern)
    } catch (e) {
      // Silently fail if vibration not supported
    }
  }

  return { trigger }
}
