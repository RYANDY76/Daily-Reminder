import { useState } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useTaskStore } from '../stores/useTaskStore'
import { useToast } from '../hooks/useToast'
import { useT } from '../i18n'
import type { Task } from '../types'
import { X, Share2, Users, User, UserCheck } from 'lucide-react'

interface ShareTaskModalProps {
  task: Task
  onClose: () => void
}

export default function ShareTaskModal({ task, onClose }: ShareTaskModalProps) {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const getPartnerName = useCoupleStore(s => s.getPartnerName)
  const getPartnerId = useCoupleStore(s => s.getPartnerId)
  const shareTask = useTaskStore(s => s.shareTask)
  const unshareTask = useTaskStore(s => s.unshareTask)
  const { success } = useToast()
  
  const [assignedTo, setAssignedTo] = useState<'me' | 'partner' | 'both'>(
    task.assignedTo || 'both'
  )
  const [sharing, setSharing] = useState(false)

  if (!connection || !currentProfile) return null

  const partnerName = getPartnerName(currentProfile.id)
  const partnerId = getPartnerId(currentProfile.id)
  const isAlreadyShared = task.isShared

  const handleShare = async () => {
    setSharing(true)
    try {
      await shareTask(task.id, partnerId, assignedTo)
      success(t('couple.taskShared', { name: partnerName }))
      onClose()
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to share task:', error)
    } finally {
      setSharing(false)
    }
  }

  const handleUnshare = async () => {
    setSharing(true)
    try {
      await unshareTask(task.id)
      success(t('couple.unshareTask'))
      onClose()
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to unshare task:', error)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-bounce-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            {isAlreadyShared ? t('couple.sharedTask') : t('couple.shareTask')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Task Info */}
        <div className="mb-6 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
            {task.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {task.time}
          </p>
        </div>

        {isAlreadyShared ? (
          /* Already Shared Info */
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('couple.sharedWith', { name: partnerName })}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('couple.assignTo')}: {
                  task.assignedTo === 'me' ? t('couple.you') :
                  task.assignedTo === 'partner' ? partnerName :
                  t('couple.assignToBoth')
                }
              </p>
            </div>

            <button
              onClick={handleUnshare}
              disabled={sharing}
              className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
            >
              {sharing ? t('couple.unsharing') : t('couple.unshareTask')}
            </button>
          </div>
        ) : (
          /* Share Options */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('couple.assignTo')}
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setAssignedTo('both')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    assignedTo === 'both'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300'
                  }`}
                >
                  <Users className="w-5 h-5 text-blue-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('couple.assignToBoth')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('couple.collaborativeTask')}
                    </p>
                  </div>
                  {assignedTo === 'both' && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setAssignedTo('me')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    assignedTo === 'me'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300'
                  }`}
                >
                  <User className="w-5 h-5 text-green-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('couple.assignToMe')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('couple.yourResponsibility')}
                    </p>
                  </div>
                  {assignedTo === 'me' && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setAssignedTo('partner')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    assignedTo === 'partner'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300'
                  }`}
                >
                  <User className="w-5 h-5 text-purple-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('couple.assignToPartner', { name: partnerName })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('couple.partnerResponsibility')}
                    </p>
                  </div>
                  {assignedTo === 'partner' && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {sharing ? t('couple.sharing') : t('couple.shareTask')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
