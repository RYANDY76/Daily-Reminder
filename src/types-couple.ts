/**
 * Couple-specific types
 */

import type { Task } from './types'

export interface CoupleConnection {
  id: string
  profile1Id: string
  profile2Id: string
  profile1Name: string
  profile2Name: string
  connectedAt: number
  status: 'pending' | 'active' | 'inactive'
  inviteCode?: string
  points: number
  level: number
}

export interface SharedTask extends Task {
  // SharedTask inherits all Task properties including assignedTo
}

export interface CoupleGoal {
  id: string
  coupleId: string
  title: string
  description?: string
  targetDate?: string
  progress: number // 0-100
  milestones: CoupleMilestone[]
  createdBy: string
  createdAt: number
  completedAt?: number
  completed: boolean
}

export interface CoupleMilestone {
  id: string
  title: string
  completed: boolean
  completedAt?: number
  completedBy?: string
}

export interface LoveNote {
  id: string
  coupleId: string
  fromProfileId: string
  toProfileId: string
  taskId?: string // optional: attached to a task
  message: string
  emoji?: string
  createdAt: number
  read: boolean
}

export interface ActivityFeedItem {
  id: string
  coupleId: string
  profileId: string
  profileName: string
  type: 'task_completed' | 'goal_achieved' | 'milestone_reached' | 'love_note_sent' | 'streak_achieved'
  title: string
  description?: string
  timestamp: number
  metadata?: any
}

export interface CoupleStats {
  coupleId: string
  period: 'today' | 'week' | 'month'
  profile1: {
    profileId: string
    name: string
    tasksCompleted: number
    pomodoroCompleted: number
    focusMinutes: number
    streak: number
  }
  profile2: {
    profileId: string
    name: string
    tasksCompleted: number
    pomodoroCompleted: number
    focusMinutes: number
    streak: number
  }
  combined: {
    totalTasksCompleted: number
    totalFocusMinutes: number
    sharedGoalsCompleted: number
    loveNotesSent: number
  }
}

export interface TaskComment {
  id: string
  coupleId: string
  taskId: string
  profileId: string
  profileName: string
  text: string
  createdAt: number
}
