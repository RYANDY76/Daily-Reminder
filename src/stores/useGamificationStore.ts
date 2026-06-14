import { create } from 'zustand'
import type { GamificationProfile, Badge } from '../types/gamification'
import { BADGE_DEFINITIONS, calculateLevel, XP_REWARDS } from '../types/gamification'
import { useProfileStore } from './useProfileStore'
import { useAppStore } from './useAppStore'
import { showConfetti } from '../utils/confetti'

const STORAGE_KEY = 'daily_reminder_gamification'

function loadGamification(): Record<string, GamificationProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveGamification(data: Record<string, GamificationProfile>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcStreak(_profileId: string, history: Record<string, number>): number {
  let streak = 0
  const today = getTodayStr()
  const yesterday = getYesterdayStr()
  let current = history[today] !== undefined ? today : (history[yesterday] !== undefined ? yesterday : null)
  if (!current) return 0
  const d = new Date(current + 'T00:00:00')
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (history[key] !== undefined && history[key] >= 80) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

function checkBadges(_profileId: string, gamification: GamificationProfile, allHistory: Record<string, number>): Badge[] {
  const newBadges: Badge[] = []
  for (const def of BADGE_DEFINITIONS) {
    const existing = gamification.badges.find(b => b.id === def.id)
    if (existing?.unlockedAt) continue
    let met = false
    switch (def.requirement.type) {
      case 'tasks_completed':
        met = gamification.xp >= (def.requirement.count * XP_REWARDS.TASK_COMPLETED * 0.8)
        break
      case 'streak_days':
        met = gamification.streak >= def.requirement.count
        break
      case 'level_reached':
        met = gamification.level >= def.requirement.level
        break
      case 'xp_earned':
        met = gamification.xp >= def.requirement.amount
        break
      case 'perfect_day': {
        const perfectDays = Object.values(allHistory).filter(v => v === 100).length
        met = perfectDays >= def.requirement.count
        break
      }
    }
    if (met) {
      const unlocked: Badge = { ...def, unlockedAt: Date.now() }
      newBadges.push(unlocked)
    }
  }
  return newBadges
}

interface GamificationState {
  gamifications: Record<string, GamificationProfile>
  currentGamification: GamificationProfile | null
  loadGamification: () => void
  addXP: (amount: number, reason?: string) => void
  recordDay: (completionPercentage: number) => void
  getStats: () => { xp: number; level: number; streak: number; bestStreak: number; badges: Badge[]; totalBadges: number; unlockedBadges: number; xpProgress: number; nextLevelXP: number }
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  gamifications: {},
  currentGamification: null,

  loadGamification: () => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile) { set({ currentGamification: null }); return }
    const all = loadGamification()
    if (!all[profile.id]) {
      all[profile.id] = {
        xp: 0,
        level: 1,
        streak: 0,
        bestStreak: 0,
        badges: [],
        lastActiveDate: ''
      }
      saveGamification(all)
    }
    set({ gamifications: all, currentGamification: all[profile.id] })
  },

  addXP: (amount, reason) => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile) return
    const all = loadGamification()
    const g = all[profile.id]
    if (!g) return
    g.xp = Math.max(0, g.xp + amount)
    g.level = calculateLevel(g.xp)
    all[profile.id] = g
    saveGamification(all)
    set({ gamifications: all, currentGamification: g })
    if (amount > 0 && reason) {
      useAppStore.getState().addToast({
        id: crypto.randomUUID(),
        message: `+${amount} XP — ${reason}`,
        type: 'success',
        duration: 2000
      })
    }
    const newBadges = checkBadges(profile.id, g, {})
    if (newBadges.length > 0) {
      g.badges = [...g.badges.filter(b => !newBadges.find(nb => nb.id === b.id)), ...newBadges]
      all[profile.id] = g
      saveGamification(all)
      set({ gamifications: all, currentGamification: g })
      for (const b of newBadges) {
        useAppStore.getState().addToast({
          id: crypto.randomUUID(),
          message: `${b.icon} Badge: ${b.name}!`,
          type: 'success',
          duration: 4000
        })
        showConfetti(40)
      }
    }
  },

  recordDay: (completionPercentage) => {
    const profile = useProfileStore.getState().currentProfile
    if (!profile) return
    const all = loadGamification()
    const g = all[profile.id]
    if (!g) return
    const today = getTodayStr()
    g.lastActiveDate = today
    if (completionPercentage === 100) {
      g.xp += XP_REWARDS.PERFECT_DAY
    }
    g.streak = calcStreak(profile.id, { [today]: completionPercentage })
    g.bestStreak = Math.max(g.bestStreak, g.streak)
    g.level = calculateLevel(g.xp)
    all[profile.id] = g
    saveGamification(all)
    set({ gamifications: all, currentGamification: g })
  },

  getStats: () => {
    const g = get().currentGamification
    if (!g) return { xp: 0, level: 1, streak: 0, bestStreak: 0, badges: [], totalBadges: BADGE_DEFINITIONS.length, unlockedBadges: 0, xpProgress: 0, nextLevelXP: 100 }
    const totalBadges = BADGE_DEFINITIONS.length
    const unlockedBadges = g.badges.filter(b => b.unlockedAt).length
    const currentThreshold = (() => {
      let lvl = 1
      const thresholds = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000, 14000, 19000, 25000, 32000, 40000, 50000, 65000, 80000]
      for (let i = 1; i < thresholds.length; i++) {
        if (g.xp >= thresholds[i]) lvl = i + 1
        else break
      }
      const prev = thresholds[lvl - 1] || 0
      const next = thresholds[lvl] || thresholds[thresholds.length - 1]
      return { prev, next, lvl }
    })()
    const xpProgress = currentThreshold.next > currentThreshold.prev
      ? Math.round(((g.xp - currentThreshold.prev) / (currentThreshold.next - currentThreshold.prev)) * 100)
      : 100
    return {
      xp: g.xp,
      level: g.level,
      streak: g.streak,
      bestStreak: g.bestStreak,
      badges: g.badges,
      totalBadges,
      unlockedBadges,
      xpProgress: Math.min(100, xpProgress),
      nextLevelXP: currentThreshold.next
    }
  }
}))
