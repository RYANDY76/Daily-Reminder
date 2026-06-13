import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

// Component that throws
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>Content loaded</div>
}

vi.mock('../utils/errorHandler', () => ({
  AppErrorHandler: {
    logError: vi.fn()
  }
}))

vi.mock('../i18n', () => ({
  t: (key: string) => key
}))

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress React error boundary console.error
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('catches rendering errors and shows error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.queryByText('Content loaded')).not.toBeInTheDocument()
    // Should show error UI
    expect(screen.getByText('error.boundaryTitle')).toBeInTheDocument()
  })

  it('logs error to AppErrorHandler', async () => {
    const { AppErrorHandler } = await import('../utils/errorHandler')
    
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(AppErrorHandler.logError).toHaveBeenCalledWith(
      'COMPONENT_ERROR',
      'Test error',
      'critical',
      expect.any(Object)
    )
  })

  it('shows retry button and allows retry', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByText(/error\.retry/i)
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(screen.getByText('error.boundaryTitle')).toBeInTheDocument()
  })

  it('disables retry after max retries', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    
    // Click retry 3 times (max retries)
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.getByText(/Retry/i)
      fireEvent.click(retryButton)
    }
    
    expect(screen.getByText('error.maxRetries')).toBeInTheDocument()
  })
})
