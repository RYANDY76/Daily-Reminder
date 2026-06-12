import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Toast, { ToastContainer } from './Toast'

vi.mock('../i18n', () => ({
  useT: () => (key: string) => {
    const map: Record<string, string> = { 'common.close': 'Close' }
    return map[key] ?? key
  }
}))

describe('Toast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders message text', () => {
    render(<Toast message="Test notification" onClose={vi.fn()} />)
    expect(screen.getByText('Test notification')).toBeInTheDocument()
  })

  it('renders close button with aria-label', () => {
    render(<Toast message="Test" onClose={vi.fn()} />)
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<Toast message="Test" onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    act(() => { vi.advanceTimersByTime(300) })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders action button when provided', () => {
    render(<Toast message="Test" onClose={vi.fn()} action="Undo" onAction={vi.fn()} />)
    expect(screen.getByText('Undo')).toBeInTheDocument()
  })

  it('calls onAction when action button clicked', () => {
    const onAction = vi.fn()
    render(<Toast message="Test" onClose={vi.fn()} action="Undo" onAction={onAction} />)
    fireEvent.click(screen.getByText('Undo'))
    act(() => { vi.advanceTimersByTime(300) })
    expect(onAction).toHaveBeenCalled()
  })

  it('calls onClose after default duration (3s)', () => {
    const onClose = vi.fn()
    render(<Toast message="Test" onClose={onClose} />)
    act(() => { vi.advanceTimersByTime(3300) })
    expect(onClose).toHaveBeenCalled()
  })

  it('uses longer duration when action is present (6s)', () => {
    const onClose = vi.fn()
    render(<Toast message="Test" onClose={onClose} action="Undo" onAction={vi.fn()} />)
    act(() => { vi.advanceTimersByTime(3000) })
    // Should NOT have closed yet
    expect(onClose).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(3300) })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders all toast types without error', () => {
    const types = ['success', 'error', 'info', 'warning'] as const
    types.forEach(type => {
      const { unmount } = render(<Toast message={type} type={type} onClose={vi.fn()} />)
      expect(screen.getByText(type)).toBeInTheDocument()
      unmount()
    })
  })

  it('has role="alert" for accessibility', () => {
    render(<Toast message="Test" onClose={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

describe('ToastContainer', () => {
  it('renders multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'First', type: 'info' as const },
      { id: '2', message: 'Second', type: 'success' as const }
    ]
    render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('has aria-live="polite" for accessibility', () => {
    const { container } = render(<ToastContainer toasts={[]} onRemove={vi.fn()} />)
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })
})
