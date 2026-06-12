const attemptMap = new Map<string, { count: number; until: number }>()

export function checkRateLimit(
  key: string,
  windowMs: number = 30000
): boolean {
  const now = Date.now()
  const entry = attemptMap.get(key)
  if (entry && now < entry.until) return false
  if (!entry || now - entry.until > windowMs) {
    attemptMap.set(key, { count: 0, until: 0 })
    return true
  }
  return true
}

export function recordAttempt(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = attemptMap.get(key) || { count: 0, until: 0 }
  if (now < entry.until) return { allowed: false, remaining: 0 }
  entry.count++
  if (entry.count >= 5) {
    entry.until = now + 120000
    entry.count = 0
  }
  attemptMap.set(key, entry)
  return { allowed: true, remaining: 5 - entry.count }
}

export function getRemainingAttempts(key: string): number {
  const now = Date.now()
  const entry = attemptMap.get(key)
  if (!entry || now > entry.until) return 5
  if (now < entry.until) return 0
  return 5 - entry.count
}

export function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = attemptMap.get(key)
  return !!entry && now < entry.until
}
