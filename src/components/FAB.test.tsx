import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FAB from './FAB'

vi.mock('../hooks/useHaptic', () => ({
  useHaptic: () => ({ trigger: vi.fn() })
}))

describe('FAB', () => {
  it('renders a button', () => {
    render(<FAB onClick={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<FAB onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('renders label text when provided', () => {
    render(<FAB onClick={vi.fn()} label="Add Task" />)
    expect(screen.getByText('Add Task')).toBeInTheDocument()
  })

  it('sets aria-label from label prop', () => {
    render(<FAB onClick={vi.fn()} label="Add Task" />)
    expect(screen.getByLabelText('Add Task')).toBeInTheDocument()
  })

  it('renders default plus icon when no icon provided', () => {
    const { container } = render(<FAB onClick={vi.fn()} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders custom icon when provided', () => {
    const { container } = render(<FAB onClick={vi.fn()} icon={<span data-testid="custom-icon">*</span>} />)
    expect(container.querySelector('[data-testid="custom-icon"]')).toBeInTheDocument()
  })
})
