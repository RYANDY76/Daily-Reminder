import { useState, useEffect } from 'react'
import { Plus, Flame, X, Check, Target, Edit2, Trophy } from 'lucide-react'
import type { Habit } from '../types'
import { getTodayDate } from '../dates'
import { useProfileStore } from '../stores/useProfileStore'
import { useT } from '../i18n'
import { saveHabit, getHabitsForProfile, deleteHabit } from '../database'
import { scheduleAutoCloudSync } from '../services/autoCloudSync'

const HABIT_ICONS = ['🎯', '📚', '🏃', '💧', '🧘', '💪', '✍️', '🎵', '🌱', '☀️', '💤', '🍎', '🧹', '🏊', '🚴']
const HABIT_COLORS = ['#1D9E75', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']


interface HabitFormData {
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly'
  targetDays: number[]
  reminderTime: string
}

const defaultForm: HabitFormData = {
  name: '',
  icon: '🎯',
  color: HABIT_COLORS[0],
  frequency: 'daily',
  targetDays: [0, 1, 2, 3, 4, 5, 6],
  reminderTime: '09:00'
}

export default function HabitTracker() {
  const profile = useProfileStore((s) => s.currentProfile)
  const [habits, setHabits] = useState<Habit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [form, setForm] = useState<HabitFormData>(defaultForm)
  const today = getTodayDate()
  const t = useT()

  useEffect(() => {
    if (profile) getHabitsForProfile(profile.id).then(setHabits)
  }, [profile])

  const loadHabits = async () => {
    if (profile) setHabits(await getHabitsForProfile(profile.id))
  }

  const openAdd = () => {
    setEditingHabit(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setForm({
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      frequency: habit.frequency,
      targetDays: habit.targetDays,
      reminderTime: habit.reminderTime || '09:00'
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingHabit(null)
    setForm(defaultForm)
  }

  const saveForm = async () => {
    if (!profile || !form.name.trim()) return
    const days = form.frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : form.targetDays
    if (editingHabit) {
      const updated: Habit = {
        ...editingHabit,
        name: form.name.trim(),
        icon: form.icon,
        color: form.color,
        frequency: form.frequency,
        targetDays: days,
        reminderTime: form.reminderTime
      }
      await saveHabit(updated)
    } else {
      const habit: Habit = {
        id: crypto.randomUUID(),
        profileId: profile.id,
        name: form.name.trim(),
        icon: form.icon,
        color: form.color,
        frequency: form.frequency,
        targetDays: days,
        completedDates: [],
        currentStreak: 0,
        bestStreak: 0,
        reminderTime: form.reminderTime,
        createdAt: Date.now()
      }
      await saveHabit(habit)
    }
    closeForm()
    await loadHabits()
    scheduleAutoCloudSync()
  }

  const toggleHabit = async (habit: Habit) => {
    const completed = habit.completedDates.includes(today)
    const newDates = completed
      ? habit.completedDates.filter(d => d !== today)
      : [...habit.completedDates, today]

    let streak = 0
    let d = new Date()
    while (newDates.includes(d.toISOString().split('T')[0])) {
      streak++
      d.setDate(d.getDate() - 1)
    }

    await saveHabit({
      ...habit,
      completedDates: newDates,
      currentStreak: streak,
      bestStreak: Math.max(streak, habit.bestStreak)
    })
    await loadHabits()
    scheduleAutoCloudSync()
  }

  const removeHabit = async (id: string) => {
    if (!window.confirm(t('habits.deleteConfirm'))) return
    await deleteHabit(id)
    await loadHabits()
    scheduleAutoCloudSync()
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const todayDayOfWeek = new Date().getDay()

  // Compute overall stats
  const totalHabits = habits.length
  const completedToday = habits.filter(h => h.completedDates.includes(today)).length
  const bestStreakAll = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0)

  const toggleDay = (day: number) => {
    const days = form.targetDays.includes(day)
      ? form.targetDays.filter(d => d !== day)
      : [...form.targetDays, day]
    setForm(f => ({ ...f, targetDays: days }))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('habits.title')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('habits.subtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          className="p-2 rounded-xl bg-primary-500 text-white min-h-tap"
          aria-label={t('habits.add')}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Summary cards */}
      {totalHabits > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-primary-500">{completedToday}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('habits.todayDone')}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalHabits}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('habits.totalHabits')}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-orange-500">{bestStreakAll}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('habits.bestStreakAll')}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {editingHabit ? t('habits.editTitle') : t('habits.addTitle')}
          </h3>

          {/* Icon picker */}
          <div className="flex flex-wrap gap-1.5">
            {HABIT_ICONS.map(icon => (
              <button
                key={icon}
                onClick={() => setForm(f => ({ ...f, icon }))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors ${form.icon === icon ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : 'hover:bg-gray-100 dark:hover:bg-dark-surface'}`}
              >
                {icon}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder={t('habits.placeholder')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm"
            autoFocus
          />

          {/* Color picker */}
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('habits.reminderTime')}</p>
            <input
              type="time"
              value={form.reminderTime}
              onChange={(e) => setForm(f => ({ ...f, reminderTime: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Frequency */}
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('habits.frequency')}</p>
            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setForm(prev => ({
                    ...prev,
                    frequency: f,
                    targetDays: f === 'daily' ? [0,1,2,3,4,5,6] : prev.targetDays
                  }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.frequency === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {f === 'daily' ? t('habits.freqDaily') : t('habits.freqWeekly')}
                </button>
              ))}
            </div>
          </div>

          {/* Day picker for weekly */}
          {form.frequency === 'weekly' && (
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('habits.targetDays')}</p>
              <div className="flex gap-1">
                {[0,1,2,3,4,5,6].map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      form.targetDays.includes(i)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {t('habits.weekDay'+i)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={closeForm}
              className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-600 dark:text-gray-400 text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={saveForm}
              disabled={!form.name.trim()}
              className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-medium text-sm disabled:opacity-50"
            >
              {editingHabit ? t('common.save') : t('habits.add')}
            </button>
          </div>
        </div>
      )}

      {/* Habit List */}
      {habits.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('habits.emptyTitle')}</p>
          <p className="text-xs text-gray-400">{t('habits.startPrompt')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const isCompletedToday = habit.completedDates.includes(today)
            const isScheduledToday = habit.frequency === 'daily' || habit.targetDays.includes(todayDayOfWeek)

            return (
              <div key={habit.id} className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="flex items-center gap-3 p-3.5">
                  {/* Toggle button */}
                  <button
                    onClick={() => isScheduledToday && toggleHabit(habit)}
                    disabled={!isScheduledToday}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all min-h-tap flex-shrink-0 ${
                      isCompletedToday
                        ? 'text-white shadow-md'
                        : isScheduledToday
                        ? 'bg-gray-100 dark:bg-dark-surface hover:opacity-80'
                        : 'bg-gray-50 dark:bg-dark-surface opacity-40 cursor-not-allowed'
                    }`}
                    style={isCompletedToday ? { backgroundColor: habit.color } : {}}
                    title={isScheduledToday ? '' : t('habits.notScheduled')}
                  >
                    {isCompletedToday ? <Check className="w-5 h-5" /> : habit.icon}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isCompletedToday ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-gray-500">{t('habits.streak', { days: habit.currentStreak })}</span>
                      {habit.bestStreak > 0 && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-400">{habit.bestStreak}</span>
                        </>
                      )}
                      {habit.frequency === 'weekly' && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-blue-500">
                            {habit.targetDays.map(d => t('habits.weekDay'+d)).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(habit)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors min-h-tap"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeHabit(habit.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors min-h-tap"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 7-day mini chart */}
                <div className="px-3.5 pb-3">
                  <div className="flex gap-1">
                    {last7.map((date) => {
                      const done = habit.completedDates.includes(date)
                      const dayIdx = new Date(date + 'T00:00:00').getDay()
                      const scheduled = habit.frequency === 'daily' || habit.targetDays.includes(dayIdx)
                      return (
                        <div key={date} className="flex-1 flex flex-col items-center gap-0.5">
                          <div
                            className={`w-full h-2 rounded-full transition-colors ${
                              done
                                ? 'opacity-100'
                                : scheduled
                                ? 'bg-gray-200 dark:bg-gray-700'
                                : 'bg-gray-100 dark:bg-gray-800 opacity-30'
                            }`}
                            style={done ? { backgroundColor: habit.color } : {}}
                            title={date}
                          />
                          <span className="text-[9px] text-gray-400">{t('habits.weekDay'+new Date(date + 'T00:00:00').getDay())}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
