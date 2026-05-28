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
import { useApp } from '@/contexts/AppContext'
import type { Product, CustomerData } from '@/types'

function App() {
  const store = useStore()
  const { t } = useApp()
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [initialEditProduct, setInitialEditProduct] = useState<Product | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'history'>('products')

  const addToast = useCallback((type: Toast['type'], title: string, message?: string) => {
    const toast: Toast = { id: crypto.randomUUID(), type, title, message }
    setToasts(prev => [...prev, toast])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(tt => tt.id !== id))
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
        addToast('success', t.transactionCompleted, `${product.nombre}${extra}${ordenMsg}`)
      } else if (simulation.estado_envio === 'error') {
        addToast('error', t.syncError, t.orderRegisteredButFailed)
      } else {
        addToast('warning', t.pendingOrder, t.configureWebhook)
      }
    } catch {
      addToast('error', t.error, t.errorProcessing)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVerifyWebhook = async () => {
    const success = await store.verifyWebhook()
    if (success) {
      addToast('success', t.connectionVerified, t.webhookActive)
    } else {
      addToast('error', t.connectionError, t.checkWebhookUrl)
    }
  }

  const handleRetrySimulation = async (id: string) => {
    await store.retrySimulation(id)
    addToast('info', t.retryingSync, t.syncingWithN8N)
  }

  const handleAddProduct = useCallback(async (product: Omit<Product, 'id' | 'created_at'>) => {
    const added = await store.addProduct(product)
    addToast('success', t.productCreated, t.addedToCatalog(added.nombre))
    return added
  }, [store.addProduct, addToast, t])

  const handleEditProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    await store.updateProduct(id, updates)
    addToast('success', t.productUpdated, t.changesSaved)
  }, [store.updateProduct, addToast, t])

  const handleDeleteProduct = useCallback(async (id: string) => {
    const product = store.products.find(p => p.id === id)
    await store.deleteProduct(id)
    addToast('warning', t.productDeleted, product ? t.removedFromCatalog(product.nombre) : undefined)
  }, [store.deleteProduct, store.products, addToast, t])

  // Inline card edit — open modal pre-filled
  const handleEditCard = useCallback((product: Product) => {
    setInitialEditProduct(product)
    setIsProductModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setIsProductModalOpen(false)
    setInitialEditProduct(null)
  }, [])

  const realtimeToastShown = useRef(false)
  useEffect(() => {
    if (store.realtimeConnected && !realtimeToastShown.current) {
      realtimeToastShown.current = true
      addToast('info', t.realtimeActive, t.realtimeSyncing)
    }
  }, [store.realtimeConnected, addToast, t])

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Header
        webhookStatus={store.webhookStatus}
        realtimeConnected={store.realtimeConnected}
        onSettingsClick={() => { setInitialEditProduct(null); setIsProductModalOpen(true) }}
      />

      <WebhookBar
        webhookUrl={store.webhookUrl}
        webhookStatus={store.webhookStatus}
        onUrlChange={store.setWebhookUrl}
        onVerify={handleVerifyWebhook}
      />

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
              {t.catalog}
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
              {t.history}
            </button>
          </div>

          <button
            onClick={() => { setInitialEditProduct(null); setIsProductModalOpen(true) }}
            className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="size-4" />
            {t.manageCatalog}
          </button>
        </div>

        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Product Grid */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {t.availableProducts}
                </h2>
                <button
                  onClick={() => { setInitialEditProduct(null); setIsProductModalOpen(true) }}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {t.addProduct}
                </button>
              </div>
              <ProductGrid
                products={store.products}
                selectedProduct={store.selectedProduct}
                onSelectProduct={store.setSelectedProduct}
                isLoading={store.isLoading}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteProduct}
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
                  <p className="text-muted-foreground font-medium">{t.selectProduct}</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">{t.selectProductHint}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h2 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t.history}
              </h2>
            </div>
            <HistoryTable
              simulations={store.simulations}
              onRetry={handleRetrySimulation}
            />
          </div>
        )}
      </main>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={handleModalClose}
        products={store.products}
        onAdd={handleAddProduct}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        initialEditProduct={initialEditProduct}
      />
    </div>
  )
}

export default App
