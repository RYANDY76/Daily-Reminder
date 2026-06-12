import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Task } from '../types'

vi.mock('../dates', () => ({
  getTodayDate: vi.fn().mockReturnValue('2026-06-12')
}))

vi.mock('../database', () => ({
  getPomodoroSessionsRange: vi.fn().mockResolvedValue([]),
  getLastNDaysHistory: vi.fn().mockResolvedValue([])
}))

describe('smartSchedule', () => {
  let analyzeProductivityPatterns: any, generateDailyPlan: any, suggestOptimalTime: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./smartSchedule')
    analyzeProductivityPatterns = mod.analyzeProductivityPatterns
    generateDailyPlan = mod.generateDailyPlan
    suggestOptimalTime = mod.suggestOptimalTime
  })

  describe('analyzeProductivityPatterns', () => {
    it('returns default pattern when no history exists', async () => {
      const pattern = await analyzeProductivityPatterns('test-profile')
      expect(pattern.averageFocusMinutes).toBe(25)
      expect(pattern.hourScores).toHaveLength(24)
      expect(pattern.peakHour).toBe(9)
      expect(pattern.sessionScores).toHaveProperty('pagi')
      expect(pattern.sessionScores).toHaveProperty('siang')
      expect(pattern.sessionScores).toHaveProperty('sore')
      expect(pattern.sessionScores).toHaveProperty('malam')
    })
  })

  describe('generateDailyPlan', () => {
    it('returns empty plan when no pending tasks', async () => {
      const plan = await generateDailyPlan([], 'test-profile')
      expect(plan.scheduledTasks).toHaveLength(0)
      expect(plan.totalEstimatedMinutes).toBe(0)
      expect(plan.confidence).toBe('high')
    })

    it('schedules pending tasks', async () => {
      const tasks: Task[] = [
        { id: '1', profileId: 'p1', title: 'Task A', session: 'pagi', time: '09:00', done: false, snoozedUntil: null, priority: 'high', date: '2026-06-12', createdAt: Date.now(), subtasks: [] },
        { id: '2', profileId: 'p1', title: 'Task B', session: 'siang', time: '13:00', done: false, snoozedUntil: null, priority: 'medium', date: '2026-06-12', createdAt: Date.now(), subtasks: [] },
      ]
      const plan = await generateDailyPlan(tasks, 'test-profile')
      expect(plan.scheduledTasks).toHaveLength(2)
      expect(plan.date).toBe('2026-06-12')
      expect(plan.scheduledTasks[0]).toHaveProperty('suggestedTime')
      expect(plan.scheduledTasks[0]).toHaveProperty('suggestedSession')
    })

    it('respects done and snoozed filters', async () => {
      const tasks: Task[] = [
        { id: '1', profileId: 'p1', title: 'Done', session: 'pagi', time: '09:00', done: true, snoozedUntil: null, priority: 'low', date: '2026-06-12', createdAt: Date.now(), subtasks: [] },
        { id: '2', profileId: 'p1', title: 'Snoozed', session: 'pagi', time: '10:00', done: false, snoozedUntil: '2026-06-13T00:00:00Z', priority: 'low', date: '2026-06-12', createdAt: Date.now(), subtasks: [] },
      ]
      const plan = await generateDailyPlan(tasks, 'test-profile')
      expect(plan.scheduledTasks).toHaveLength(0)
    })
  })

  describe('suggestOptimalTime', () => {
    it('returns a suggestion', async () => {
      const result = await suggestOptimalTime('high', [], 'test-profile')
      expect(result).toHaveProperty('suggestedTime')
      expect(result).toHaveProperty('suggestedSession')
      expect(result).toHaveProperty('reason')
    })
  })
})
