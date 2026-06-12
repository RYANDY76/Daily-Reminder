import { useState, useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useToast } from '../hooks/useToast'
import { useT } from '../i18n'
import { Heart, Send, Mail, MailOpen, X, Smile, Star, Gift, Sparkles, Flower2, PartyPopper } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const LOVE_ICON_MAP: Record<string, LucideIcon> = {
  Heart, Star, Gift, Sparkles, Flower2, PartyPopper,
}
const LOVE_ICON_NAMES = Object.keys(LOVE_ICON_MAP)

function LoveIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && LOVE_ICON_MAP[name as keyof typeof LOVE_ICON_MAP]) || Heart
  return <Icon className={className || 'w-5 h-5'} />
}

export default function LoveNotes() {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const loveNotes = useCoupleStore(s => s.loveNotes)
  const loadLoveNotes = useCoupleStore(s => s.loadLoveNotes)
  const sendLoveNote = useCoupleStore(s => s.sendLoveNote)
  const markNoteRead = useCoupleStore(s => s.markNoteRead)
  const getPartnerName = useCoupleStore(s => s.getPartnerName)
  const getPartnerId = useCoupleStore(s => s.getPartnerId)
  const { success } = useToast()
  
  const [showSendModal, setShowSendModal] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('Heart')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (currentProfile) {
      loadLoveNotes(currentProfile.id)
    }
  }, [currentProfile, loadLoveNotes])

  if (!connection || connection.status !== 'active') {
    return (
      <div className="card p-8 text-center">
        <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          {t('couple.connectDesc')}
        </p>
      </div>
    )
  }

  const partnerName = getPartnerName(currentProfile?.id || '')
  const partnerId = getPartnerId(currentProfile?.id || '')
  const unreadCount = loveNotes.filter(n => n.toProfileId === currentProfile?.id && !n.read).length

  const handleSendNote = async () => {
    if (!message.trim() || !currentProfile) return

    setSending(true)
    try {
      await sendLoveNote({
        coupleId: connection.id,
        fromProfileId: currentProfile.id,
        toProfileId: partnerId,
        message: message.trim(),
        emoji: selectedEmoji
      })

      // Reload love notes to show the new one immediately
      await loadLoveNotes(currentProfile.id)
      success(t('couple.noteSent'))
      setShowSendModal(false)
      setMessage('')
      setSelectedEmoji('Heart')
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to send love note:', error)
    } finally {
      setSending(false)
    }
  }

  const handleMarkRead = async (noteId: string) => {
    await markNoteRead(noteId)
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return t('couple.activityJustNow')
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return t('couple.activityMinutesAgo', { min: minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t('couple.activityHoursAgo', { h: hours })
    const days = Math.floor(hours / 24)
    return t('couple.activityDaysAgo', { d: days })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            {t('couple.loveNotes')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('couple.loveNotesDesc')}
          </p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {t('couple.sendNote')}
        </button>
      </div>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500 rounded-lg">
          <p className="text-sm text-pink-700 dark:text-pink-300 font-medium flex items-center gap-1">
            <Heart className="w-4 h-4 fill-pink-500" />
            {t('couple.unreadNotes', { count: unreadCount })}
          </p>
        </div>
      )}

      {/* Notes List */}
      {loveNotes.length > 0 ? (
        <div className="space-y-3">
          {loveNotes.map(note => {
            const isReceived = note.toProfileId === currentProfile?.id
            
            return (
              <div
                key={note.id}
                className={`card p-5 transition-all ${
                  isReceived && !note.read
                    ? 'bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/10 dark:to-red-900/10 border-2 border-pink-200 dark:border-pink-800'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Emoji Icon */}
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center">
                    <LoveIcon name={note.emoji} className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isReceived ? (
                        <>
                          <MailOpen className="w-4 h-4 text-pink-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('couple.from', { name: partnerName })}
                          </span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('couple.to', { name: partnerName })}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(note.createdAt)}
                      </span>
                      {isReceived && !note.read && (
                        <span className="px-2 py-0.5 bg-pink-500 text-white text-xs font-medium rounded-full">
                          {t('common.new')}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-2">
                      {note.message}
                    </p>

                    {isReceived && !note.read && (
                      <button
                        onClick={() => handleMarkRead(note.id)}
                        className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
                      >
                        {t('couple.markRead')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-red-100 dark:from-pink-900/20 dark:to-red-900/20 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('couple.noNotes')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('couple.startSending', { name: partnerName })}
          </p>
          <button
            onClick={() => setShowSendModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-xl font-medium transition-all"
          >
            {t('couple.sendNote')}
          </button>
        </div>
      )}

      {/* Send Love Note Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                {t('couple.sendNote')}
              </h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* To Field */}
              <div className="p-3 bg-pink-50 dark:bg-pink-900/10 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  {t('couple.to', { name: partnerName })}
                  <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                </p>
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('couple.noteEmoji')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center justify-between"
                  >
                    <LoveIcon name={selectedEmoji} className="w-7 h-7 text-pink-500" />
                    <Smile className="w-5 h-5 text-gray-400" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute z-10 mt-2 w-full p-3 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border grid grid-cols-5 gap-2">
                      {LOVE_ICON_NAMES.map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setSelectedEmoji(name)
                            setShowEmojiPicker(false)
                          }}
                          className="hover:scale-125 transition-transform p-2"
                        >
                          <LoveIcon name={name} className="w-6 h-6 text-pink-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('couple.notePlaceholder')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('couple.iLoveYou')}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {message.length}/500
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSendNote}
                  disabled={!message.trim() || sending}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? t('couple.sending') : t('couple.sendNote')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
