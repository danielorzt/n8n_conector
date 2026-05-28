import { useState, useRef, useEffect } from 'react'
import {
  Wifi,
  WifiOff,
  Settings,
  User,
  Activity,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'
import type { Language } from '@/i18n/translations'

interface HeaderProps {
  webhookStatus: 'idle' | 'checking' | 'connected' | 'error'
  realtimeConnected?: boolean
  onSettingsClick: () => void
}

const LANG_FLAGS: Record<Language, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
  zh: '🇨🇳',
  de: '🇩🇪',
}

const LANG_LABELS: Record<Language, string> = {
  es: 'ES',
  en: 'EN',
  zh: '中文',
  de: 'DE',
}

export function Header({ webhookStatus, realtimeConnected, onSettingsClick }: HeaderProps) {
  const { theme, language, t, toggleTheme, setLanguage } = useApp()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const langs = (['es', 'en', 'zh', 'de'] as Language[])

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg gradient-primary flex items-center justify-center">
              <Activity className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Nova<span className="text-primary">Sync</span>
            </span>
          </div>
          <span className="hidden sm:inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {t.simulator}
          </span>
          {realtimeConnected && (
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full rounded-full bg-success opacity-75 animate-ping" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              {t.live}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status */}
          <div
            className={cn(
              "hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              webhookStatus === 'connected' && "bg-success/10 text-success",
              webhookStatus === 'error' && "bg-destructive/10 text-destructive",
              webhookStatus === 'checking' && "bg-warning/10 text-warning",
              webhookStatus === 'idle' && "bg-muted text-muted-foreground"
            )}
          >
            {webhookStatus === 'connected' ? (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-success opacity-75 animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                <Wifi className="size-3.5" />
                <span>{t.connected}</span>
              </>
            ) : webhookStatus === 'error' ? (
              <>
                <WifiOff className="size-3.5" />
                <span>{t.noConnection}</span>
              </>
            ) : webhookStatus === 'checking' ? (
              <>
                <Wifi className="size-3.5 animate-pulse" />
                <span>{t.checking}</span>
              </>
            ) : (
              <>
                <WifiOff className="size-3.5" />
                <span>{t.disconnected}</span>
              </>
            )}
          </div>

          {/* Language Switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1 rounded-lg border border-border/50 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              title={t.toggleTheme}
            >
              <span>{LANG_FLAGS[language]}</span>
              <span className="hidden sm:inline">{LANG_LABELS[language]}</span>
              <ChevronDown className={cn('size-3 transition-transform', langOpen && 'rotate-180')} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[8rem] rounded-xl border border-border bg-popover shadow-xl animate-fade-in overflow-hidden">
                {langs.map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); setLangOpen(false) }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted',
                      lang === language && 'text-primary font-medium bg-primary/5'
                    )}
                  >
                    <span>{LANG_FLAGS[lang]}</span>
                    <span>{LANG_LABELS[lang]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={t.toggleTheme}
            className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            title={t.manageCatalog}
            className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
          </button>

          {/* User Avatar */}
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5">
            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{t.admin}</p>
              <p className="text-xs text-muted-foreground">{t.testMode}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
