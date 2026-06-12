import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InstallPrompt from './InstallPrompt'

vi.mock('../hooks/useInstallPrompt', () => ({
  useInstallPrompt: vi.fn()
}))

vi.mock('../i18n', () => ({
  useT: () => (key: string) => key === 'common.close' ? 'Close' : key
}))

import { useInstallPrompt } from '../hooks/useInstallPrompt'

describe('InstallPrompt', () => {
  it('returns null when not installable', () => {
    vi.mocked(useInstallPrompt).mockReturnValue({
      installPrompt: null,
      promptInstall: vi.fn(),
      isStandalone: false
    })
    const { container } = render(<InstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when already standalone', () => {
    vi.mocked(useInstallPrompt).mockReturnValue({
      installPrompt: {},
      promptInstall: vi.fn(),
      isStandalone: true
    })
    const { container } = render(<InstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when installable and not standalone', () => {
    vi.mocked(useInstallPrompt).mockReturnValue({
      installPrompt: {},
      promptInstall: vi.fn(),
      isStandalone: false
    })
    render(<InstallPrompt />)
    expect(screen.getByText('install.title')).toBeInTheDocument()
    expect(screen.getByText('install.desc')).toBeInTheDocument()
  })

  it('renders install button', () => {
    vi.mocked(useInstallPrompt).mockReturnValue({
      installPrompt: {},
      promptInstall: vi.fn(),
      isStandalone: false
    })
    render(<InstallPrompt />)
    expect(screen.getByText('install.button')).toBeInTheDocument()
  })

  it('dismisses on close button click', () => {
    vi.mocked(useInstallPrompt).mockReturnValue({
      installPrompt: {},
      promptInstall: vi.fn(),
      isStandalone: false
    })
    render(<InstallPrompt />)
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)
    expect(screen.queryByText('install.title')).not.toBeInTheDocument()
  })

  it('calls promptInstall on install button click', () => {
    const promptInstall = vi.fn()
    vi.mocked(useInstallPrompt).mockReturnValue({
      installPrompt: {},
      promptInstall,
      isStandalone: false
    })
    render(<InstallPrompt />)
    fireEvent.click(screen.getByText('install.button'))
    expect(promptInstall).toHaveBeenCalled()
  })
})
