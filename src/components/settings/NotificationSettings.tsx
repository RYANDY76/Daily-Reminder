import { useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useNotifications } from '../../hooks/useNotifications'
import { useT } from '../../i18n'
import { Bell, Smartphone } from 'lucide-react'
import { isWebPushSupported, isWebPushSubscribed, subscribeToWebPush, unsubscribeFromWebPush } from '../../services/webPush'
import { sendTestPush } from '../../services/pushNotifications'
import { useAuthStore } from '../../stores/useAuthStore'

export default function NotificationSettings() {
  const t = useT()
  const { toggleNotifications } = useNotifications()
  const notificationEnabled = useAppStore((s) => s.notificationEnabled)
  const reminderLeadMinutes = useAppStore((s) => s.reminderLeadMinutes)
  const setReminderLeadMinutes = useAppStore((s) => s.setReminderLeadMinutes)
  const addToast = useAppStore((s) => s.addToast)
  const leadOptions = [0, 5, 10, 15, 30, 60]
  const [webPushOn, setWebPushOn] = useState(isWebPushSubscribed())
  const [testingPush, setTestingPush] = useState(false)
  const session = useAuthStore((s) => s.session)
  const pushSupported = isWebPushSupported()
  const vapidConfigured = !!import.meta.env.VITE_VAPID_PUBLIC_KEY

  const toggleWebPush = async () => {
    if (webPushOn) {
      await unsubscribeFromWebPush()
      setWebPushOn(false)
      addToast({ id: crypto.randomUUID(), message: t('settings.webPushOff'), type: 'info', duration: 3000 })
    } else {
      const result = await subscribeToWebPush()
      setWebPushOn(result.ok)
      const msg = result.ok ? t('settings.webPushOn')
        : result.error === 'login_required' ? t('settings.webPushLoginRequired')
        : result.error === 'no_vapid' ? t('settings.webPushNoVapid')
        : t('settings.webPushFailed')
      addToast({
        id: crypto.randomUUID(),
        message: msg,
        type: result.ok ? 'success' : 'error',
        duration: 4000
      })
    }
  }

  const handleTestPush = async () => {
    setTestingPush(true)
    const result = await sendTestPush()
    setTestingPush(false)
    addToast({
      id: crypto.randomUUID(),
      message: result.ok ? t('settings.webPushTestOk') : (result.error || t('settings.webPushFailed')),
      type: result.ok ? 'success' : 'error',
      duration: 4000
    })
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-dark-border">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.notifications')}</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.taskReminder')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.notificationsDesc')}</p>
          </div>
          <button
            onClick={toggleNotifications}
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ease-in-out ${
              notificationEnabled ? 'bg-primary-500' : 'bg-gray-300'
            }`}
            aria-label={t('settings.toggleNotif')}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out ${
                notificationEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {!notificationEnabled && (
          <div className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
            <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">{t('settings.notifWarning')}</p>
          </div>
        )}

        {pushSupported && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                {t('settings.webPush')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {vapidConfigured ? t('settings.webPushDesc') : t('settings.webPushNoVapid')}
              </p>
            </div>
            <button
              onClick={toggleWebPush}
              disabled={!vapidConfigured}
              className={`relative w-12 h-7 rounded-full transition-colors ${webPushOn ? 'bg-primary-500' : 'bg-gray-300'} disabled:opacity-40`}
              aria-label={t('settings.webPush')}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${webPushOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        )}

        {webPushOn && session && vapidConfigured && (
          <button
            onClick={handleTestPush}
            disabled={testingPush}
            className="w-full py-2.5 rounded-xl border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 transition-colors"
          >
            {testingPush ? t('common.loading') : t('settings.webPushTest')}
          </button>
        )}

        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('settings.reminderLead')}</p>
          <div className="grid grid-cols-3 gap-2">
            {leadOptions.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setReminderLeadMinutes(minutes)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-tap ${
                  reminderLeadMinutes === minutes
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-surface'
                }`}
              >
                {minutes === 0 ? t('settings.reminderAtTime') : t('settings.reminderMinutesBefore', { minutes })}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
