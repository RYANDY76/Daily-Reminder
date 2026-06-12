import { useState } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useToast } from '../hooks/useToast'
import { useT } from '../i18n'
import { Heart, Send, X, Smile, Star, Gift, Sparkles, Flower2, PartyPopper } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const LOVE_ICON_MAP: Record<string, LucideIcon> = {
  Heart, Star, Gift, Sparkles, Flower2, PartyPopper,
}
const LOVE_ICON_NAMES = Object.keys(LOVE_ICON_MAP)

function LoveIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && LOVE_ICON_MAP[name as keyof typeof LOVE_ICON_MAP]) || Heart
  return <Icon className={className || 'w-5 h-5'} />
}

export default function FloatingLoveNoteButton() {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const sendLoveNote = useCoupleStore(s => s.sendLoveNote)
  const getPartnerName = useCoupleStore(s => s.getPartnerName)
  const getPartnerId = useCoupleStore(s => s.getPartnerId)
  const { success, error: showError } = useToast()
  
  const [showModal, setShowModal] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('Heart')
  const [sending, setSending] = useState(false)

  if (!connection || connection.status !== 'active') {
    return null
  }

  const partnerName = getPartnerName(currentProfile?.id || '')
  const partnerId = getPartnerId(currentProfile?.id || '')

  const handleSend = async () => {
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

      // Reload to show immediately
      const loadLoveNotes = useCoupleStore.getState().loadLoveNotes
      await loadLoveNotes(currentProfile.id)
      
      success(t('couple.noteSent'))
      setShowModal(false)
      setMessage('')
      setSelectedEmoji('Heart')
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to send love note:', error)
      showError(t('couple.noteFailed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label={t('couple.sendLoveNote')}
      >
        <Heart className="w-6 h-6 fill-white" />
      </button>

      {/* Quick Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md p-6 animate-slide-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                {t('couple.quickNote')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {/* To */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('couple.toWithName', { name: partnerName })}
              </div>

              {/* Emoji Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-2xl hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center justify-between"
                >
                  <LoveIcon name={selectedEmoji} className="w-6 h-6 text-pink-500" />
                  <Smile className="w-4 h-4 text-gray-400" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute z-10 mt-2 w-full p-2 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border grid grid-cols-5 gap-1">
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
                        <LoveIcon name={name} className="w-5 h-5 text-pink-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('couple.iLoveYou')}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none text-sm"
              />

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {sending ? t('couple.sending') : t('couple.sendNote')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
