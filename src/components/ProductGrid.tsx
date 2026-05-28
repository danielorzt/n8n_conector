import { memo, useState } from 'react'
import {
  Monitor,
  Laptop,
  Printer,
  Keyboard,
  Camera,
  Headphones,
  Package,
  Pencil,
  Trash2,
  LucideIcon,
} from 'lucide-react'
import { cn, formatCOP, getStockStatus } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'
import type { Product } from '@/types'

const iconMap: Record<string, LucideIcon> = {
  Monitor,
  Laptop,
  Printer,
  Keyboard,
  Camera,
  Headphones,
  Package,
}

interface ProductGridProps {
  products: Product[]
  selectedProduct: Product | null
  onSelectProduct: (product: Product) => void
  isLoading?: boolean
  onEditCard?: (product: Product) => void
  onDeleteCard?: (id: string) => Promise<void>
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
      <div className="size-12 rounded-xl bg-muted" />
      <div className="mt-4 h-5 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-6 w-1/2 rounded bg-muted" />
      <div className="mt-4 h-2 w-full rounded-full bg-muted" />
      <div className="mt-3 flex items-center justify-between">
        <div className="h-5 w-20 rounded-full bg-muted" />
        <div className="h-4 w-16 rounded bg-muted" />
      </div>
    </div>
  )
}

const ProductCard = memo(function ProductCard({
  product,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: {
  product: Product
  isSelected: boolean
  onClick: () => void
  onEdit?: (product: Product) => void
  onDelete?: (id: string) => Promise<void>
}) {
  const { t } = useApp()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const Icon = iconMap[product.icono] || Package
  const stockStatus = getStockStatus(product.stock_actual, product.stock_minimo)
  const stockLabels = { critical: t.stockCritical, low: t.stockLow, ok: t.stockOK }
  const stockLabel = stockLabels[stockStatus]
  const stockPercentage = Math.min((product.stock_actual / product.stock_minimo) * 100, 100)

  const statusColors = {
    critical: 'bg-destructive',
    low: 'bg-warning',
    ok: 'bg-success',
  }

  const badgeColors = {
    critical: 'bg-destructive/10 text-destructive border-destructive/30',
    low: 'bg-warning/10 text-warning border-warning/30',
    ok: 'bg-success/10 text-success border-success/30',
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(product)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm(true)
  }

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    await onDelete?.(product.id)
    setIsDeleting(false)
    setDeleteConfirm(false)
  }

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm(false)
  }

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          "relative w-full rounded-2xl border bg-card p-5 text-left transition-all duration-200",
          "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          isSelected && "border-primary bg-primary/5 shadow-lg shadow-primary/15 -translate-y-0.5",
          !isSelected && "border-border/50"
        )}
      >
        {/* Top gradient line */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-0.5 rounded-t-2xl transition-opacity",
          "bg-gradient-to-r from-primary to-secondary",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )} />

        {/* Icon */}
        <div className={cn(
          "size-12 rounded-xl flex items-center justify-center transition-colors",
          isSelected ? "bg-primary/20" : "bg-muted"
        )}>
          <Icon className={cn(
            "size-6",
            isSelected ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        {/* Product Info */}
        <div className="mt-4">
          <h3 className="font-display font-semibold text-foreground line-clamp-1 pr-14">
            {product.nombre}
          </h3>
          <p className="mt-1 text-lg font-bold text-primary">
            {formatCOP(product.precio)}
          </p>
        </div>

        {/* Stock Progress Bar */}
        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", statusColors[stockStatus])}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-3 flex items-center justify-between">
          <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            badgeColors[stockStatus]
          )}>
            {stockLabel} ({product.stock_actual})
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {product.proveedor}
          </span>
        </div>

        {/* Top-right: IA score + CRUD actions stacked */}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {/* IA Score pill */}
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
            isSelected
              ? "bg-primary/20 text-primary"
              : "bg-primary/10 text-primary/70 group-hover:bg-primary/20 group-hover:text-primary"
          )}>
            IA: {product.score_ia}/10
          </div>

          {/* CRUD buttons — appear below score on hover */}
          {(onEdit || onDelete) && !deleteConfirm && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-1 group-hover:translate-y-0">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  title={t.editProduct}
                  className="size-6 rounded-md border border-border/80 bg-card/95 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/60 hover:bg-primary/10 transition-colors shadow-sm"
                >
                  <Pencil className="size-3" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  title={t.delete}
                  className="size-6 rounded-md border border-border/80 bg-card/95 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/60 hover:bg-destructive/10 transition-colors shadow-sm"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Delete confirmation overlay */}
      {deleteConfirm && (
        <div
          className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-3 bg-card/95 backdrop-blur-sm border border-destructive/40 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-center px-4">{t.confirmDelete}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isDeleting ? '...' : t.delete}
            </button>
            <button
              onClick={handleDeleteCancel}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export function ProductGrid({
  products,
  selectedProduct,
  onSelectProduct,
  isLoading,
  onEditCard,
  onDeleteCard,
}: ProductGridProps) {
  const { t } = useApp()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <Package className="size-12 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="font-medium text-muted-foreground">{t.noProductsFound}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ProductCard
            product={product}
            isSelected={selectedProduct?.id === product.id}
            onClick={() => onSelectProduct(product)}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
          />
        </div>
      ))}
    </div>
  )
}
