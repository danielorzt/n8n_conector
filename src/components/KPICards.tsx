import { useEffect, useState } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { cn, formatCOP, formatTime } from '@/lib/utils'
import type { KPIData } from '@/types'

interface KPICardsProps {
  kpis: KPIData
  isLoading?: boolean
}

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      setDisplayValue(Math.floor(progress * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{displayValue}</span>
}

function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  isLoading,
  isCurrency = false,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  trend?: string
  color: 'primary' | 'destructive' | 'success' | 'warning'
  isLoading?: boolean
  isCurrency?: boolean
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
  }

  const iconBgClasses = {
    primary: 'bg-primary/20',
    destructive: 'bg-destructive/20',
    success: 'bg-success/20',
    warning: 'bg-warning/20',
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="size-10 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-16 rounded skeleton-shimmer" />
        </div>
        <div className="mt-4 h-8 w-24 rounded skeleton-shimmer" />
        <div className="mt-2 h-4 w-32 rounded skeleton-shimmer" />
      </div>
    )
  }

  return (
    <div className={cn(
      "rounded-xl border bg-card p-5 transition-all hover:border-border/60 animate-fade-in",
      "hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
    )}>
      <div className="flex items-start justify-between">
        <div className={cn("size-10 rounded-lg flex items-center justify-center", iconBgClasses[color])}>
          <Icon className={cn("size-5", `text-${color}`)} />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", colorClasses[color])}>
            <ArrowUpRight className="size-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-display font-bold tracking-tight">
          {isCurrency ? (
            formatCOP(typeof value === 'number' ? value : 0)
          ) : typeof value === 'number' ? (
            <AnimatedCounter value={value} />
          ) : (
            value
          )}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  )
}

export function KPICards({ kpis, isLoading }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Transacciones Hoy"
        value={kpis.ventasHoy}
        icon={TrendingUp}
        trend="+12%"
        color="primary"
        isLoading={isLoading}
      />
      <KPICard
        title="Productos en Stock Critico"
        value={kpis.productosStockCritico}
        icon={AlertTriangle}
        color="destructive"
        isLoading={isLoading}
      />
      <KPICard
        title="Valor Total Movido"
        value={kpis.valorTotalMovido}
        icon={DollarSign}
        color="success"
        isLoading={isLoading}
        isCurrency
      />
      <KPICard
        title="Ultima Sincronizacion"
        value={kpis.ultimaSincronizacion ? formatTime(kpis.ultimaSincronizacion) : 'Sin datos'}
        icon={Clock}
        color="warning"
        isLoading={isLoading}
      />
    </div>
  )
}
