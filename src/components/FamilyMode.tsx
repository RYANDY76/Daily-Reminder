import { useState } from 'react'
import { useGamificationStore } from '../stores/useGamificationStore'
import { Users, Eye, CheckCircle2, Flame, Trophy } from 'lucide-react'

interface FamilyModeProps {
  onClose: () => void
}

export default function FamilyMode({ onClose }: FamilyModeProps) {
  const stats = useGamificationStore(s => s.getStats())
  const [mode, setMode] = useState<'select' | 'parent' | 'child'>('select')
  const [childCode, setChildCode] = useState('')

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  if (mode === 'select') {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 w-full max-w-sm space-y-4">
          <div className="text-center">
            <Users className="w-10 h-10 text-primary-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mode Keluarga</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Orang tua bisa memantau aktivitas anak</p>
          </div>
          <button onClick={() => setMode('parent')} className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-400 text-left">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Saya Orang Tua</p>
                <p className="text-xs text-gray-400">Pantau aktivitas anak</p>
              </div>
            </div>
          </button>
          <button onClick={() => setMode('child')} className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-400 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Saya Anak</p>
                <p className="text-xs text-gray-400">Hubungkan ke orang tua</p>
              </div>
            </div>
          </button>
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">Batal</button>
        </div>
      </div>
    )
  }

  if (mode === 'parent') {
    const code = generateCode()
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 w-full max-w-sm space-y-4">
          <Eye className="w-8 h-8 text-blue-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">Mode Orang Tua</h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Bagikan kode ini ke anak</p>
            <p className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400 tracking-[0.3em]">{code}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Streak: {stats.streak} hari</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Badge: {stats.unlockedBadges}/{stats.totalBadges}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-primary w-full">Selesai</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 w-full max-w-sm space-y-4">
        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">Hubungkan ke Orang Tua</h3>
        <input
          type="text"
          value={childCode}
          onChange={(e) => setChildCode(e.target.value.toUpperCase())}
          placeholder="Masukkan kode dari orang tua"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-dark-border text-center text-lg font-mono tracking-[0.3em] focus:ring-2 focus:ring-primary-500 outline-none"
          maxLength={6}
        />
        <button
          onClick={() => { if (childCode.length === 6) onClose() }}
          disabled={childCode.length !== 6}
          className="btn-primary w-full disabled:opacity-50"
        >
          Hubungkan
        </button>
        <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">Batal</button>
      </div>
    </div>
  )
}
