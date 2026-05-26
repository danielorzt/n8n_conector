import { 
  Wifi, 
  WifiOff, 
  Settings,
  User,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  webhookStatus: 'idle' | 'checking' | 'connected' | 'error'
  onSettingsClick: () => void
}

export function Header({ webhookStatus, onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
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
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Simulador
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                webhookStatus === 'connected' && "bg-success/10 text-success",
                webhookStatus === 'error' && "bg-destructive/10 text-destructive",
                webhookStatus === 'checking' && "bg-warning/10 text-warning",
                webhookStatus === 'idle' && "bg-muted text-muted-foreground"
              )}
            >
              {webhookStatus === 'connected' ? (
                <>
                  <Wifi className="size-3.5" />
                  <span>Conectado</span>
                </>
              ) : webhookStatus === 'error' ? (
                <>
                  <WifiOff className="size-3.5" />
                  <span>Sin conexion</span>
                </>
              ) : webhookStatus === 'checking' ? (
                <>
                  <Wifi className="size-3.5 animate-pulse" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <WifiOff className="size-3.5" />
                  <span>Desconectado</span>
                </>
              )}
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5">
            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="size-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground">Modo prueba</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
