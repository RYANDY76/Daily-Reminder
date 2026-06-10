import { useState, useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useToast } from '../hooks/useToast'
import { useT } from '../i18n'
import type { CoupleGoal } from '../types-couple'
import Confetti from './Confetti'
import { Heart, Plus, Target, Calendar, CheckCircle, Circle, Trash2, X, Sparkles } from 'lucide-react'

export default function CoupleGoals() {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const goals = useCoupleStore(s => s.goals)
  const loadGoals = useCoupleStore(s => s.loadGoals)
  const addGoal = useCoupleStore(s => s.addGoal)
  const updateGoal = useCoupleStore(s => s.updateGoal)
  const removeGoal = useCoupleStore(s => s.removeGoal)
  const { success } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    milestones: ['', '', '']
  })

  useEffect(() => {
    if (connection) {
      loadGoals()
    }
  }, [connection, loadGoals])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile || !connection) return

    const milestones = formData.milestones
      .filter(m => m.trim())
      .map(title => ({
        id: crypto.randomUUID(),
        title,
        completed: false
      }))

    await addGoal({
      coupleId: connection.id,
      title: formData.title,
      description: formData.description,
      targetDate: formData.targetDate,
      milestones,
      createdBy: currentProfile.id,
      completed: false,
      progress: 0
    })

    // Reload to show immediately
    await loadGoals()
    setShowForm(false)
    setFormData({ title: '', description: '', targetDate: '', milestones: ['', '', ''] })
    success(t('couple.goalCreated'))
  }

  const handleToggleMilestone = async (goal: CoupleGoal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestoneId
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? Date.now() : undefined, completedBy: currentProfile?.id }
        : m
    )

    const completedCount = updatedMilestones.filter(m => m.completed).length
    const progress = Math.round((completedCount / updatedMilestones.length) * 100)

    await updateGoal(goal.id, {
      milestones: updatedMilestones,
      progress,
      completed: progress === 100,
      completedAt: progress === 100 ? Date.now() : undefined
    })

    // Reload to show immediately
    await loadGoals()

    if (progress === 100) {
      setShowConfetti(true)
      success(t('couple.goalCompleted'))
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm(t('goals.deleteConfirm'))) return
    await removeGoal(goalId)
    // Reload to show immediately
    await loadGoals()
    success(t('couple.goalDeleted'))
  }

  if (!connection || connection.status !== 'active') {
    return (
      <div className="card p-8 text-center">
        <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          {t('couple.connectToCreateGoals')}
        </p>
      </div>
    )
  }

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  return (
    <>
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <div className="space-y-5">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            {t('couple.coupleGoals')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('couple.achieveTogether')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('goals.newGoal')}
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('goals.active')}</h3>
          {activeGoals.map(goal => (
            <div key={goal.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-5 h-5 text-pink-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h4>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{goal.description}</p>
                  )}
                  {goal.targetDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{t('couple.target')}: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">{t('couple.progress')}</span>
                  <span className="font-semibold text-pink-600 dark:text-pink-400">{goal.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              {/* Milestones */}
              {goal.milestones.length > 0 && (
                <div className="space-y-2">
                  {goal.milestones.map(milestone => (
                    <button
                      key={milestone.id}
                      onClick={() => handleToggleMilestone(goal, milestone.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors text-left"
                    >
                      {milestone.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm flex-1 ${
                        milestone.completed
                          ? 'text-gray-400 line-through'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {milestone.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            {t('goals.completed')}
          </h3>
          {completedGoals.map(goal => (
            <div key={goal.id} className="card p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 border-2 border-pink-200 dark:border-pink-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 fill-green-500" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('goals.completed')} {new Date(goal.completedAt!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('couple.noGoals')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('couple.createFirstGoal')}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all"
          >
            {t('goals.addFirst')}
          </button>
        </div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('couple.newCoupleGoal')}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('couple.goalTitle')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('couple.goalTitlePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('couple.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('couple.addMoreDetails')}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('goals.targetDate')}
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('couple.milestones')}
                </label>
                {formData.milestones.map((milestone, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={milestone}
                    onChange={(e) => {
                      const newMilestones = [...formData.milestones]
                      newMilestones[idx] = e.target.value
                      setFormData({ ...formData, milestones: newMilestones })
                    }}
                    placeholder={t('couple.milestoneN', { n: idx + 1 })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all mb-2"
                  />
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                >
                  {t('couple.createGoal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
