import { useState } from 'react'
import { MODE_CONFIG, type AppMode } from '../types/accessibility'
import { useProfileStore } from '../stores/useProfileStore'
import { Star, ArrowRight } from 'lucide-react'

interface ModeSelectorProps {
  onSelect: () => void
}

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  const [selected, setSelected] = useState<AppMode>('pelajar')
  const [step, setStep] = useState<'select' | 'prompt'>('select')
  const updateProfile = useProfileStore(s => s.updateProfile)

  const config = MODE_CONFIG[selected]

  const handleSelect = async () => {
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

  if (step === 'prompt') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-3">
            <span className="text-5xl block">{config.icon}</span>
            <h1 className="text-2xl font-black text-white">{config.prompts.title}</h1>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{config.prompts.body}</p>
          </div>

          <button
            onClick={handleSelect}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 active:scale-[0.98] transition-transform"
          >
            Mulai <ArrowRight className="w-4 h-4" />
          </button>

          <button onClick={() => setStep('select')} className="w-full text-center text-white/40 text-xs hover:text-white/60">
            ← Kembali
          </button>
        </div>
      </div>
    )
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
            const cfg = MODE_CONFIG[mode]
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
                  <span className="text-2xl">{cfg.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-white">{cfg.label}</p>
                    <p className="text-xs text-white/50">{cfg.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cfg.hiddenFeatures.length === 0 ? (
                      <span className="text-[10px] text-white/40">Semua fitur aktif</span>
                    ) : (
                      <span className="text-[10px] text-white/40">{cfg.hiddenFeatures.length} fitur disembunyikan</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setStep('prompt')}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 active:scale-[0.98] transition-transform"
        >
          Lanjut <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-white/30 text-[10px]">Bisa diubah kapan saja di Pengaturan</p>
      </div>
    </div>
  )
}
