export interface GamificationProfile {
  xp: number
  level: number
  streak: number
  bestStreak: number
  badges: Badge[]
  lastActiveDate: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  unlockedAt: number | null
  requirement: BadgeRequirement
}

export type BadgeRequirement = 
  | { type: 'tasks_completed'; count: number }
  | { type: 'streak_days'; count: number }
  | { type: 'level_reached'; level: number }
  | { type: 'pomodoro_completed'; count: number }
  | { type: 'habits_completed'; count: number }
  | { type: 'goals_achieved'; count: number }
  | { type: 'perfect_day'; count: number }
  | { type: 'xp_earned'; amount: number }

export const XP_REWARDS = {
  TASK_COMPLETED: 10,
  TASK_UNDONE: -5,
  HABIT_COMPLETED: 15,
  POMODORO_COMPLETED: 20,
  GOAL_ACHIEVED: 50,
  PERFECT_DAY: 100,
  STREAK_MILESTONE: 25,
} as const

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000,
  7000, 10000, 14000, 19000, 25000, 32000, 40000, 50000, 65000, 80000
]

export const BADGE_DEFINITIONS: Omit<Badge, 'unlockedAt'>[] = [
  { id: 'first_task', name: 'First Step', description: 'Complete your first task', icon: '🎯', color: '#1D9E75', requirement: { type: 'tasks_completed', count: 1 } },
  { id: 'task_10', name: 'Getting Started', description: 'Complete 10 tasks', icon: '🔥', color: '#F59E0B', requirement: { type: 'tasks_completed', count: 10 } },
  { id: 'task_50', name: 'Task Master', description: 'Complete 50 tasks', icon: '⚡', color: '#8B5CF6', requirement: { type: 'tasks_completed', count: 50 } },
  { id: 'task_100', name: 'Century Club', description: 'Complete 100 tasks', icon: '💎', color: '#55C8FF', requirement: { type: 'tasks_completed', count: 100 } },
  { id: 'task_500', name: 'Legendary', description: 'Complete 500 tasks', icon: '👑', color: '#EC6BFF', requirement: { type: 'tasks_completed', count: 500 } },
  { id: 'streak_3', name: 'Consistent', description: '3-day streak', icon: '📅', color: '#10B981', requirement: { type: 'streak_days', count: 3 } },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🗓️', color: '#3B82F6', requirement: { type: 'streak_days', count: 7 } },
  { id: 'streak_30', name: 'Monthly Master', description: '30-day streak', icon: '🏆', color: '#F59E0B', requirement: { type: 'streak_days', count: 30 } },
  { id: 'streak_100', name: 'Unstoppable', description: '100-day streak', icon: '🚀', color: '#EF4444', requirement: { type: 'streak_days', count: 100 } },
  { id: 'level_5', name: 'Rising Star', description: 'Reach Level 5', icon: '⭐', color: '#F59E0B', requirement: { type: 'level_reached', level: 5 } },
  { id: 'level_10', name: 'Expert', description: 'Reach Level 10', icon: '🌟', color: '#8B5CF6', requirement: { type: 'level_reached', level: 10 } },
  { id: 'pomo_10', name: 'Focused', description: 'Complete 10 Pomodoros', icon: '🍅', color: '#EF4444', requirement: { type: 'pomodoro_completed', count: 10 } },
  { id: 'pomo_100', name: 'Deep Worker', description: 'Complete 100 Pomodoros', icon: '🧠', color: '#8B5CF6', requirement: { type: 'pomodoro_completed', count: 100 } },
  { id: 'habit_7', name: 'Habit Builder', description: 'Complete habits 7 times', icon: '✅', color: '#10B981', requirement: { type: 'habits_completed', count: 7 } },
  { id: 'goal_1', name: 'Goalgetter', description: 'Achieve your first goal', icon: '🎯', color: '#3B82F6', requirement: { type: 'goals_achieved', count: 1 } },
  { id: 'perfect_1', name: 'Perfectionist', description: 'Complete all tasks in a day', icon: '💯', color: '#EC6BFF', requirement: { type: 'perfect_day', count: 1 } },
  { id: 'perfect_7', name: 'Perfect Week', description: '7 perfect days', icon: '🌈', color: '#55C8FF', requirement: { type: 'perfect_day', count: 7 } },
  { id: 'xp_1000', name: 'XP Hunter', description: 'Earn 1000 XP', icon: '🎮', color: '#10B981', requirement: { type: 'xp_earned', amount: 1000 } },
  { id: 'xp_5000', name: 'XP Legend', description: 'Earn 5000 XP', icon: '🏅', color: '#F59E0B', requirement: { type: 'xp_earned', amount: 5000 } },
]

export function calculateLevel(xp: number): number {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  return level
}

export function xpForNextLevel(xp: number): number {
  const level = calculateLevel(xp)
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return LEVEL_THRESHOLDS[level]
}

export function xpProgress(xp: number): number {
  const current = calculateLevel(xp)
  if (current >= LEVEL_THRESHOLDS.length) return 100
  const prev = LEVEL_THRESHOLDS[current - 1] || 0
  const next = LEVEL_THRESHOLDS[current]
  return Math.round(((xp - prev) / (next - prev)) * 100)
}
