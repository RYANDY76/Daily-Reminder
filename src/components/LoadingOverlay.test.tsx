import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LoadingOverlay from './LoadingOverlay'

describe('LoadingOverlay', () => {
  it('renders without error', () => {
    const { container } = render(<LoadingOverlay />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
