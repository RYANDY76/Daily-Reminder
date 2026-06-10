import { create } from 'zustand'
import type { Profile } from '../types'
import { AVATARS } from '../types'
import { getAllProfiles, saveProfile, deleteProfile as deleteProfileDb, getProfile, getProfileByGoogleId } from '../database'
import { hashPin } from '../crypto'
import { useAppStore } from './useAppStore'

interface GoogleUserInfo {
  id: string
  name: string
  email: string
  picture: string
}

interface ProfileState {
  profiles: Profile[]
  currentProfile: Profile | null
  loading: boolean
  showWelcome: boolean
  pinLocked: boolean
  loadProfiles: () => Promise<void>
  createProfile: (name: string, pin: string | null) => Promise<Profile>
  createProfileFromGoogle: (googleInfo: GoogleUserInfo) => Promise<Profile>
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

  createProfile: async (name, pin) => {
    const id = crypto.randomUUID()
    const profile: Profile = {
      id,
      name,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      accentColor: '#1D9E75',
      pin: pin ? await hashPin(pin, id) : null,
      darkMode: 'system',
      googleId: null,
      googleEmail: null,
      googlePhotoUrl: null,
      googleCalendarConnected: false,
      googleCalendarId: null,
      googleAccessToken: null,
      googleRefreshToken: null,
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
      googleCalendarConnected: false,
      googleCalendarId: null,
      googleAccessToken: null,
      googleRefreshToken: null,
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
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', profile.accentColor)
}
