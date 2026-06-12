import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SyncStatusBadge from './SyncStatusBadge'

const mockSyncStore = (overrides = {}) => {
  const state = {
    status: 'idle',
    lastSyncedAt: null,
    lastError: null,
    reset: vi.fn(),
    ...overrides
  }
  return { useSyncStore: (selector: any) => selector(state) }
}

vi.mock('../stores/useSyncStore', () => ({
  useSyncStore: vi.fn()
}))

vi.mock('../services/autoCloudSync', () => ({
  isAutoCloudSyncEnabled: vi.fn()
}))

vi.mock('../stores/useProfileStore', () => ({
  useProfileStore: (selector: any) => selector({ currentProfile: null })
}))

vi.mock('../i18n', () => ({
  useT: () => (key: string) => key,
  t: (key: string) => key
}))

import { useSyncStore } from '../stores/useSyncStore'
import { isAutoCloudSyncEnabled } from '../services/autoCloudSync'

describe('SyncStatusBadge', () => {
  beforeEach(() => {
    vi.mocked(isAutoCloudSyncEnabled).mockReturnValue(true)
  })

  it('renders with status role when visible', () => {
    vi.mocked(useSyncStore).mockImplementation(
      mockSyncStore({ status: 'syncing' }).useSyncStore
    )
    render(<SyncStatusBadge />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders syncing state', () => {
    vi.mocked(useSyncStore).mockImplementation(
      mockSyncStore({ status: 'syncing' }).useSyncStore
    )
    render(<SyncStatusBadge />)
    expect(screen.getByText('sync.syncing')).toBeInTheDocument()
  })

  it('renders error state', () => {
    vi.mocked(useSyncStore).mockImplementation(
      mockSyncStore({ status: 'error', lastError: 'Connection failed' }).useSyncStore
    )
    render(<SyncStatusBadge />)
    expect(screen.getByText('sync.failed')).toBeInTheDocument()
  })

  it('renders success state', () => {
    vi.mocked(useSyncStore).mockImplementation(
      mockSyncStore({ status: 'success' }).useSyncStore
    )
    render(<SyncStatusBadge />)
    expect(screen.getByText('sync.done')).toBeInTheDocument()
  })

  it('returns null when auto-sync off, no lastSync, and idle', () => {
    vi.mocked(isAutoCloudSyncEnabled).mockReturnValue(false)
    vi.mocked(useSyncStore).mockImplementation(
      mockSyncStore({ status: 'idle', lastSyncedAt: null }).useSyncStore
    )
    const { container } = render(<SyncStatusBadge />)
    expect(container.innerHTML).toBe('')
  })

  it('renders lastSync time when not syncing', () => {
    vi.mocked(useSyncStore).mockImplementation(
      mockSyncStore({ status: 'idle', lastSyncedAt: new Date().toISOString() }).useSyncStore
    )
    render(<SyncStatusBadge />)
    expect(screen.getByText(/sync\.lastSync/)).toBeInTheDocument()
  })
})
