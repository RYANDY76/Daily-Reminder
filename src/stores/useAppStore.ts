import { create } from 'zustand'
import type { Lang, Page, ToastMessage } from '../types'

interface AppState {
  currentPage: Page
  darkMode: boolean
  lang: Lang
  notificationEnabled: boolean
  reminderLeadMinutes: number
  sidebarOpen: boolean
  globalSearchOpen: boolean
  toastQueue: ToastMessage[]
  lastTaskId: string | null
  addTaskRequestId: number
  setPage: (page: Page) => void
  requestAddTask: () => void
  setDarkMode: (dark: boolean) => void
  toggleDarkMode: () => void
  setLang: (lang: Lang) => void
  setNotificationEnabled: (enabled: boolean) => void
  setReminderLeadMinutes: (minutes: number) => void
  setSidebarOpen: (open: boolean) => void
  setGlobalSearchOpen: (open: boolean) => void
  addToast: (toast: ToastMessage) => void
  removeToast: (id: string) => void
  setLastTaskId: (id: string | null) => void
}

const storedLang = (localStorage.getItem('daily_reminder_lang') as Lang) || 'id'
const storedReminderLead = Number(localStorage.getItem('daily_reminder_reminder_lead_minutes') || 0)

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  lang: storedLang,
  notificationEnabled: false,
  reminderLeadMinutes: Number.isFinite(storedReminderLead) ? storedReminderLead : 0,
  sidebarOpen: false,
  globalSearchOpen: false,
  toastQueue: [],
  lastTaskId: null,
  addTaskRequestId: 0,
  setPage: (page) => set({ currentPage: page }),
  requestAddTask: () => set((state) => ({ addTaskRequestId: state.addTaskRequestId + 1 })),
  setDarkMode: (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    set({ darkMode: dark })
  },
  toggleDarkMode: () => {
    set((state) => {
      const newDark = !state.darkMode
      if (newDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { darkMode: newDark }
    })
    // Persist ke profile agar tidak konflik saat refresh
    // Import dinamis untuk menghindari circular dependency
    import('./useProfileStore').then(({ useProfileStore }) => {
      const profile = useProfileStore.getState().currentProfile
      if (profile) {
        const current = useAppStore.getState().darkMode
        useProfileStore.getState().updateProfile({ darkMode: current ? 'dark' : 'light' })
      }
    })
  },
  setLang: (lang) => {
    localStorage.setItem('daily_reminder_lang', lang)
    set({ lang })
  },
  setNotificationEnabled: (enabled) => set({ notificationEnabled: enabled }),
  setReminderLeadMinutes: (minutes) => {
    localStorage.setItem('daily_reminder_reminder_lead_minutes', String(minutes))
    set({ reminderLeadMinutes: minutes })
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  addToast: (toast) => set((state) => ({
    toastQueue: [...state.toastQueue, toast]
  })),
  removeToast: (id) => set((state) => ({
    toastQueue: state.toastQueue.filter(t => t.id !== id)
  })),
  setLastTaskId: (id) => set({ lastTaskId: id })
}))
