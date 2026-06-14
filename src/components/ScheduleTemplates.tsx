import { useState } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { useProfileStore } from '../stores/useProfileStore'
import { Calendar, Check } from 'lucide-react'

interface Template {
  id: string
  name: string
  icon: string
  tasks: { title: string; time: string; session: 'pagi' | 'siang' | 'sore' | 'malam' }[]
}

const TEMPLATES: Template[] = [
  {
    id: 'pelajar',
    name: 'Jadwal Pelajar',
    icon: '📚',
    tasks: [
      { title: 'Bangun & Sarapan', time: '06:00', session: 'pagi' },
      { title: 'Belajar Matematika', time: '07:00', session: 'pagi' },
      { title: 'Istirahat', time: '09:00', session: 'pagi' },
      { title: 'Belajar Bahasa', time: '10:00', session: 'pagi' },
      { title: 'Makan Siang & Istirahat', time: '12:00', session: 'siang' },
      { title: 'Belajar IPA', time: '13:00', session: 'siang' },
      { title: 'Olahraga', time: '15:00', session: 'sore' },
      { title: 'PR & Review', time: '19:00', session: 'malam' },
    ]
  },
  {
    id: 'kerja',
    name: 'Jadwal Kerja',
    icon: '💼',
    tasks: [
      { title: 'Persiapan & Commute', time: '07:00', session: 'pagi' },
      { title: 'Meeting Pagi', time: '09:00', session: 'pagi' },
      { title: 'Deep Work', time: '10:00', session: 'pagi' },
      { title: 'Makan Siang', time: '12:00', session: 'siang' },
      { title: 'Kolaborasi Tim', time: '13:00', session: 'siang' },
      { title: 'Follow-up Email', time: '15:00', session: 'sore' },
      { title: 'Review Hari Ini', time: '17:00', session: 'sore' },
    ]
  },
  {
    id: 'sehat',
    name: 'Hidup Sehat',
    icon: '🏃',
    tasks: [
      { title: 'Bangun Pagi & Minum Air', time: '05:30', session: 'pagi' },
      { title: 'Olahraga / Jogging', time: '06:00', session: 'pagi' },
      { title: 'Sarapan Sehat', time: '07:00', session: 'pagi' },
      { title: 'Makan Siang Bergizi', time: '12:00', session: 'siang' },
      { title: 'Jalan Santai', time: '16:00', session: 'sore' },
      { title: 'Meditasi / Relaksasi', time: '20:00', session: 'malam' },
    ]
  },
  {
    id: 'anak',
    name: 'Jadwal Anak',
    icon: '🎨',
    tasks: [
      { title: 'Bangun & Gosok Gigi', time: '06:30', session: 'pagi' },
      { title: 'Sarapan', time: '07:00', session: 'pagi' },
      { title: 'Belajar / Sekolah', time: '08:00', session: 'pagi' },
      { title: 'Main / Bermain', time: '10:00', session: 'pagi' },
      { title: 'Makan Siang', time: '12:00', session: 'siang' },
      { title: 'Tidur Siang', time: '13:00', session: 'siang' },
      { title: 'Bermain / Hobi', time: '15:00', session: 'sore' },
      { title: 'Makan Malam', time: '18:00', session: 'malam' },
      { title: 'Mandi & Tidur', time: '19:30', session: 'malam' },
    ]
  },
  {
    id: 'lansia',
    name: 'Jadwal Lansia Sehat',
    icon: '🧓',
    tasks: [
      { title: 'Minum Obat Pagi', time: '06:00', session: 'pagi' },
      { title: 'Jalan Pagi / Senam Ringan', time: '06:30', session: 'pagi' },
      { title: 'Sarapan Sehat', time: '07:30', session: 'pagi' },
      { title: 'Istirahat & Baca', time: '09:00', session: 'pagi' },
      { title: 'Makan Siang', time: '12:00', session: 'siang' },
      { title: 'Tidur Siang', time: '13:00', session: 'siang' },
      { title: 'Jalan Santai / Berkebun', time: '16:00', session: 'sore' },
      { title: 'Telepon Keluarga', time: '17:00', session: 'sore' },
      { title: 'Makan Malam & Minum Obat', time: '18:30', session: 'malam' },
      { title: 'Istirahat / Tonton TV', time: '20:00', session: 'malam' },
    ]
  }
]

interface ScheduleTemplatesProps {
  onApplied?: () => void
}

export default function ScheduleTemplates({ onApplied }: ScheduleTemplatesProps) {
  const [applied, setApplied] = useState<string | null>(null)
  const addTask = useTaskStore(s => s.addTask)
  const profile = useProfileStore(s => s.currentProfile)

  const applyTemplate = async (template: Template) => {
    if (!profile) return
    setApplied(template.id)
    for (const task of template.tasks) {
      await addTask({
        title: task.title,
        time: task.time,
        session: task.session,
        date: new Date().toISOString().split('T')[0],
      })
    }
    setTimeout(() => { setApplied(null); onApplied?.() }, 1500)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary-500" />
        <p className="text-sm font-bold text-gray-900 dark:text-white">Template Jadwal</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => applyTemplate(template)}
            disabled={applied !== null}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              applied === template.id
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-dark-border hover:border-primary-300'
            }`}
          >
            <span className="text-xl">{template.icon}</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{template.name}</p>
            <p className="text-[10px] text-gray-400">{template.tasks.length} tugas</p>
            {applied === template.id && <Check className="w-4 h-4 text-green-500 mt-1" />}
          </button>
        ))}
      </div>
    </div>
  )
}
