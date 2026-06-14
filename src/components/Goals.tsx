import { useState, useEffect, type CSSProperties } from 'react'
import { Plus, Target, Check, Trash2, Edit2, X, Calendar, Book, Dumbbell, Rocket, Lightbulb, Trophy, Plane, Star, GraduationCap, DollarSign, Palette, Leaf, type LucideIcon } from 'lucide-react'
import type { Goal } from '../types'
import { useProfileStore } from '../stores/useProfileStore'
import { useT } from '../i18n'
import { useConfirm } from '../hooks/useConfirm'
import { saveGoal, getGoalsForProfile, deleteGoal as deleteGoalDb } from '../database'
import { scheduleAutoCloudSync } from '../services/autoCloudSync'
import { formatDateShort, getTodayDate } from '../dates'

const GOAL_ICON_MAP: Record<string, LucideIcon> = {
  Target, Book, Dumbbell, Rocket, Lightbulb, Trophy, Plane, Star, GraduationCap, DollarSign, Palette, Leaf,
}
const GOAL_ICON_NAMES = Object.keys(GOAL_ICON_MAP)
const GOAL_COLORS = ['#1D9E75', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#F97316']

function GoalIcon({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  const Icon = GOAL_ICON_MAP[name as keyof typeof GOAL_ICON_MAP]
  if (!Icon) return null
  return <Icon className={className || 'w-5 h-5'} style={style} />
}

interface GoalFormData {
  title: string
  description: string
  targetDate: string
  color: string
  icon: string
}

const emptyForm: GoalFormData = {
  title: '',
  description: '',
  targetDate: '',
  color: GOAL_COLORS[0],
  icon: 'Target'
}

export default function Goals() {
  const profile = useProfileStore((s) => s.currentProfile)
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalFormData>(emptyForm)
  const t = useT()
  const { confirm, ConfirmDialog } = useConfirm()
  const today = getTodayDate()

  useEffect(() => {
    if (profile) getGoalsForProfile(profile.id).then(setGoals)
  }, [profile])

  const loadGoals = async () => {
    if (profile) setGoals(await getGoalsForProfile(profile.id))
  }

  const openAdd = () => {
    setEditingGoal(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setForm({
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      color: goal.color,
      icon: goal.icon
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingGoal(null)
    setForm(emptyForm)
  }

  const saveForm = async () => {
    if (!profile || !form.title.trim()) return
    if (editingGoal) {
      await saveGoal({
        ...editingGoal,
        title: form.title.trim(),
        description: form.description.trim(),
        targetDate: form.targetDate,
        color: form.color,
        icon: form.icon,
        updatedAt: Date.now()
      })
    } else {
      const goal: Goal = {
        id: crypto.randomUUID(),
        profileId: profile.id,
        title: form.title.trim(),
        description: form.description.trim(),
        targetDate: form.targetDate,
        color: form.color,
        icon: form.icon,
        done: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      await saveGoal(goal)
    }
    closeForm()
    await loadGoals()
    scheduleAutoCloudSync()
  }

  const toggleGoalDone = async (goal: Goal) => {
    await saveGoal({ ...goal, done: !goal.done, updatedAt: Date.now() })
    await loadGoals()
    scheduleAutoCloudSync()
  }

  const removeGoal = async (id: string) => {
    const ok = await confirm({ title: t('common.confirm'), message: t('goals.deleteConfirm'), variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') })
    if (!ok) return
    await deleteGoalDb(id)
    await loadGoals()
    scheduleAutoCloudSync()
  }

  const activeGoals = goals.filter(g => !g.done)
  const completedGoals = goals.filter(g => g.done)

  const getDaysRemaining = (targetDate: string) => {
    if (!targetDate) return null
    const diff = Math.ceil((new Date(targetDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const days = getDaysRemaining(goal.targetDate)
    const isOverdue = days !== null && days < 0 && !goal.done
    const isDueSoon = days !== null && days >= 0 && days <= 7 && !goal.done

    return (
      <div
        className={`bg-white dark:bg-dark-card rounded-xl border overflow-hidden transition-all ${
          goal.done
            ? 'border-gray-200 dark:border-dark-border opacity-70'
            : isOverdue
            ? 'border-red-200 dark:border-red-800/30'
            : isDueSoon
            ? 'border-yellow-200 dark:border-yellow-800/30'
            : 'border-gray-200 dark:border-dark-border'
        }`}
      >
        {/* Color accent bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: goal.color }} />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon & done toggle */}
            <button
              onClick={() => toggleGoalDone(goal)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all ${
                goal.done ? 'opacity-60' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: goal.color + '20' }}
              title={goal.done ? t('goals.markUndone') : t('goals.markDone')}
            >
              {goal.done ? <Check className="w-5 h-5" style={{ color: goal.color }} /> : <GoalIcon name={goal.icon} className="w-5 h-5" style={{ color: goal.color }} />}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${goal.done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                {goal.title}
              </p>
              {goal.description && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2">{goal.description}</p>
              )}
              {goal.targetDate && (
                <div className={`flex items-center gap-1 mt-1.5 text-xs ${
                  isOverdue ? 'text-red-500' : isDueSoon ? 'text-yellow-500' : 'text-gray-400'
                }`}>
                  <Calendar className="w-3 h-3" />
                  <span>{formatDateShort(goal.targetDate)}</span>
                  {days !== null && !goal.done && (
                    <span>
                      {days < 0
                        ? `· ${t('goals.overdueBy', { days: Math.abs(days) })}`
                        : days === 0
                        ? `· ${t('goals.dueToday')}`
                        : `· ${t('goals.daysLeft', { days })}`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => openEdit(goal)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => removeGoal(goal.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('goals.title')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-500">{t('goals.subtitle')}</p>
          </div>
          <button
            onClick={openAdd}
            className="p-2 rounded-xl bg-primary-500 text-white min-h-tap"
            aria-label={t('goals.add')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-primary-500">{activeGoals.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{t('goals.active')}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-green-500">{completedGoals.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{t('goals.completed')}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {editingGoal ? t('goals.editGoal') : t('goals.newGoal')}
            </h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Icon picker */}
          <div className="flex flex-wrap gap-1.5">
            {GOAL_ICON_NAMES.map(name => (
              <button
                key={name}
                onClick={() => setForm(f => ({ ...f, icon: name }))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors ${
                  form.icon === name ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : 'hover:bg-gray-100 dark:hover:bg-dark-surface'
                }`}
              >
                <GoalIcon name={name} className="w-4 h-4" />
              </button>
            ))}
          </div>

          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder={t('goals.titlePlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm"
            autoFocus
          />

          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder={t('goals.descPlaceholder')}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm resize-none"
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t('goals.targetDate')}
            </label>
            <input
              type="date"
              value={form.targetDate}
              onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
              min={today}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Color picker */}
          <div className="flex flex-wrap gap-2">
            {GOAL_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={closeForm}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-600 dark:text-gray-400 text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={saveForm}
              disabled={!form.title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm disabled:opacity-50"
            >
              {editingGoal ? t('common.save') : t('goals.add')}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && !showForm && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t('goals.emptyTitle')}</p>
          <p className="text-sm text-gray-400 mb-5">{t('goals.emptyDesc')}</p>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            {t('goals.addFirst')}
          </button>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('goals.activeSection')} ({activeGoals.length})
          </p>
          {activeGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('goals.completedSection')} ({completedGoals.length})
          </p>
          {completedGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}
    </div>
    </>
  )
}
