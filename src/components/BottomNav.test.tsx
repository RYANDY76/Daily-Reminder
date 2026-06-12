import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BottomNav from './BottomNav'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

vi.mock('../stores/useAppStore', () => ({
  useAppStore: (selector: any) => selector({
    currentPage: 'dashboard'
  })
}))

vi.mock('../stores/useProfileStore', () => ({
  useProfileStore: (selector: any) => selector({
    currentProfile: null
  })
}))

vi.mock('../i18n', () => ({
  useT: () => (key: string) => {
    const map: Record<string, string> = {
      'nav.today': 'Today',
      'nav.calendar': 'Calendar',
      'nav.focus': 'Focus',
      'nav.habits': 'Habits',
      'nav.more': 'More',
      'common.close': 'Close'
    }
    return map[key] ?? key
  }
}))

vi.mock('../router', () => ({
  PAGE_TO_ROUTE: {
    dashboard: '/',
    calendar: '/calendar',
    pomodoro: '/pomodoro',
    habits: '/habits',
    couple: '/couple',
    goals: '/goals',
    stats: '/stats',
    profile: '/profile',
    settings: '/settings'
  }
}))

describe('BottomNav', () => {
  it('renders main tab buttons', () => {
    render(<BottomNav />)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
    expect(screen.getByText('Focus')).toBeInTheDocument()
    expect(screen.getByText('Habits')).toBeInTheDocument()
  })

  it('renders more button', () => {
    render(<BottomNav />)
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('navigates when tab is clicked', () => {
    render(<BottomNav />)
    const calendarButton = screen.getByLabelText('Calendar')
    fireEvent.click(calendarButton)
    expect(mockNavigate).toHaveBeenCalledWith('/calendar')
  })

  it('shows more menu when more button clicked', () => {
    render(<BottomNav />)
    const moreButton = screen.getByLabelText('More')
    fireEvent.click(moreButton)
    expect(screen.getByText('nav.couple')).toBeInTheDocument()
    expect(screen.getByText('nav.goals')).toBeInTheDocument()
    expect(screen.getByText('nav.profile')).toBeInTheDocument()
    expect(screen.getByText('nav.settings')).toBeInTheDocument()
  })

  it('closes more menu when close button clicked', () => {
    render(<BottomNav />)
    const moreButton = screen.getByLabelText('More')
    fireEvent.click(moreButton)
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)
    expect(screen.queryByText('nav.couple')).not.toBeInTheDocument()
  })

  it('closes more menu when backdrop clicked', () => {
    render(<BottomNav />)
    const moreButton = screen.getByLabelText('More')
    fireEvent.click(moreButton)
    // Backdrop has aria-hidden="true"
    const backdrop = document.querySelector('[aria-hidden="true"]')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(screen.queryByText('nav.couple')).not.toBeInTheDocument()
    }
  })

  it('sets aria-current on active page tab', () => {
    render(<BottomNav />)
    // Dashboard (currentPage) should have aria-current
    const activeTab = screen.getByLabelText('Today')
    expect(activeTab.getAttribute('aria-current')).toBe('page')
  })
})
