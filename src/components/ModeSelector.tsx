import { useState } from 'react'
import { MODE_CONFIG, type AppMode } from '../types/accessibility'
import { useProfileStore } from '../stores/useProfileStore'
import { Star, ArrowRight } from 'lucide-react'

interface ModeSelectorProps {
  onSelect: () => void
}

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  const [selected, setSelected] = useState<AppMode>('pelajar')
  const updateProfile = useProfileStore(s => s.updateProfile)

  const handleSelect = async () => {
    const config = MODE_CONFIG[selected]
    await updateProfile({
      accentColor: config.accentColor,
      darkMode: 'system'
    })
    localStorage.setItem('avora_accessibility', JSON.stringify({
      fontSize: config.fontSize,
      bigButtons: config.bigButtons,
      highContrast: false,
      reducedMotion: false,
      appMode: selected
    }))
    onSelect()
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white">Avora</h1>
          <p className="text-white/60 text-sm">Pilih mode yang paling cocok untukmu</p>
        </div>

        <div className="space-y-3">
          {(Object.keys(MODE_CONFIG) as AppMode[]).map(mode => {
            const config = MODE_CONFIG[mode]
            const isSelected = selected === mode
            return (
              <button
                key={mode}
                onClick={() => setSelected(mode)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary-400 bg-white/10 shadow-lg shadow-primary-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-white">{config.label}</p>
                    <p className="text-xs text-white/50">{config.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  )}
                </div>
                {mode === 'anak' && isSelected && (
                  <div className="mt-3 flex gap-2">
                    {['🌈', '🏆', '⭐', '🎮'].map(e => (
                      <span key={e} className="text-xl bg-white/10 rounded-lg px-2 py-1">{e}</span>
                    ))}
                  </div>
                )}
                {mode === 'pelajar' && isSelected && (
                  <div className="mt-3 flex gap-2">
                    {['📋', '⏱️', '📊', '🎯'].map(e => (
                      <span key={e} className="text-lg bg-white/10 rounded-lg px-2 py-1">{e}</span>
                    ))}
                  </div>
                )}
                {mode === 'mudah' && isSelected && (
                  <div className="mt-3 flex gap-2">
                    {['🌟', '👁️', '🔊', '✋'].map(e => (
                      <span key={e} className="text-xl bg-white/10 rounded-lg px-2 py-1">{e}</span>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleSelect}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 active:scale-[0.98] transition-transform"
        >
          Mulai <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-white/30 text-[10px]">Bisa diubah kapan saja di Pengaturan</p>
      </div>
    </div>
  )
}
