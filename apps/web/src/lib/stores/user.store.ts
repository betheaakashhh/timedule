import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, Theme } from '@timeflow/types'

interface UserStore {
  user: UserProfile | null
  theme: Theme
  setUser: (user: UserProfile | null) => void
  setTheme: (theme: Theme) => void
  updateStreak: (count: number) => void
  updateLevel: (points: number) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      theme: 'light',

      setUser: (user) => {
        set({ user, theme: user?.theme ?? 'light' })
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', user?.theme === 'dark')
        }
      },

      setTheme: (theme) => {
        set((s) => ({
          theme,
          user: s.user ? { ...s.user, theme } : null,
        }))
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark')
        }
      },

      updateStreak: (count) =>
        set((s) => ({
          user: s.user ? { ...s.user, streakCount: count } : null,
        })),

      updateLevel: (points) =>
        set((s) => ({
          user: s.user ? { ...s.user, levelToday: points } : null,
        })),
    }),
    {
      name: 'timeflow-user',
      partialize: (s) => ({ theme: s.theme }),
    }
  )
)
