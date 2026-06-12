import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../dates', () => ({
  formatDate: vi.fn(() => '2026-06-12'),
  getTimeDisplay: vi.fn(() => '09:00'),
  getLast7Days: vi.fn(() => ['2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09', '2026-06-08', '2026-06-07', '2026-06-06']),
}))

vi.mock('../i18n', () => ({
  t: vi.fn((key: string) => key),
}))

describe('pdfExport', () => {
  it('exports generatePDF function', async () => {
    const { generatePDF } = await import('./pdfExport')
    expect(generatePDF).toBeDefined()
    expect(typeof generatePDF).toBe('function')
  })

  it('handles empty tasks gracefully', async () => {
    const { generatePDF } = await import('./pdfExport')
    const profile = {
      id: 'p1', name: 'Test', avatar: '', accentColor: '#000',
      pin: null, darkMode: 'system' as const,
      supabaseUserId: null, biometricEnabled: false,
      biometricCredentialId: null, consentGiven: true,
      createdAt: Date.now(), lastSyncAt: null
    }
    await expect(generatePDF(profile, [], [], {
      scope: 'today', orientation: 'portrait', theme: 'standard'
    })).resolves.toBeUndefined()
  })
})
