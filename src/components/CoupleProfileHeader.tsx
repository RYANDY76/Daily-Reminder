import { useEffect, useState } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useT } from '../i18n'
import { Heart, Calendar, Gift, Edit2, X, Star } from 'lucide-react'

interface CoupleInfo {
  anniversaryDate?: string
  relationshipTitle?: string
  specialDates?: { name: string; date: string }[]
}

export default function CoupleProfileHeader() {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const getPartnerName = useCoupleStore(s => s.getPartnerName)
  const [showEditModal, setShowEditModal] = useState(false)
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo>({
    anniversaryDate: '',
    relationshipTitle: t('couple.defaultRelationshipTitle'),
    specialDates: []
  })
  const connectionId = connection?.id

  useEffect(() => {
    if (!connectionId) return

    setCoupleInfo({
      anniversaryDate: localStorage.getItem(`couple_anniversary_${connectionId}`) || '',
      relationshipTitle: localStorage.getItem(`couple_title_${connectionId}`) || t('couple.defaultRelationshipTitle'),
      specialDates: []
    })
  }, [connectionId, t])

  if (!connection || connection.status !== 'active' || !currentProfile) {
    return null
  }

  const partnerName = getPartnerName(currentProfile.id)
  const myName = currentProfile.name
  const daysConnected = Math.floor((Date.now() - connection.connectedAt) / (1000 * 60 * 60 * 24))
  const anniversaryKey = `couple_anniversary_${connection.id}`
  const titleKey = `couple_title_${connection.id}`

  // Calculate days until anniversary
  const getDaysUntilAnniversary = () => {
    if (!coupleInfo.anniversaryDate) return null
    
    const today = new Date()
    const anniversary = new Date(coupleInfo.anniversaryDate)
    const thisYearAnniversary = new Date(today.getFullYear(), anniversary.getMonth(), anniversary.getDate())
    
    if (thisYearAnniversary < today) {
      thisYearAnniversary.setFullYear(today.getFullYear() + 1)
    }
    
    const diffTime = thisYearAnniversary.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const handleSave = () => {
    if (coupleInfo.anniversaryDate) {
      localStorage.setItem(anniversaryKey, coupleInfo.anniversaryDate)
    }
    if (coupleInfo.relationshipTitle) {
      localStorage.setItem(titleKey, coupleInfo.relationshipTitle)
    }
    setShowEditModal(false)
  }

  const daysUntilAnniversary = getDaysUntilAnniversary()

  // Gamification logic
  const level = connection.level || 1
  const points = connection.points || 0
  const pointsInCurrentLevel = points % 100
  const progressPercent = pointsInCurrentLevel

  return (
    <>
      <div className="card p-5 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 border-2 border-pink-200 dark:border-pink-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Couple Avatars */}
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white dark:border-dark-card">
                {myName.charAt(0).toUpperCase()}
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white dark:border-dark-card -ml-3">
                {partnerName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Names & Title */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {myName} & {partnerName}
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {coupleInfo.relationshipTitle}
              </p>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 hover:bg-white/50 dark:hover:bg-dark-card/50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white/60 dark:bg-dark-card/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('couple.daysTogether')}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{daysConnected}</p>
          </div>

          {coupleInfo.anniversaryDate && (
            <div className="bg-white/60 dark:bg-dark-card/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-4 h-4 text-pink-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('couple.anniversary')}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {daysUntilAnniversary === 0 ? t('couple.anniversaryToday') :
                 daysUntilAnniversary === 1 ? t('couple.anniversaryTomorrow') :
                 t('couple.anniversaryDays', { days: daysUntilAnniversary || 0 })}
              </p>
            </div>
          )}

          <div className="bg-white/60 dark:bg-dark-card/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Level {level}</span>
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{pointsInCurrentLevel}/100</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                {t('couple.info')}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('couple.relationshipTitle')}
                </label>
                <input
                  type="text"
                  value={coupleInfo.relationshipTitle}
                  onChange={(e) => setCoupleInfo({ ...coupleInfo, relationshipTitle: e.target.value })}
                  placeholder={t('couple.relationshipTitlePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('couple.anniversaryDate')}
                </label>
                <input
                  type="date"
                  value={coupleInfo.anniversaryDate}
                  onChange={(e) => setCoupleInfo({ ...coupleInfo, anniversaryDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('couple.anniversaryReminder')}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
