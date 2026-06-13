const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

function getRating(metric: string, value: number): WebVitalMetric['rating'] {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  }
  const t = thresholds[metric]
  if (!t) return 'needs-improvement'
  if (value <= t.good) return 'good'
  if (value <= t.poor) return 'needs-improvement'
  return 'poor'
}

function sendToAnalytics(metric: WebVitalMetric) {
  if (!SENTRY_DSN) return

  try {
    fetch(`${SENTRY_DSN}/api/envelope/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: crypto.randomUUID(),
        sent_at: new Date().toISOString(),
        metrics: [{
          type: 'webvital',
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now()
        }]
      })
    })
  } catch {
    if (import.meta.env.DEV) console.warn('[WebVitals] send failed')
  }

  if (import.meta.env.DEV) {
    console.log(`[WebVital] ${metric.name}: ${metric.value} (${metric.rating})`)
  }
}

export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  const observerMap = new Map<string, PerformanceObserver>()

  function observe(type: string, entryType: string, mapFn: (entry: PerformanceEntry) => WebVitalMetric) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) sendToAnalytics(mapFn(last))
      })
      observer.observe({ type, buffered: true })
      observerMap.set(entryType, observer)
    } catch {
      if (import.meta.env.DEV) console.warn('[WebVitals] type not supported')
    }
  }

  observe('largest-contentful-paint', 'LCP', (entry) => ({
    name: 'LCP',
    value: entry.startTime,
    rating: getRating('LCP', entry.startTime)
  }))

  observe('first-input', 'FID', (entry) => ({
    name: 'FID',
    value: (entry as PerformanceEventTiming).processingStart - entry.startTime,
    rating: getRating('FID', (entry as PerformanceEventTiming).processingStart - entry.startTime)
  }))

  observe('layout-shift', 'CLS', (entry) => {
    const clsEntry = entry as unknown as { value: number }
    return {
      name: 'CLS',
      value: clsEntry.value,
      rating: getRating('CLS', clsEntry.value)
    }
  })

  observe('paint', 'FCP', (entry) => {
    if (entry.name === 'first-contentful-paint') {
      return {
        name: 'FCP',
        value: entry.startTime,
        rating: getRating('FCP', entry.startTime)
      }
    }
    return { name: '', value: 0, rating: 'good' as const }
  })

  if ('addEventListener' in window) {
    window.addEventListener('load', () => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navEntry) {
        sendToAnalytics({
          name: 'TTFB',
          value: navEntry.responseStart,
          rating: getRating('TTFB', navEntry.responseStart)
        })
      }
    })
  }
}
