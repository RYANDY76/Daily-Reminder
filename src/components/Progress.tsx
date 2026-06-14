import { useState } from 'react'
import Stats from './Stats'
import Goals from './Goals'
import { BarChart3, Target } from 'lucide-react'

export default function Progress() {
  const [tab, setTab] = useState<'stats' | 'goals'>('stats')

  return (
    <div className="space-y-4">
      <h2 className="page-heading">Progress</h2>
      <div className="flex gap-1 bg-gray-100 dark:bg-dark-card p-1 rounded-2xl">
        <button
          onClick={() => setTab('stats')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            tab === 'stats'
              ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-soft'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Insights
        </button>
        <button
          onClick={() => setTab('goals')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            tab === 'goals'
              ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-soft'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          Goals
        </button>
      </div>
      {tab === 'stats' ? <Stats /> : <Goals />}
    </div>
  )
}
