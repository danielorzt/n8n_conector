import { useState, useCallback, useEffect, useRef } from 'react'
import { Settings, History, Package } from 'lucide-react'
import { Header } from '@/components/Header'
import { WebhookBar } from '@/components/WebhookBar'
import { KPICards } from '@/components/KPICards'
import { ProductGrid } from '@/components/ProductGrid'
import { CheckoutPanel } from '@/components/CheckoutPanel'
import { ProductModal } from '@/components/ProductModal'
import { HistoryTable } from '@/components/HistoryTable'
import { ToastContainer, type Toast } from '@/components/Toast'
import { useStore } from '@/hooks/useStore'
import type { Product, CustomerData } from '@/types'

function App() {
  const store = useStore()
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'history'>('products')

  const addToast = useCallback((type: Toast['type'], title: string, message?: string) => {
    const toast: Toast = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
    }
    setToasts(prev => [...prev, toast])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleSubmitOrder = async (product: Product, quantity: number, customer: CustomerData) => {
    setIsProcessing(true)
    try {
      const simulation = await store.executeSimulation(product, quantity, customer)
      
      if (simulation.estado_envio === 'enviado') {
        const alerta = simulation.respuesta_n8n?.alerta
        const ordenGenerada = simulation.respuesta_n8n?.orden_generada
        const alertaLabel = alerta?.includes('CRÍTICO') ? '🔴 Stock crítico'
          : alerta?.includes('BAJO') ? '🟡 Stock bajo'
          : alerta ? '🟢 Stock OK' : ''
        const extra = alertaLabel ? ` · ${alertaLabel}` : ''
        const ordenMsg = ordenGenerada ? ' · Orden de recompra generada' : ''
        addToast('success', 'Transaccion completada', `${product.nombre}${extra}${ordenMsg}`)
      } else if (simulation.estado_envio === 'error') {
        addToast('error', 'Error de sincronizacion', 'La orden fue registrada pero no se pudo enviar al webhook')
      } else {
        addToast('warning', 'Orden pendiente', 'Configure el webhook para sincronizar')
      }
    } catch {
      addToast('error', 'Error', 'No se pudo procesar la transaccion')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVerifyWebhook = async () => {
    const success = await store.verifyWebhook()
    if (success) {
      addToast('success', 'Conexion verificada', 'El webhook de n8n esta activo')
    } else {
      addToast('error', 'Error de conexion', 'Verifica la URL del webhook')
    }
  }

  const handleRetrySimulation = async (id: string) => {
    await store.retrySimulation(id)
    addToast('info', 'Reintentando envio', 'Sincronizando con n8n...')
  }

  const handleAddProduct = useCallback(async (product: Omit<Product, 'id' | 'created_at'>) => {
    const added = await store.addProduct(product)
    addToast('success', '✅ Producto creado', `${added.nombre} agregado al catalogo`)
    return added
  }, [store.addProduct, addToast])

  const handleEditProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    await store.updateProduct(id, updates)
    addToast('success', '✏️ Producto actualizado', 'Cambios guardados correctamente')
  }, [store.updateProduct, addToast])

  const handleDeleteProduct = useCallback(async (id: string) => {
    const product = store.products.find(p => p.id === id)
    await store.deleteProduct(id)
    addToast('warning', '🗑️ Producto eliminado', product ? `${product.nombre} removido del catalogo` : undefined)
  }, [store.deleteProduct, store.products, addToast])

  const realtimeToastShown = useRef(false)
  useEffect(() => {
    if (store.realtimeConnected && !realtimeToastShown.current) {
      realtimeToastShown.current = true
      addToast('info', '📡 Tiempo real activo', 'Sincronizando cambios en vivo con Supabase')
    }
  }, [store.realtimeConnected, addToast])

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <Header
        webhookStatus={store.webhookStatus}
        realtimeConnected={store.realtimeConnected}
        onSettingsClick={() => setIsProductModalOpen(true)}
      />

      {/* Webhook Configuration Bar */}
      <WebhookBar
        webhookUrl={store.webhookUrl}
        webhookStatus={store.webhookStatus}
        onUrlChange={store.setWebhookUrl}
        onVerify={handleVerifyWebhook}
      />

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <section className="mb-8">
          <KPICards kpis={store.kpis} isLoading={store.isLoading} />
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="size-4" />
              Catalogo
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="size-4" />
              Historial
            </button>
          </div>

          <button
            onClick={() => setIsProductModalOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="size-4" />
            Administrar catalogo
          </button>
        </div>

        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Product Grid */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h2 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Productos Disponibles
                </h2>
              </div>
              <ProductGrid
                products={store.products}
                selectedProduct={store.selectedProduct}
                onSelectProduct={store.setSelectedProduct}
                isLoading={store.isLoading}
              />
            </div>

            {/* Checkout Panel */}
            <div className="lg:col-span-1">
              {store.selectedProduct ? (
                <CheckoutPanel
                  product={store.selectedProduct}
                  onClose={() => store.setSelectedProduct(null)}
                  onSubmit={handleSubmitOrder}
                  isProcessing={isProcessing}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <Package className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground font-medium">
                    Seleccione un producto
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Haga clic en un producto del catalogo para procesar una orden
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h2 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Historial de Transacciones
              </h2>
            </div>
            <HistoryTable
              simulations={store.simulations}
              onRetry={handleRetrySimulation}
            />
          </div>
        )}
      </main>

      {/* Product Management Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        products={store.products}
        onAdd={handleAddProduct}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />
    </div>
  )
}

export default App
