import { useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useT } from '../i18n'
import type { ActivityFeedItem } from '../types-couple'
import { 
  Activity, 
  CheckCircle, 
  Target, 
  Heart, 
  TrendingUp,
  Flag
} from 'lucide-react'

export default function CoupleActivity() {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const activityFeed = useCoupleStore(s => s.activityFeed)
  const loadActivityFeed = useCoupleStore(s => s.loadActivityFeed)

  useEffect(() => {
    if (connection) {
      loadActivityFeed()
    }
  }, [connection, loadActivityFeed])

  if (!connection || connection.status !== 'active') {
    return (
      <div className="card p-8 text-center">
        <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          {t('couple.connectDesc')}
        </p>
      </div>
    )
  }

  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'goal_achieved':
        return <Target className="w-5 h-5 text-purple-500" />
      case 'milestone_reached':
        return <Flag className="w-5 h-5 text-blue-500" />
      case 'love_note_sent':
        return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
      case 'streak_achieved':
        return <TrendingUp className="w-5 h-5 text-orange-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getActivityColor = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'task_completed':
        return 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
      case 'goal_achieved':
        return 'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10'
      case 'milestone_reached':
        return 'from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10'
      case 'love_note_sent':
        return 'from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10'
      case 'streak_achieved':
        return 'from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10'
      default:
        return 'from-gray-50 to-slate-50 dark:from-gray-900/10 dark:to-slate-900/10'
    }
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

  const getProfileName = (profileId: string) => {
    if (profileId === currentProfile?.id) return t('couple.you')
    return useCoupleStore.getState().getPartnerName(currentProfile?.id || '')
  }

  const getActivityTitle = (item: ActivityFeedItem) => {
    const goalTitle = item.metadata?.goalTitle || ''
    const taskTitle = item.metadata?.taskTitle || ''

    if (item.title === 'activity.goalCreated') {
      return t('couple.activityGoalCreated', { title: goalTitle })
    }
    if (item.title === 'activity.goalCompleted') {
      return t('couple.activityGoalCompleted', { title: goalTitle })
    }
    if (item.title === 'activity.loveNoteSent') {
      return t('couple.activityLoveNoteSent')
    }
    if (item.title === 'activity.taskShared') {
      return t('couple.activityTaskShared', { title: taskTitle })
    }

    return item.title
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500" />
          {t('couple.activity')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('couple.activityDesc')}
        </p>
      </div>

      {/* Activity Feed */}
      {activityFeed.length > 0 ? (
        <div className="space-y-3">
          {activityFeed.map((item, index) => (
            <div
              key={item.id}
              className={`card p-4 bg-gradient-to-r ${getActivityColor(item.type)} animate-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-white dark:bg-dark-card shadow-sm flex items-center justify-center">
                  {getActivityIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-0.5">
                    {getActivityTitle(item)}
                  </p>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {getProfileName(item.profileId)} · {formatTimeAgo(item.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('couple.noActivity')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('couple.activityPlaceholder')}
          </p>
        </div>
      )}
    </div>
  )
}
