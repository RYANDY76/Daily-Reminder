import { useNotifications } from '../../hooks/useNotifications'
import { useDndDetection } from '../../hooks/useDndDetection'
import { Bell, BellOff, Clock, Moon } from 'lucide-react'
import { useT } from '../../i18n'

export default function NotificationSettings() {
  const t = useT()
  const { prefs, updatePrefs, permission, requestPermission } = useNotifications()
  const { isDnd, setDnd } = useDndDetection()

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      const ok = await requestPermission()
      if (!ok) return
    }
    updatePrefs({ enabled })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {prefs.enabled ? (
            <Bell className="w-5 h-5 text-primary-500" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.notifications')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {permission === 'denied' ? 'Notifikasi diblokir browser' : t('settings.notificationsDesc')}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleToggle(!prefs.enabled)}
          disabled={permission === 'denied'}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            prefs.enabled ? 'bg-primary-500' : 'bg-gray-300'
          } disabled:opacity-50`}
          aria-label={t('settings.notifications')}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            prefs.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {prefs.enabled && (
        <div className="space-y-3 pl-8">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('settings.notifTaskReminders')}</label>
            <button
              onClick={() => updatePrefs({ taskReminders: !prefs.taskReminders })}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                prefs.taskReminders ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                prefs.taskReminders ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('settings.notifDailySummary')}</label>
            <button
              onClick={() => updatePrefs({ dailySummary: !prefs.dailySummary })}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                prefs.dailySummary ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                prefs.dailySummary ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {prefs.dailySummary && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <input
                type="time"
                value={`${String(prefs.summaryHour).padStart(2, '0')}:${String(prefs.summaryMinute).padStart(2, '0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  updatePrefs({ summaryHour: h, summaryMinute: m })
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-500" />
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Jangan Ganggu</label>
            </div>
            <button
              onClick={() => setDnd(!isDnd)}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                isDnd ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isDnd ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Notifikasi diblokir. Izinkan melalui pengaturan browser.
        </p>
      )}
    </div>
  )
}
