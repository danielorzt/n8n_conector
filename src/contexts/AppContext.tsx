import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, type Language, type Translations } from '@/i18n/translations'

export type Theme = 'dark' | 'light'

interface AppContextValue {
  theme: Theme
  language: Language
  t: Translations
  toggleTheme: () => void
  setLanguage: (lang: Language) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const THEME_KEY = 'novasync_theme'
const LANG_KEY = 'novasync_lang'

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem(THEME_KEY) as Theme) || 'dark'
  )
  const [language, setLanguageState] = useState<Language>(() =>
    (localStorage.getItem(LANG_KEY) as Language) || 'es'
  )

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANG_KEY, lang)
  }

  const t = translations[language]

  return (
    <AppContext.Provider value={{ theme, language, t, toggleTheme, setLanguage }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppContextProvider')
  return ctx
}
