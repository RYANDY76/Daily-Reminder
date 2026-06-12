import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHaptic } from './useHaptic'

describe('useHaptic', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      vibrate: vi.fn()
    })
  })

  it('returns trigger function', () => {
    const { trigger } = useHaptic()
    expect(typeof trigger).toBe('function')
  })

  it('calls navigator.vibrate with light pattern by default', () => {
    const { trigger } = useHaptic()
    trigger()
    expect(navigator.vibrate).toHaveBeenCalledWith(10)
  })

  it('calls navigator.vibrate with medium pattern', () => {
    const { trigger } = useHaptic()
    trigger('medium')
    expect(navigator.vibrate).toHaveBeenCalledWith(20)
  })

  it('calls navigator.vibrate with heavy pattern', () => {
    const { trigger } = useHaptic()
    trigger('heavy')
    expect(navigator.vibrate).toHaveBeenCalledWith(30)
  })

  it('calls navigator.vibrate with success pattern', () => {
    const { trigger } = useHaptic()
    trigger('success')
    expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10])
  })

  it('does not throw when vibrate is not available', () => {
    vi.stubGlobal('navigator', {})
    const { trigger } = useHaptic()
    expect(() => trigger()).not.toThrow()
  })
})
