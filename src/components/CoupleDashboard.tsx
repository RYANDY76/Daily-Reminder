import { useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import CoupleConnect from './CoupleConnect'
import CoupleProfileHeader from './CoupleProfileHeader'
import CoupleGoals from './CoupleGoals'
import LoveNotes from './LoveNotes'
import CoupleActivity from './CoupleActivity'
import CoupleStats from './CoupleStats'
import FloatingLoveNoteButton from './FloatingLoveNoteButton'
import { Heart, Target, MessageCircle, TrendingUp } from 'lucide-react'
import { useT } from '../i18n'

export default function CoupleDashboard() {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const goals = useCoupleStore(s => s.goals)
  const loveNotes = useCoupleStore(s => s.loveNotes)
  const activityFeed = useCoupleStore(s => s.activityFeed)
  const loadConnection = useCoupleStore(s => s.loadConnection)
  const loadGoals = useCoupleStore(s => s.loadGoals)
  const loadLoveNotes = useCoupleStore(s => s.loadLoveNotes)
  const loadActivityFeed = useCoupleStore(s => s.loadActivityFeed)

  // Load connection on mount
  useEffect(() => {
    if (currentProfile) {
      loadConnection(currentProfile.id)
    }
  }, [currentProfile?.id])

  // Load all couple data when connected
  useEffect(() => {
    if (connection && connection.status === 'active' && currentProfile) {
      loadGoals()
      loadLoveNotes(currentProfile.id)
      loadActivityFeed()
    }
  }, [connection?.id, connection?.status, currentProfile?.id])

  return (
    <>
      <div className="space-y-5 pb-32 md:pb-0">
        {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          {t('couple.coupleSpace')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('couple.sharedJourney')}
        </p>
      </div>

      {/* Connection Status */}
      <CoupleConnect />

      {/* Features Grid - Only show if connected */}
      {connection && connection.status === 'active' && (
        <>
          {/* Couple Profile Header */}
          <CoupleProfileHeader />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-pink-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('couple.loveNotes')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{loveNotes.length}</p>
              {loveNotes.filter(n => !n.read && n.toProfileId === currentProfile?.id).length > 0 && (
                <span className="text-xs text-pink-500 font-medium">
                  {loveNotes.filter(n => !n.read && n.toProfileId === currentProfile?.id).length} {t('common.new')}
                </span>
              )}
            </div>
            
            <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('couple.coupleGoals')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
              {goals.filter(g => !g.completed).length > 0 && (
                <span className="text-xs text-purple-500 font-medium">
                  {goals.filter(g => !g.completed).length} {t('goals.active')}
                </span>
              )}
            </div>

            <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('couple.activities')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activityFeed.length}
              </p>
            </div>

            <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('couple.daysTogether')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.floor((Date.now() - connection.connectedAt) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
          </div>

          {/* Couple Goals Section */}
          <CoupleGoals />

          {/* Couple Statistics Section */}
          <CoupleStats />

          {/* Love Notes Section */}
          <LoveNotes />

          {/* Activity Feed Section */}
          <CoupleActivity />
        </>
      )}
      </div>

      {/* Floating Love Note Button */}
      <FloatingLoveNoteButton />
    </>
  )
}
