import { useState, useEffect } from 'react'
import { X, Image as ImageIcon, Send, MessageSquare } from 'lucide-react'
import type { Task } from '../types'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useTaskStore } from '../stores/useTaskStore'
import { useT } from '../i18n'
import type { TaskComment } from '../types-couple'
import { getTaskComments, saveTaskComment } from '../database-couple'

interface TaskDetailsModalProps {
  task: Task
  onClose: () => void
}

export default function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const updateTask = useTaskStore(s => s.updateTask)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<TaskComment[]>([])
  
  useEffect(() => {
    if (!connection?.id) {
      setComments([])
      return
    }

    getTaskComments(connection.id, task.id).then((items) => {
      setComments(items)
      updateTask(task.id, { commentCount: items.length })
    })
  }, [connection?.id, task.id, updateTask])

  const handleSendComment = async () => {
    if (!commentText.trim() || !currentProfile || !connection) return
    const newComment: TaskComment = {
      id: crypto.randomUUID(),
      coupleId: connection.id,
      taskId: task.id,
      profileId: currentProfile.id,
      profileName: currentProfile.name,
      text: commentText.trim(),
      createdAt: Date.now()
    }

    await saveTaskComment(newComment)
    const nextComments = [...comments, newComment]
    setComments(nextComments)
    await updateTask(task.id, { commentCount: nextComments.length })
    setCommentText('')
  }

  // Handle Photo Attachment
  const handlePhotoUpload = () => {
    const url = prompt(t('taskDetails.photoUrlPlaceholder'))
    if (url && url.startsWith('http')) {
      updateTask(task.id, { attachmentUrl: url })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-surface rounded-t-2xl">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            {t('taskDetails.title')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-gray-100 dark:bg-dark-bg p-3 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
            {task.notes && <p className="text-sm text-gray-500 mt-1">{task.notes}</p>}
          </div>

          {/* Photo Attachment Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('taskDetails.photoProof')}</h3>
            {task.attachmentUrl ? (
              <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
                <img src={task.attachmentUrl} alt={t('taskDetails.altProof')} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={handlePhotoUpload} className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-900">{t('taskDetails.changePhoto')}</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handlePhotoUpload}
                className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:text-purple-500 hover:border-purple-500 transition-colors"
              >
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">{t('taskDetails.addPhoto')}</span>
              </button>
            )}
          </div>

          <hr className="border-gray-100 dark:border-dark-border" />

          {/* Comments List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('taskDetails.partnerComment')}</h3>
            {comments.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">{t('taskDetails.noComment')}</p>
            ) : (
              comments.map(c => {
                const isMe = c.profileId === currentProfile?.id;
                return (
                  <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-purple-500 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none'}`}>
                      {!isMe && <p className="text-xs font-bold mb-0.5 opacity-70">{c.profileName}</p>}
                      <p className="text-sm">{c.text}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card rounded-b-2xl flex items-end gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder={t('taskDetails.writeMessage')}
            className="flex-1 bg-gray-100 dark:bg-dark-bg border border-transparent focus:border-purple-500 focus:bg-white dark:focus:bg-dark-surface rounded-full px-4 py-2.5 outline-none text-sm text-gray-900 dark:text-white transition-all"
          />
          <button 
            onClick={handleSendComment}
            disabled={!commentText.trim()}
            className="p-2.5 rounded-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
