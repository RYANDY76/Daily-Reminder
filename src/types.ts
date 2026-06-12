export type Lang = 'id' | 'en'

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodLog {
  id: string
  profileId: string
  date: string
  mood: MoodLevel
  energy: MoodLevel
  note: string
  createdAt: number
}

export interface PomodoroSession {
  id: string
  profileId: string
  taskId: string | null
  taskTitle: string
  date: string
  startedAt: number
  duration: number // seconds
  type: 'work' | 'break'
  completed: boolean
}

export interface Goal {
  id: string
  profileId: string
  title: string
  description: string
  targetDate: string
  color: string
  icon: string
  done: boolean
  createdAt: number
  updatedAt: number
}

export type SessionType = 'pagi' | 'siang' | 'sore' | 'malam'

export type RecurringPattern = 'daily' | 'weekly' | null

export interface RecurringConfig {
  pattern: RecurringPattern
  daysOfWeek: number[]
}

export type TaskStatus = 'done' | 'missed' | 'pending'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface TimeTracking {
  startTime: number
  elapsed: number
  running: boolean
}

export interface Task {
  id: string
  profileId: string
  title: string
  time: string
  session: SessionType
  notes: string
  color: string
  done: boolean
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  dueDate: string
  subtasks: Subtask[]
  timeTracking: TimeTracking | null
  recurring: RecurringConfig | null
  isRecurring: boolean
  recurringId: string | null
  date: string
  sortOrder: number
  createdAt: number
  updatedAt: number
  snoozedUntil: number | null  // timestamp when snooze ends
  // Shared task fields
  isShared?: boolean
  sharedWith?: string // profileId
  assignedTo?: 'me' | 'partner' | 'both'
  sharedBy?: string // profileId
  sharedAt?: number
  completedBy?: string // profileId who completed it
  attachmentUrl?: string
  commentCount?: number
}

export interface Profile {
  id: string
  name: string
  avatar: string
  accentColor: string
  pin: string | null
  darkMode: 'system' | 'light' | 'dark'
  supabaseUserId: string | null
  biometricEnabled: boolean
  biometricCredentialId: string | null
  consentGiven: boolean
  createdAt: number
  lastSyncAt: number | null
}

export interface DailyHistory {
  id: string
  profileId: string
  date: string
  tasksDone: number
  tasksMissed: number
  tasksTotal: number
  completionPercentage: number
  dailyProductivityScore: number
}

export interface Habit {
  id: string
  profileId: string
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly'
  targetDays: number[]
  completedDates: string[]
  currentStreak: number
  bestStreak: number
  reminderTime?: string
  createdAt: number
}

export interface WeeklyStats {
  days: DailyHistory[]
  averageCompletion: number
  bestDay: string | null
  totalDone: number
  streak: number
}

export interface PublicHoliday {
  date: string
  name: string
  isNational?: boolean
}

export type Page = 'dashboard' | 'stats' | 'profile' | 'settings' | 'calendar' | 'pomodoro' | 'habits' | 'goals' | 'couple' | 'about'

export const SESSION_ORDER: SessionType[] = ['pagi', 'siang', 'sore', 'malam']

export const SESSION_LABELS: Record<SessionType, string> = {
  pagi: 'Pagi (00.00–11.59)',
  siang: 'Siang (12.00–14.59)',
  sore: 'Sore (15.00–17.59)',
  malam: 'Malam (18.00–23.59)'
}

export const SESSION_SHORT: Record<SessionType, string> = {
  pagi: 'Pagi',
  siang: 'Siang',
  sore: 'Sore',
  malam: 'Malam'
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi'
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#6B7280',
  medium: '#F59E0B',
  high: '#EF4444'
}

export const PRIORITY_BG: Record<TaskPriority, string> = {
  low: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  medium: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  high: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
}

export const TASK_COLORS = [
  '#1D9E75',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#14B8A6'
]

export const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  action?: string
  onAction?: () => void
}
