const ANALYTICS_KEY = 'daily_reminder_analytics'
const ANALYTICS_ENABLED_KEY = 'daily_reminder_analytics_enabled'

interface AnalyticsEvent {
  name: string
  page: string
  timestamp: number
  metadata?: Record<string, string>
}

export function isAnalyticsEnabled(): boolean {
  return localStorage.getItem(ANALYTICS_ENABLED_KEY) !== 'false'
}

export function setAnalyticsEnabled(enabled: boolean): void {
  localStorage.setItem(ANALYTICS_ENABLED_KEY, String(enabled))
}

function getEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]')
  } catch {
    return []
  }
}

export function trackEvent(name: string, metadata?: Record<string, string>): void {
  if (!isAnalyticsEnabled()) return
  const events = getEvents()
  events.push({
    name,
    page: window.location.hash || '/',
    timestamp: Date.now(),
    metadata
  })
  // Keep last 500 events
  if (events.length > 500) events.splice(0, events.length - 500)
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events))
}

export function trackPageView(page: string): void {
  trackEvent('page_view', { page })
}


