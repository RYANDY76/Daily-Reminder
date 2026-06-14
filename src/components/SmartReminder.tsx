import { useMemo } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { useProfileStore } from '../stores/useProfileStore'
import { Sparkles, Lightbulb } from 'lucide-react'

interface SmartReminderProps {
  onDismiss?: () => void
}

export default function SmartReminder({ onDismiss }: SmartReminderProps) {
  const tasks = useTaskStore(s => s.tasks)
  const profile = useProfileStore(s => s.currentProfile)

  const suggestions = useMemo(() => {
    const now = new Date()
    const hour = now.getHours()
    const pending = tasks.filter(t => !t.done && !t.snoozedUntil)
    const overdue = pending.filter(t => t.time < `${String(hour).padStart(2, '0')}:00`)
    const tips: string[] = []

    if (overdue.length > 0) {
      tips.push(`Anda memiliki ${overdue.length} tugas yang belum selesai dari jam sebelumnya.`)
    }
    if (hour >= 12 && hour < 14) {
      tips.push('Waktu istirahat makan siang. Jangan lupa makan!')
    }
    if (hour >= 21) {
      tips.push('Sudah malam. Siapkan jadwal besok untuk produktivitas lebih baik.')
    }
    if (pending.length === 0 && hour < 18) {
      tips.push('Semua tugas sudah selesai! Bagus sekali!')
    }
    if (pending.length > 5) {
      tips.push(`${pending.length} tugas menunggu. Prioritaskan yang paling penting.`)
    }

    const sessionCounts = { pagi: 0, siang: 0, sore: 0, malam: 0 }
    pending.forEach(t => { sessionCounts[t.session]++ })
    if (sessionCounts.pagi > 3) tips.push('Tugas pagi cukup banyak. Mulai dari yang paling mudah.')
    if (sessionCounts.malam > 2) tips.push('Tugas malam cukup banyak. Pertimbangkan untuk memindahkan ke besok.')

    return tips.slice(0, 3)
  }, [tasks, profile])

  if (suggestions.length === 0) return null

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <p className="text-sm font-bold text-gray-900 dark:text-white">Smart Reminder</p>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-3">
            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-700 dark:text-gray-300">{s}</p>
          </div>
        ))}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-[10px] text-gray-400 hover:text-gray-600">Sembunyikan</button>
      )}
    </div>
  )
}
