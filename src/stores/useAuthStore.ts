import { create } from 'zustand'
import { getSupabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

let authUnsubscribe: (() => void) | null = null

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialize: () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: () => {
    const supabase = getSupabase()
    if (!supabase) {
      set({ loading: false })
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })

    if (typeof subscription?.unsubscribe === 'function') {
      authUnsubscribe = () => subscription.unsubscribe()
    }
  },

  signOut: async () => {
    if (authUnsubscribe) {
      authUnsubscribe()
      authUnsubscribe = null
    }
    const supabase = getSupabase()
    if (supabase) {
      await supabase.auth.signOut()
    }
    set({ user: null, session: null })
  }
}))
