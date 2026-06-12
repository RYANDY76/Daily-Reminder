import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkeletonCard, SkeletonTask, SkeletonSession, DashboardSkeleton, CalendarSkeleton, StatsSkeleton, GoalsSkeleton, HabitsSkeleton } from './Skeleton'

describe('SkeletonCard', () => {
  it('renders without error', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('SkeletonTask', () => {
  it('renders without error', () => {
    const { container } = render(<SkeletonTask />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('SkeletonSession', () => {
  it('renders without error', () => {
    const { container } = render(<SkeletonSession />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('DashboardSkeleton', () => {
  it('renders without error', () => {
    const { container } = render(<DashboardSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('CalendarSkeleton', () => {
  it('renders without error', () => {
    const { container } = render(<CalendarSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('StatsSkeleton', () => {
  it('renders without error', () => {
    const { container } = render(<StatsSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('GoalsSkeleton', () => {
  it('renders without error', () => {
    const { container } = render(<GoalsSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('HabitsSkeleton', () => {
  it('renders without error', () => {
    const { container } = render(<HabitsSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
