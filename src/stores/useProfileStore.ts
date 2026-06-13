import { create } from 'zustand'
import type { Profile } from '../types'
import { getAllProfiles, saveProfile, deleteProfile as deleteProfileDb, getProfile, getProfileByGoogleId, getProfileBySupabaseId } from '../database'
import { hashPin } from '../crypto'
import { getSupabase } from '../lib/supabase'
import type { GoogleUserInfo } from '../hooks/useGoogleAuth'

interface ProfileState {
  profiles: Profile[]
  currentProfile: Profile | null
  loading: boolean
  showWelcome: boolean
  pinLocked: boolean
  loadProfiles: () => Promise<void>
  createProfile: (name: string, pin: string | null, consentGiven?: boolean) => Promise<Profile>
  createProfileFromGoogle: (googleInfo: GoogleUserInfo) => Promise<Profile>
  createProfileFromSupabase: (supabaseUserId: string, email: string) => Promise<Profile>
  switchProfile: (profileId: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  removeProfile: (profileId: string) => Promise<void>
  setCurrentProfile: (profile: Profile) => void
  unlockProfile: () => void
  lockProfile: () => void
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  currentProfile: null,
  loading: true,
  showWelcome: false,
  pinLocked: false,

  loadProfiles: async () => {
    const profiles = await getAllProfiles()
    const lastProfileId = localStorage.getItem('daily_reminder_last_profile')
    const lastProfile = lastProfileId ? profiles.find(p => p.id === lastProfileId) : null
    const currentProfile = lastProfile || profiles[0] || null
    set({
      profiles,
      currentProfile,
      loading: false,
      showWelcome: profiles.length === 0,
      pinLocked: currentProfile?.pin ? true : false
    })
    if (currentProfile) {
      applyProfileTheme(currentProfile)
    }
  },

  createProfile: async (name, pin, consentGiven = false) => {
    const id = crypto.randomUUID()
    const profile: Profile = {
      id,
      name,
      avatar: '',
      accentColor: '#1D9E75',
      pin: pin ? await hashPin(pin, id) : null,
      darkMode: 'system',
      googleId: null,
      googleEmail: null,
      googlePhotoUrl: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      supabaseUserId: null,
      biometricEnabled: false,
      biometricCredentialId: null,
      consentGiven,
      createdAt: Date.now(),
      lastSyncAt: null
    }
    await saveProfile(profile)
    const profiles = await getAllProfiles()
    localStorage.setItem('daily_reminder_last_profile', profile.id)
    applyProfileTheme(profile)
    set({ profiles, currentProfile: profile, showWelcome: false, pinLocked: false })
    return profile
  },

  createProfileFromGoogle: async (googleInfo) => {
    const existing = await getProfileByGoogleId(googleInfo.id)
    if (existing) {
      localStorage.setItem('daily_reminder_last_profile', existing.id)
      applyProfileTheme(existing)
      const profiles = await getAllProfiles()
      set({ profiles, currentProfile: existing, showWelcome: false, pinLocked: existing.pin ? true : false })
      return existing
    }

    const photoUrl = googleInfo.picture?.startsWith('http') ? googleInfo.picture : `https://lh3.googleusercontent.com${googleInfo.picture}`
    const profile: Profile = {
      id: crypto.randomUUID(),
      name: googleInfo.name,
      avatar: photoUrl,
      accentColor: '#1D9E75',
      pin: null,
      darkMode: 'system',
      googleId: googleInfo.id,
      googleEmail: googleInfo.email,
      googlePhotoUrl: photoUrl,
      googleAccessToken: null,
      googleRefreshToken: null,
      supabaseUserId: null,
      biometricEnabled: false,
      biometricCredentialId: null,
      consentGiven: true,
      createdAt: Date.now(),
      lastSyncAt: null
    }
    await saveProfile(profile)
    const profiles = await getAllProfiles()
    localStorage.setItem('daily_reminder_last_profile', profile.id)
    applyProfileTheme(profile)
    set({ profiles, currentProfile: profile, showWelcome: false, pinLocked: false })
    return profile
  },

  createProfileFromSupabase: async (supabaseUserId, email) => {
    const existing = await getProfileBySupabaseId(supabaseUserId)
    if (existing) {
      if (!existing.consentGiven) {
        existing.consentGiven = true
        await saveProfile(existing)
      }
      localStorage.setItem('daily_reminder_last_profile', existing.id)
      applyProfileTheme(existing)
      const profiles = await getAllProfiles()
      set({ profiles, currentProfile: existing, showWelcome: false, pinLocked: existing.pin ? true : false })
      return existing
    }

    const name = email.split('@')[0]
    const profile: Profile = {
      id: crypto.randomUUID(),
      name,
      avatar: '',
      accentColor: '#1D9E75',
      pin: null,
      darkMode: 'system',
      googleId: null,
      googleEmail: null,
      googlePhotoUrl: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      supabaseUserId,
      biometricEnabled: false,
      biometricCredentialId: null,
      consentGiven: true,
      createdAt: Date.now(),
      lastSyncAt: null
    }
    await saveProfile(profile)
    const profiles = await getAllProfiles()
    localStorage.setItem('daily_reminder_last_profile', profile.id)
    applyProfileTheme(profile)
    set({ profiles, currentProfile: profile, showWelcome: false, pinLocked: false })
    return profile
  },

  switchProfile: async (profileId) => {
    const profile = await getProfile(profileId)
    if (!profile) return

    localStorage.setItem('daily_reminder_last_profile', profileId)
    if (profile.pin) {
      set({ currentProfile: profile, pinLocked: true })
    } else {
      applyProfileTheme(profile)
      set({ currentProfile: profile, pinLocked: false })
    }
  },

  updateProfile: async (updates) => {
    const { currentProfile } = get()
    if (!currentProfile) return
    const updated = { ...currentProfile, ...updates }
    await saveProfile(updated)
    if (updates.darkMode !== undefined || updates.accentColor) {
      applyProfileTheme(updated)
    }
    set({ currentProfile: updated })
  },

  removeProfile: async (profileId) => {
    await deleteProfileDb(profileId)
    // Cascade delete from Supabase cloud if configured
    try {
      const sb = getSupabase()
      if (sb) {
        const tables = ['app_tasks', 'app_daily_history', 'app_habits', 'app_mood_logs', 'app_pomodoro_sessions', 'app_goals', 'app_profiles']
        for (const table of tables) {
          try {
            await sb.from(table).delete().eq('id', profileId).maybeSingle()
          } catch { if (import.meta.env.DEV) console.warn('[Profile] cloud table delete failed') }
        }
      }
    } catch { if (import.meta.env.DEV) console.warn('[Profile] cloud cascade delete failed') }
    const profiles = await getAllProfiles()
    if (profiles.length === 0) {
      set({ profiles: [], currentProfile: null, showWelcome: true })
    } else {
      const next = profiles[0]
      localStorage.setItem('daily_reminder_last_profile', next.id)
      applyProfileTheme(next)
      set({ profiles, currentProfile: next })
    }
  },

  setCurrentProfile: (profile) => {
    set({ currentProfile: profile })
  },

  unlockProfile: () => {
    set({ pinLocked: false })
  },

  lockProfile: () => {
    set({ pinLocked: true })
  }
}))

function applyProfileTheme(profile: Profile) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  const isDark = profile.darkMode === 'dark' || (profile.darkMode === 'system' && prefersDark)
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  // Sync store to match actual DOM state
  import('./useAppStore').then(({ useAppStore }) => {
    useAppStore.getState().setDarkMode(isDark)
  })
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', profile.accentColor)
}
