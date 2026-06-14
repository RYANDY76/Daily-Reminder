import { useState } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useGamificationStore } from '../stores/useGamificationStore'
import { getLast7DaysHistory } from '../database'
import { Printer, FileText } from 'lucide-react'

interface WeeklyReportProps {
  onClose?: () => void
}

export default function WeeklyReport({ onClose }: WeeklyReportProps) {
  const profile = useProfileStore(s => s.currentProfile)
  const stats = useGamificationStore(s => s.getStats())
  const [generating, setGenerating] = useState(false)

  const generateReport = async () => {
    if (!profile) return
    setGenerating(true)
    try {
      const history = await getLast7DaysHistory(profile.id)
      const totalDone = history.reduce((s, h) => s + h.tasksDone, 0)
      const totalTasks = history.reduce((s, h) => s + h.tasksTotal, 0)
      const avgCompletion = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

      const content = `
        <html>
        <head><style>
          body { font-family: system-ui; padding: 40px; color: #1a1a1a; }
          h1 { color: #55C8FF; border-bottom: 2px solid #55C8FF; padding-bottom: 8px; }
          .stat { display: inline-block; margin: 10px 20px 10px 0; }
          .stat-value { font-size: 24px; font-weight: bold; color: #55C8FF; }
          .stat-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; }
          th { background: #f3f4f6; font-size: 12px; }
          .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; }
        </style></head>
        <body>
          <h1>Laporan Mingguan - Avora</h1>
          <p>${profile.name} • ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div class="stat"><div class="stat-value">${totalDone}</div><div class="stat-label">Tugas Selesai</div></div>
          <div class="stat"><div class="stat-value">${totalTasks}</div><div class="stat-label">Total Tugas</div></div>
          <div class="stat"><div class="stat-value">${avgCompletion}%</div><div class="stat-label">Rata-rata</div></div>
          <div class="stat"><div class="stat-value">${stats.streak}</div><div class="stat-label">Streak</div></div>
          <div class="stat"><div class="stat-value">${stats.xp} XP</div><div class="stat-label">XP</div></div>
          <div class="stat"><div class="stat-value">Level ${stats.level}</div><div class="stat-label">Level</div></div>
          <table>
            <tr><th>Hari</th><th>Selesai</th><th>Total</th><th>Persentase</th></tr>
            ${history.map(h => `<tr><td>${h.date}</td><td>${h.tasksDone}</td><td>${h.tasksTotal}</td><td>${h.completionPercentage}%</td></tr>`).join('')}
          </table>
          <div class="footer">Dibuat oleh Avora • ${new Date().toISOString()}</div>
        </body></html>
      `
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(content)
        printWindow.document.close()
        printWindow.print()
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary-500" />
        <p className="text-sm font-bold text-gray-900 dark:text-white">Laporan Mingguan</p>
      </div>
      <button onClick={generateReport} disabled={generating} className="btn-primary w-full flex items-center justify-center gap-2">
        <Printer className="w-4 h-4" />
        {generating ? 'Membuat...' : 'Cetak / PDF'}
      </button>
      {onClose && <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 w-full">Tutup</button>}
    </div>
  )
}
