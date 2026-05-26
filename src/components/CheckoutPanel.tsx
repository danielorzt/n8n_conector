import { useState } from 'react'
import { 
  Minus, 
  Plus, 
  Send, 
  AlertTriangle,
  Loader2,
  CheckCircle,
  X
} from 'lucide-react'
import { cn, formatCOP, getStockStatus, getStockLabel } from '@/lib/utils'
import type { Product, CustomerData } from '@/types'

interface CheckoutPanelProps {
  product: Product | null
  onClose: () => void
  onSubmit: (product: Product, quantity: number, customer: CustomerData) => Promise<void>
  isProcessing: boolean
}

const defaultCustomer: CustomerData = {
  nombre: 'Carlos Ruiz',
  empresa: 'LogiCargo S.A.',
  email: 'carlos@logicargo.com',
  cargo: 'Gerente de Operaciones',
  telefono: '3001234567',
}

export function CheckoutPanel({ product, onClose, onSubmit, isProcessing }: CheckoutPanelProps) {
  const [quantity, setQuantity] = useState(1)
  const [customer, setCustomer] = useState<CustomerData>(defaultCustomer)
  const [submitted, setSubmitted] = useState(false)

  if (!product) return null

  const stockPostVenta = product.stock_actual - quantity
  const stockStatus = getStockStatus(stockPostVenta, product.stock_minimo)
  const stockLabel = getStockLabel(stockStatus)
  const total = product.precio * quantity

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, Math.min(product.stock_actual, quantity + delta))
    setQuantity(newQty)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(product, quantity, customer)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setQuantity(1)
    }, 2000)
  }

  const statusColors = {
    critical: 'text-destructive bg-destructive/10 border-destructive/30',
    low: 'text-warning bg-warning/10 border-warning/30',
    ok: 'text-success bg-success/10 border-success/30',
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold">Procesar Orden</h2>
        <button
          onClick={onClose}
          className="size-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer Data */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Datos del Cliente
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="block text-xs text-muted-foreground mb-1.5">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={customer.nombre}
                onChange={(e) => setCustomer({ ...customer, nombre: e.target.value })}
                className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label htmlFor="empresa" className="block text-xs text-muted-foreground mb-1.5">
                Empresa
              </label>
              <input
                id="empresa"
                type="text"
                value={customer.empresa}
                onChange={(e) => setCustomer({ ...customer, empresa: e.target.value })}
                className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs text-muted-foreground mb-1.5">
                Correo Electronico
              </label>
              <input
                id="email"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label htmlFor="cargo" className="block text-xs text-muted-foreground mb-1.5">
                Cargo
              </label>
              <input
                id="cargo"
                type="text"
                value={customer.cargo}
                onChange={(e) => setCustomer({ ...customer, cargo: e.target.value })}
                className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>
        </div>

        {/* Quantity Control */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-muted-foreground">Cantidad:</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="size-9 rounded-lg border border-border bg-popover flex items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="size-4" />
            </button>
            <span className="text-xl font-bold min-w-[2rem] text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= product.stock_actual}
              className="size-9 rounded-lg border border-border bg-popover flex items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-xl bg-popover p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Producto</span>
            <span className="font-medium truncate ml-4">{product.nombre}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Codigo</span>
            <span className="font-mono">{product.codigo}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Precio unitario</span>
            <span>{formatCOP(product.precio)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cantidad</span>
            <span>{quantity} unidades</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-bold text-lg text-primary">{formatCOP(total)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-muted-foreground">Stock posterior</span>
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              statusColors[stockStatus]
            )}>
              {stockStatus === 'critical' && <AlertTriangle className="size-3" />}
              {stockLabel} ({stockPostVenta} restantes)
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || submitted}
          className={cn(
            "w-full rounded-xl py-4 text-base font-display font-bold transition-all",
            "flex items-center justify-center gap-2",
            submitted 
              ? "bg-success text-success-foreground" 
              : "gradient-primary text-primary-foreground hover:opacity-90",
            "disabled:opacity-70 disabled:cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Procesando transaccion...</span>
            </>
          ) : submitted ? (
            <>
              <CheckCircle className="size-5" />
              <span>Orden enviada exitosamente</span>
            </>
          ) : (
            <>
              <Send className="size-5" />
              <span>Ejecutar transaccion y sincronizar</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
