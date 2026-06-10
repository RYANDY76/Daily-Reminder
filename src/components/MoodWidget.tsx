import { useState, useEffect } from 'react'
import type { MoodLog, MoodLevel } from '../types'
import { useProfileStore } from '../stores/useProfileStore'
import { saveMoodLog, getMoodLog } from '../database'
import { scheduleAutoCloudSync } from '../services/autoCloudSync'
import { getTodayDate } from '../dates'
import { useT } from '../i18n'
import { Zap, Smile } from 'lucide-react'

const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😄'
}
const ENERGY_EMOJIS: Record<MoodLevel, string> = {
  1: '🔋', 2: '🔋🔋', 3: '⚡', 4: '⚡⚡', 5: '🔥'
}

export default function MoodWidget() {
  const profile = useProfileStore((s) => s.currentProfile)
  const [moodLog, setMoodLog] = useState<MoodLog | null>(null)
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [selectedEnergy, setSelectedEnergy] = useState<MoodLevel | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const t = useT()
  const moodLabelMap: Record<MoodLevel, string> = {
    1: t('mood.veryBad'),
    2: t('mood.bad'),
    3: t('mood.okay'),
    4: t('mood.good'),
    5: t('mood.great'),
  }
  const energyLabelMap: Record<MoodLevel, string> = {
    1: t('mood.energyExhausted'),
    2: t('mood.energyLow'),
    3: t('mood.energyMedium'),
    4: t('mood.energyHigh'),
    5: t('mood.energyFull'),
  }
  const today = getTodayDate()

  useEffect(() => {
    if (profile) {
      getMoodLog(profile.id, today).then(log => {
        if (log) {
          setMoodLog(log)
          setSelectedMood(log.mood)
          setSelectedEnergy(log.energy)
          setNote(log.note)
          setSaved(true)
        } else {
          setShowForm(true)
        }
      })
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile || !selectedMood || !selectedEnergy) return
    const log: MoodLog = {
      id: `${profile.id}_${today}_mood`,
      profileId: profile.id,
      date: today,
      mood: selectedMood,
      energy: selectedEnergy,
      note: note.trim(),
      createdAt: Date.now()
    }
    await saveMoodLog(log)
    setMoodLog(log)
    setSaved(true)
    setShowForm(false)
    scheduleAutoCloudSync()
  }

  if (!showForm && saved && moodLog) {
    return (
      <div
        className="card p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
        onClick={() => setShowForm(true)}
        role="button"
        aria-label={t('mood.editToday')}
      >
        <span className="text-2xl">{MOOD_EMOJIS[moodLog.mood]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{t('mood.todayLabel')}</p>
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            {moodLabelMap[moodLog.mood]} · {ENERGY_EMOJIS[moodLog.energy]} {energyLabelMap[moodLog.energy]}
            {moodLog.note && <span className="text-gray-400 ml-1 font-normal truncate">· {moodLog.note}</span>}
          </p>
        </div>
        <span className="text-xs text-primary-500 font-medium flex-shrink-0">{t('mood.edit')}</span>
      </div>
    )
  }

  if (!showForm) return null

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Smile className="w-4 h-4 text-primary-500" />
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('mood.question')}</p>
      </div>

      {/* Mood */}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('mood.moodLabel')}</p>
        <div className="flex gap-2 justify-between">
          {([1, 2, 3, 4, 5] as MoodLevel[]).map(level => (
            <button
              key={level}
              onClick={() => setSelectedMood(level)}
              className={`flex-1 py-2 rounded-xl text-xl transition-all ${
                selectedMood === level
                  ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500 scale-105'
                  : 'bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {MOOD_EMOJIS[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('mood.energyLabel')}</p>
        </div>
        <div className="flex gap-2 justify-between">
          {([1, 2, 3, 4, 5] as MoodLevel[]).map(level => (
            <button
              key={level}
              onClick={() => setSelectedEnergy(level)}
              className={`flex-1 py-2 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                selectedEnergy === level
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400'
                  : 'bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-base">{ENERGY_EMOJIS[level]}</span>
              <span className={`text-[10px] font-medium leading-none ${
                selectedEnergy === level ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-400'
              }`}>{energyLabelMap[level]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Optional note */}
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={t('mood.notePlaceholder')}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm"
      />

      <div className="flex gap-2">
        {saved && (
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-dark-border text-gray-600 dark:text-gray-400 text-sm"
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!selectedMood || !selectedEnergy}
          className="flex-1 py-2 rounded-xl bg-primary-500 text-white font-medium text-sm disabled:opacity-50"
        >
          {t('mood.save')}
        </button>
      </div>
    </div>
  )
}
