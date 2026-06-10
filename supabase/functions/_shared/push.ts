import webpush from 'npm:web-push@3.6.7'

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

let vapidReady = false

export function ensureVapid(): void {
  if (vapidReady) return
  const subject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@daily-reminder.app'
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets required')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidReady = true
}

export async function sendPushToSubscription(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<void> {
  ensureVapid()
  await webpush.sendNotification(subscription, JSON.stringify(payload))
}

export function getLocalTimeParts(timeZone = Deno.env.get('REMINDER_TIMEZONE') || 'Asia/Jakarta'): {
  date: string
  minutes: number
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date())

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '0'
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const minutes = Number(get('hour')) * 60 + Number(get('minute'))
  return { date, minutes }
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = (time || '00:00').split(':').map(Number)
  return h * 60 + (m || 0)
}
