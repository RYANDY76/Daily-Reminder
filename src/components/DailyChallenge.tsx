import { useState } from 'react'
import { useGamificationStore } from '../stores/useGamificationStore'
import { Zap, Check } from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string
  xpReward: number
  check: () => boolean
}

const CHALLENGES: Challenge[] = [
  { id: 'complete_3', title: 'Selesaikan 3 Tugas', description: 'Centang 3 tugas hari ini', xpReward: 30, check: () => {
    const tasks = JSON.parse(localStorage.getItem('daily_reminder_tasks') || '[]')
    return tasks.filter((t: any) => t.done && t.date === new Date().toISOString().split('T')[0]).length >= 3
  }},
  { id: 'morning_routine', title: 'Rutinitas Pagi', description: 'Selesaikan semua tugas pagi sebelum jam 12', xpReward: 25, check: () => {
    const tasks = JSON.parse(localStorage.getItem('daily_reminder_tasks') || '[]')
    const pagi = tasks.filter((t: any) => t.session === 'pagi' && t.date === new Date().toISOString().split('T')[0])
    return pagi.length > 0 && pagi.every((t: any) => t.done)
  }},
  { id: 'no_procrastinate', title: 'Anti Tunda', description: 'Tidak ada tugas yang di-snooze hari ini', xpReward: 20, check: () => {
    const tasks = JSON.parse(localStorage.getItem('daily_reminder_tasks') || '[]')
    return !tasks.some((t: any) => t.snoozedUntil && t.date === new Date().toISOString().split('T')[0])
  }},
  { id: 'perfect_day', title: 'Hari Sempurna', description: 'Selesaikan SEMUA tugas hari ini', xpReward: 100, check: () => {
    const tasks = JSON.parse(localStorage.getItem('daily_reminder_tasks') || '[]')
    const today = tasks.filter((t: any) => t.date === new Date().toISOString().split('T')[0])
    return today.length > 0 && today.every((t: any) => t.done)
  }},
  { id: 'evening_review', title: 'Review Malam', description: 'Buka app setelah jam 7 malam', xpReward: 10, check: () => new Date().getHours() >= 19 },
]

export default function DailyChallenge() {
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('avora_challenges_done_' + new Date().toISOString().split('T')[0]) || '[]') } catch { return [] }
  })
  const addXP = useGamificationStore(s => s.addXP)

  const todayChallenge = CHALLENGES[new Date().getDate() % CHALLENGES.length]

  const isDone = completed.includes(todayChallenge.id)
  const canClaim = !isDone && todayChallenge.check()

  const claim = () => {
    if (!canClaim) return
    const newDone = [...completed, todayChallenge.id]
    setCompleted(newDone)
    localStorage.setItem('avora_challenges_done_' + new Date().toISOString().split('T')[0], JSON.stringify(newDone))
    addXP(todayChallenge.xpReward, 'Daily Challenge')
  }

  return (
    <div className={`card p-4 ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-500" />
        <p className="text-sm font-bold text-gray-900 dark:text-white">Daily Challenge</p>
        <span className="ml-auto text-xs font-medium text-yellow-600 dark:text-yellow-400">+{todayChallenge.xpReward} XP</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{todayChallenge.description}</p>
      <button
        onClick={claim}
        disabled={!canClaim || isDone}
        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
          isDone
            ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            : canClaim
            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
            : 'bg-gray-100 dark:bg-dark-card text-gray-400'
        }`}
      >
        {isDone ? <><Check className="w-3.5 h-3.5" /> Selesai</> : canClaim ? 'Klaim Hadiah' : 'Belum terpenuhi'}
      </button>
    </div>
  )
}
