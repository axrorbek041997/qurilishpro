import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../i18n'

type Language = 'uz' | 'en' | 'ru'

interface AppState {
  darkMode: boolean
  language: Language
  toggleDarkMode: () => void
  setLanguage: (lang: Language) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: false,
      language: 'uz',

      toggleDarkMode: () => {
        set((s) => {
          const next = !s.darkMode
          document.documentElement.classList.toggle('dark', next)
          return { darkMode: next }
        })
      },

      setLanguage: (lang: Language) => {
        i18n.changeLanguage(lang)
        localStorage.setItem('app-language', lang)
        set({ language: lang })
      },
    }),
    {
      name: 'app-store',
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
        if (state?.language) {
          i18n.changeLanguage(state.language)
        }
      },
    },
  ),
)
