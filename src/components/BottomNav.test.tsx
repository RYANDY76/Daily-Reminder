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
      'nav.stats': 'Stats',
      'nav.profile': 'Profile',
      'nav.focus': 'Focus',
      'nav.habits': 'Habits',
      'nav.couple': 'Couple',
      'nav.goals': 'Goals',
      'nav.settings': 'Settings',
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

vi.mock('../types/accessibility', () => ({
  isFeatureHidden: () => false
}))

describe('BottomNav', () => {
  it('renders main tab buttons', () => {
    render(<BottomNav />)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
    expect(screen.getByText('Stats')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
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
    expect(screen.getByText('Focus')).toBeInTheDocument()
    expect(screen.getByText('Habits')).toBeInTheDocument()
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('closes more menu when close button clicked', () => {
    render(<BottomNav />)
    const moreButton = screen.getByLabelText('More')
    fireEvent.click(moreButton)
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)
    expect(screen.queryByText('Focus')).not.toBeInTheDocument()
  })

  it('closes more menu when backdrop clicked', () => {
    render(<BottomNav />)
    const moreButton = screen.getByLabelText('More')
    fireEvent.click(moreButton)
    const backdrop = document.querySelector('.fixed.inset-0.z-40')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(screen.queryByText('Focus')).not.toBeInTheDocument()
    }
  })

  it('sets aria-current on active page tab', () => {
    render(<BottomNav />)
    const activeTab = screen.getByLabelText('Today')
    expect(activeTab.getAttribute('aria-current')).toBe('page')
  })
})
