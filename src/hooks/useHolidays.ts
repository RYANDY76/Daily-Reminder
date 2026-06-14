import { useState, useEffect, useCallback, useRef } from 'react'
import type { PublicHoliday } from '../types'

const STORAGE_KEY = 'avora_holidays_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000
const CACHE_VERSION = 2

interface HolidayCache {
  version?: number
  data: PublicHoliday[]
  updatedAt: number
}

const STATIC_HOLIDAYS: PublicHoliday[] = [
  { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', isNational: true },
  { date: '2026-01-16', name: 'Isra Mikraj Nabi Muhammad SAW', isNational: true },
  { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili', isNational: true },
  { date: '2026-03-19', name: 'Hari Suci Nyepi Tahun Baru Saka 1948', isNational: true },
  { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 Hijriyah', isNational: true },
  { date: '2026-03-22', name: 'Hari Raya Idul Fitri 1447 Hijriyah', isNational: true },
  { date: '2026-04-03', name: 'Wafat Yesus Kristus', isNational: true },
  { date: '2026-05-01', name: 'Hari Buruh Internasional', isNational: true },
  { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', isNational: true },
  { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 Hijriyah', isNational: true },
  { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', isNational: true },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila', isNational: true },
  { date: '2026-06-16', name: 'Tahun Baru Islam 1448 Hijriyah', isNational: true },
  { date: '2026-08-17', name: 'Hari Kemerdekaan RI', isNational: true },
  { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', isNational: true },
  { date: '2026-12-25', name: 'Hari Raya Natal', isNational: true },
]

async function fetchMonthHolidays(year: number, month: number): Promise<PublicHoliday[] | null> {
  try {
    const res = await fetch(`https://libur.deno.dev/api?year=${year}&month=${month}`)
    if (!res.ok) return null
    const json = await res.json()
    if (!Array.isArray(json)) return null
    return json
      .filter((item: any) => item.is_national_holiday)
      .map((item: any) => ({
        date: item.date,
        name: item.name,
        isNational: true
      }))
  } catch {
    if (import.meta.env.DEV) console.warn('[Holidays] fetch failed')
    return null
  }
}

function seedStaticData() {
  const existing = getCached()
  if (existing && existing.data.length > 0) return existing.data
  const merged = [...STATIC_HOLIDAYS]
  setCache(merged)
  return merged
}

function getCached(): HolidayCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw) as HolidayCache
    if (cache.version !== CACHE_VERSION) return null
    return cache
  } catch {
    if (import.meta.env.DEV) console.warn('[Holidays] cache parse failed')
    return null
  }
}

function setCache(data: PublicHoliday[]) {
  const cache: HolidayCache = { version: CACHE_VERSION, data, updatedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
}

function isStale(cache: HolidayCache | null): boolean {
  if (!cache) return true
  return Date.now() - cache.updatedAt > CACHE_TTL
}

export function useHolidays(year: number, month: number) {
  const [holidays, setHolidays] = useState<PublicHoliday[]>(() => seedStaticData())
  const [loading, setLoading] = useState(false)
  const fetchingRef = useRef(false)
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    const newHolidays = await fetchMonthHolidays(year, month + 1)
    if (newHolidays !== null) {
      const prev = getCached()
      const existing = prev?.data || []
      const merged = [...existing]
      for (const h of newHolidays) {
        const idx = merged.findIndex(ex => ex.date === h.date)
        if (idx >= 0) merged[idx] = h
        else merged.push(h)
      }
      setCache(merged)
      setHolidays(merged)
    }
    setLoading(false)
    fetchingRef.current = false
  }, [year, month])

  useEffect(() => {
    const prev = getCached()
    const hasMonth = prev?.data.some(h => h.date.startsWith(monthStr))
    if (!hasMonth || isStale(prev)) {
      refresh()
    }
  }, [year, month, monthStr, refresh])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const prev = getCached()
        if (isStale(prev)) refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [refresh])

  const holidaysForDate = useCallback((dateStr: string): PublicHoliday[] => {
    return holidays.filter(h => h.date === dateStr)
  }, [holidays])

  return { holidays, holidaysForDate, loading }
}
