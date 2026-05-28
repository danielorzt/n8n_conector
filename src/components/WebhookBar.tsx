import { useState } from 'react'
import { Link2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'

interface WebhookBarProps {
  webhookUrl: string
  webhookStatus: 'idle' | 'checking' | 'connected' | 'error'
  onUrlChange: (url: string) => void
  onVerify: () => void
}

export function WebhookBar({ webhookUrl, webhookStatus, onUrlChange, onVerify }: WebhookBarProps) {
  const { t } = useApp()
  const [inputValue, setInputValue] = useState(webhookUrl)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUrlChange(inputValue)
    onVerify()
  }

  return (
    <div className="border-b border-border/40 bg-card/50">
      <form onSubmit={handleSubmit} className="flex items-center gap-3 px-6 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link2 className="size-4" />
          <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">{t.webhookLabel}</span>
        </div>

        <div className="relative flex-1">
          <input
            type="url"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => onUrlChange(inputValue)}
            placeholder={t.webhookPlaceholder}
            className={cn(
              "w-full rounded-lg border bg-popover px-4 py-2 text-sm outline-none transition-all",
              "placeholder:text-muted-foreground/50",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              webhookStatus === 'connected' && "border-success/50",
              webhookStatus === 'error' && "border-destructive/50",
              webhookStatus === 'idle' && "border-border"
            )}
          />
        </div>

        <button
          type="submit"
          disabled={webhookStatus === 'checking'}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
            "border border-primary/30 bg-primary/10 text-primary",
            "hover:bg-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {webhookStatus === 'checking' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="hidden sm:inline">{t.verifying}</span>
            </>
          ) : (
            <span>{t.verifyConnection}</span>
          )}
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {webhookStatus === 'connected' && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle className="size-4" />
              <span className="hidden sm:inline text-xs font-medium">{t.active}</span>
            </div>
          )}
          {webhookStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="size-4" />
              <span className="hidden sm:inline text-xs font-medium">{t.error}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
