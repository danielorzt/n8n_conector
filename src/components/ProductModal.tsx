import { useState, useEffect } from 'react'
import { 
  X, 
  Plus,
  Pencil,
  Trash2,
  Search,
  Monitor, 
  Laptop, 
  Printer, 
  Keyboard, 
  Camera, 
  Headphones,
  Package,
  Loader2
} from 'lucide-react'
import { cn, formatCOP } from '@/lib/utils'
import type { Product } from '@/types'

const iconOptions = [
  { value: 'Monitor', label: 'Monitor', icon: Monitor },
  { value: 'Laptop', label: 'Laptop', icon: Laptop },
  { value: 'Printer', label: 'Impresora', icon: Printer },
  { value: 'Keyboard', label: 'Teclado', icon: Keyboard },
  { value: 'Camera', label: 'Camara', icon: Camera },
  { value: 'Headphones', label: 'Audifonos', icon: Headphones },
  { value: 'Package', label: 'Otro', icon: Package },
]

const categorias = [
  'Monitores',
  'Laptops',
  'Impresoras',
  'Perifericos',
  'Camaras',
  'Audio',
  'Accesorios',
]

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onAdd: (product: Omit<Product, 'id' | 'created_at'>) => Promise<Product>
  onEdit: (id: string, updates: Partial<Product>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ProductModal({ 
  isOpen, 
  onClose, 
  products, 
  onAdd, 
  onEdit, 
  onDelete 
}: ProductModalProps) {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Monitores',
    precio: 0,
    stock_actual: 0,
    stock_minimo: 5,
    proveedor: '',
    score_ia: 8,
    icono: 'Package',
  })

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        codigo: editingProduct.codigo,
        nombre: editingProduct.nombre,
        categoria: editingProduct.categoria,
        precio: editingProduct.precio,
        stock_actual: editingProduct.stock_actual,
        stock_minimo: editingProduct.stock_minimo,
        proveedor: editingProduct.proveedor,
        score_ia: editingProduct.score_ia,
        icono: editingProduct.icono,
      })
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        categoria: 'Monitores',
        precio: 0,
        stock_actual: 0,
        stock_minimo: 5,
        proveedor: '',
        score_ia: 8,
        icono: 'Package',
      })
    }
  }, [editingProduct])

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingProduct) {
        await onEdit(editingProduct.id, formData)
      } else {
        await onAdd(formData)
      }
      setView('list')
      setEditingProduct(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    await onDelete(id)
    setDeleteConfirm(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-fade-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold">
              {view === 'list' ? 'Administrar Catalogo' : editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {view === 'form' && (
              <button
                onClick={() => {
                  setView('list')
                  setEditingProduct(null)
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={onClose}
              className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] p-4">
          {view === 'list' ? (
            <div className="space-y-4">
              {/* Search and Add */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full rounded-lg border border-border bg-popover pl-10 pr-4 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null)
                    setView('form')
                  }}
                  className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="size-4" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Product List */}
              <div className="space-y-2">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Package className="size-12 mx-auto mb-3 opacity-50" />
                    <p>No se encontraron productos</p>
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const IconComponent = iconOptions.find(i => i.value === product.icono)?.icon || Package
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-popover p-4 transition-colors hover:border-border/60"
                      >
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                            <IconComponent className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{product.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.codigo} · {formatCOP(product.precio)} · Stock: {product.stock_actual}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {deleteConfirm === product.id ? (
                            <>
                              <span className="text-sm text-muted-foreground mr-2">Confirmar eliminacion?</span>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
                              >
                                Eliminar
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingProduct(product)
                                  setView('form')
                                }}
                                className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(product.id)}
                                className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Codigo</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="MON-001"
                    className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Monitor Dell 27"
                    className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Categoria</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Icono</label>
                  <select
                    value={formData.icono}
                    onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                    className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {iconOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Precio (COP)</label>
                  <input
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                    placeholder="850000"
                    className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Proveedor</label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    placeholder="ImportTech Bogota"
                    className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock Actual</label>
                  <input
                    type="number"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock Minimo</label>
                  <input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                    min={1}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Score IA (1-10)</label>
                  <input
                    type="range"
                    value={formData.score_ia}
                    onChange={(e) => setFormData({ ...formData, score_ia: Number(e.target.value) })}
                    min={1}
                    max={10}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span className="font-medium text-primary">{formData.score_ia}</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-border bg-popover p-4">
                <p className="text-xs text-muted-foreground mb-2">Vista previa</p>
                <div className="flex items-center gap-3">
                  {(() => {
                    const IconComponent = iconOptions.find(i => i.value === formData.icono)?.icon || Package
                    return (
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComponent className="size-5 text-primary" />
                      </div>
                    )
                  })()}
                  <div>
                    <p className="font-medium">{formData.nombre || 'Nombre del producto'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.codigo || 'COD-XXX'} · {formatCOP(formData.precio)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-xl py-3 font-medium transition-all",
                  "gradient-primary text-primary-foreground",
                  "disabled:opacity-70 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{editingProduct ? 'Guardar cambios' : 'Crear producto'}</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
