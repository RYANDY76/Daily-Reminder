import { describe, it, expect, beforeEach } from 'vitest'

const STORAGE_KEY = 'daily_reminder_auto_cloud_sync'

function isEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

function setEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
}

describe('autoCloudSync preference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('tracks auto sync preference in localStorage', () => {
    expect(isEnabled()).toBe(false)
    setEnabled(true)
    expect(isEnabled()).toBe(true)
    setEnabled(false)
    expect(isEnabled()).toBe(false)
  })
})
