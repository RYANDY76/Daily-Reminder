import { useGamificationStore } from '../stores/useGamificationStore'
import { BADGE_DEFINITIONS } from '../types/gamification'
import { Trophy, Star, Flame, Zap } from 'lucide-react'

export default function GamificationPanel() {
  const stats = useGamificationStore(s => s.getStats())

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Progress</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-200 dark:text-gray-700" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="url(#levelGrad)" strokeWidth="2.5"
              strokeDasharray={`${stats.xpProgress * 0.974} 97.4`} strokeLinecap="round" />
            <defs>
              <linearGradient id="levelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#55C8FF" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-primary-600 dark:text-primary-400">{stats.level}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.xp} XP</span>
          </div>
          <p className="text-[11px] text-gray-400">{stats.xpProgress}% menuju Level {stats.level + 1}</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{stats.streak} hari</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{stats.unlockedBadges}/{stats.totalBadges}</span>
            </div>
          </div>
        </div>
      </div>

      {stats.streak >= 3 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-3 flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-orange-700 dark:text-orange-300">Streak {stats.streak} Hari!</p>
            <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70">Terus semangat!</p>
          </div>
        </div>
      )}

      {stats.badges.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Badge Terbaru</p>
          <div className="flex flex-wrap gap-2">
            {stats.badges.filter(b => b.unlockedAt).slice(-6).map(badge => (
              <div key={badge.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-dark-surface rounded-lg px-2 py-1">
                <span className="text-sm">{badge.icon}</span>
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Semua Badge ({stats.unlockedBadges}/{stats.totalBadges})</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {BADGE_DEFINITIONS.map(def => {
            const unlocked = stats.badges.find(b => b.id === def.id)?.unlockedAt
            return (
              <div key={def.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                unlocked
                  ? 'bg-gradient-to-b from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-surface shadow-sm'
                  : 'bg-gray-50 dark:bg-dark-surface opacity-40'
              }`}>
                <span className={`text-xl ${unlocked ? '' : 'grayscale'}`}>{def.icon}</span>
                <span className="text-[9px] font-bold text-center leading-tight text-gray-700 dark:text-gray-300">{def.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
