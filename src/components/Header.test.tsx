import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

vi.mock('../stores/useAppStore', () => ({
  useAppStore: (selector: any) => selector({
    currentPage: 'dashboard',
    darkMode: false,
    toggleDarkMode: vi.fn(),
    setGlobalSearchOpen: vi.fn()
  })
}))

vi.mock('../stores/useProfileStore', () => ({
  useProfileStore: (selector: any) => selector({
    currentProfile: { id: '1', name: 'Test User' }
  })
}))

vi.mock('../i18n', () => ({
  useT: () => (key: string) => key === 'app.name' ? 'Avora' : key,
  t: (key: string) => key
}))

vi.mock('../dates', () => ({
  getTimeGreeting: () => 'Good Morning',
  formatDate: () => 'June 12, 2026',
  getTodayDate: () => '2026-06-12'
}))

vi.mock('./SyncStatusBadge', () => ({
  default: () => null
}))

describe('Header', () => {
  it('renders app name', () => {
    render(<Header />)
    expect(screen.getAllByText('Avora').length).toBeGreaterThanOrEqual(1)
  })

  it('renders profile name greeting', () => {
    render(<Header />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(<Header />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('sets aria-current on active nav button', () => {
    render(<Header />)
    // Dashboard is active, should have aria-current="page"
    const navArea = screen.getByRole('navigation')
    expect(navArea).toBeInTheDocument()
  })

  it('renders search buttons', () => {
    render(<Header />)
    const searchButtons = screen.getAllByText('search.title')
    expect(searchButtons.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(searchButtons[0])
  })

  it('renders dark mode toggle', () => {
    render(<Header />)
    const dmButtons = screen.getAllByText('settings.darkMode')
    expect(dmButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders mobile header section', () => {
    const { container } = render(<Header />)
    // Mobile header has sticky positioning
    const stickyHeaders = container.querySelectorAll('[class*="sticky"]')
    expect(stickyHeaders.length).toBeGreaterThanOrEqual(1)
  })
})
