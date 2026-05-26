import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock
} from 'lucide-react'
import { cn, formatCOP, formatDate, formatTime } from '@/lib/utils'
import type { Simulation } from '@/types'

interface HistoryTableProps {
  simulations: Simulation[]
  onRetry: (id: string) => void
}

export function HistoryTable({ simulations, onRetry }: HistoryTableProps) {
  if (simulations.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Clock className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No hay transacciones registradas</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Las simulaciones de compra apareceran aqui
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {simulations.slice(0, 10).map((sim, index) => (
              <tr 
                key={sim.id} 
                className={cn(
                  "transition-colors hover:bg-muted/20 animate-fade-in",
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-4 py-3">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    sim.estado_envio === 'enviado' && "bg-success/10 text-success",
                    sim.estado_envio === 'error' && "bg-destructive/10 text-destructive",
                    sim.estado_envio === 'pendiente' && "bg-warning/10 text-warning"
                  )}>
                    {sim.estado_envio === 'enviado' && <CheckCircle className="size-3" />}
                    {sim.estado_envio === 'error' && <XCircle className="size-3" />}
                    {sim.estado_envio === 'pendiente' && <Clock className="size-3 animate-pulse" />}
                    <span className="capitalize">{sim.estado_envio}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <p className="font-medium">{formatDate(sim.created_at)}</p>
                    <p className="text-muted-foreground text-xs">{formatTime(sim.created_at)}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <p className="font-medium">{sim.cliente_nombre}</p>
                    <p className="text-muted-foreground text-xs truncate max-w-[150px]">
                      {sim.cliente_empresa}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <p className="font-medium truncate max-w-[150px]">{sim.producto_nombre}</p>
                    <p className="text-muted-foreground text-xs font-mono">{sim.producto_codigo}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium">{sim.cantidad} uds</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold text-primary">{formatCOP(sim.total)}</span>
                </td>
                <td className="px-4 py-3">
                  {sim.estado_envio === 'error' && (
                    <button
                      onClick={() => onRetry(sim.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <RefreshCw className="size-3" />
                      Reintentar
                    </button>
                  )}
                  {sim.estado_envio === 'enviado' && (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle className="size-3" />
                      Sincronizado
                    </div>
                  )}
                  {sim.estado_envio === 'pendiente' && (
                    <div className="flex items-center gap-1 text-xs text-warning">
                      <Clock className="size-3 animate-pulse" />
                      Procesando
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {simulations.length > 10 && (
        <div className="border-t border-border px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">
            Mostrando 10 de {simulations.length} transacciones
          </p>
        </div>
      )}
    </div>
  )
}
