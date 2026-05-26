import { useState, useCallback, useEffect } from 'react'
import type { Product, Simulation, CustomerData, KPIData } from '@/types'
import { initialProducts } from '@/data/products'
import { getStockStatus, formatDate, formatTime } from '@/lib/utils'

const WEBHOOK_URL_KEY = 'novasync_webhook_url'
const PRODUCTS_KEY = 'novasync_products'
const SIMULATIONS_KEY = 'novasync_simulations'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error('Failed to save to localStorage')
  }
}

export function useStore() {
  const [products, setProducts] = useState<Product[]>(() => 
    loadFromStorage(PRODUCTS_KEY, initialProducts)
  )
  const [simulations, setSimulations] = useState<Simulation[]>(() => 
    loadFromStorage(SIMULATIONS_KEY, [])
  )
  const [webhookUrl, setWebhookUrlState] = useState(() => 
    localStorage.getItem(WEBHOOK_URL_KEY) || ''
  )
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Persist products
  useEffect(() => {
    saveToStorage(PRODUCTS_KEY, products)
  }, [products])

  // Persist simulations
  useEffect(() => {
    saveToStorage(SIMULATIONS_KEY, simulations)
  }, [simulations])

  const setWebhookUrl = useCallback((url: string) => {
    setWebhookUrlState(url)
    localStorage.setItem(WEBHOOK_URL_KEY, url)
    setWebhookStatus('idle')
  }, [])

  const verifyWebhook = useCallback(async () => {
    if (!webhookUrl) {
      setWebhookStatus('error')
      return false
    }

    setWebhookStatus('checking')
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, source: 'NovaSync Verification' }),
      })
      setWebhookStatus('connected')
      return true
    } catch {
      setWebhookStatus('error')
      return false
    }
  }, [webhookUrl])

  const addProduct = useCallback((product: Omit<Product, 'id' | 'created_at'>) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    setProducts(prev => [...prev, newProduct])
    return newProduct
  }, [])

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    )
  }, [])

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    if (selectedProduct?.id === id) {
      setSelectedProduct(null)
    }
  }, [selectedProduct])

  const executeSimulation = useCallback(async (
    product: Product,
    quantity: number,
    customer: CustomerData
  ): Promise<Simulation> => {
    const stockPostVenta = product.stock_actual - quantity
    const estadoStock = getStockStatus(stockPostVenta, product.stock_minimo)

    const simulation: Simulation = {
      id: crypto.randomUUID(),
      cliente_nombre: customer.nombre,
      cliente_empresa: customer.empresa,
      cliente_email: customer.email,
      cliente_cargo: customer.cargo,
      cliente_telefono: customer.telefono,
      producto_id: product.id,
      producto_nombre: product.nombre,
      producto_codigo: product.codigo,
      cantidad: quantity,
      total: product.precio * quantity,
      stock_post_venta: stockPostVenta,
      estado_stock: estadoStock,
      webhook_url: webhookUrl,
      estado_envio: 'pendiente',
      respuesta_n8n: null,
      created_at: new Date().toISOString(),
    }

    setSimulations(prev => [simulation, ...prev])

    // Update product stock
    updateProduct(product.id, { stock_actual: stockPostVenta })

    // Send to webhook
    if (webhookUrl) {
      try {
        const payload = {
          body: {
            nombre: customer.nombre,
            empresa: customer.empresa,
            email: customer.email,
            cargo: customer.cargo,
            telefono: customer.telefono,
            Score_IA: product.score_ia,
            Estado_Venta: 'Compro',
            Producto_Comprado: product.nombre,
            Codigo: product.codigo,
            Cantidad: quantity,
            Total: product.precio * quantity,
            Stock_Actual: stockPostVenta,
            Stock_Minimo: product.stock_minimo,
            Proveedor: product.proveedor,
            fecha: formatDate(new Date()),
            hora: formatTime(new Date()),
          }
        }

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          simulation.estado_envio = 'enviado'
          simulation.respuesta_n8n = { status: response.status }
        } else {
          simulation.estado_envio = 'error'
          simulation.respuesta_n8n = { status: response.status, error: 'HTTP Error' }
        }
      } catch (error) {
        simulation.estado_envio = 'error'
        simulation.respuesta_n8n = { error: String(error) }
      }

      setSimulations(prev => 
        prev.map(s => s.id === simulation.id ? simulation : s)
      )
    }

    return simulation
  }, [webhookUrl, updateProduct])

  const retrySimulation = useCallback(async (simulationId: string) => {
    const simulation = simulations.find(s => s.id === simulationId)
    if (!simulation || !webhookUrl) return

    setSimulations(prev => 
      prev.map(s => s.id === simulationId ? { ...s, estado_envio: 'pendiente' as const } : s)
    )

    try {
      const product = products.find(p => p.id === simulation.producto_id)
      const payload = {
        body: {
          nombre: simulation.cliente_nombre,
          empresa: simulation.cliente_empresa,
          email: simulation.cliente_email,
          cargo: simulation.cliente_cargo,
          telefono: simulation.cliente_telefono,
          Score_IA: product?.score_ia || 0,
          Estado_Venta: 'Compro',
          Producto_Comprado: simulation.producto_nombre,
          Codigo: simulation.producto_codigo,
          Cantidad: simulation.cantidad,
          Total: simulation.total,
          Stock_Actual: simulation.stock_post_venta,
          Stock_Minimo: product?.stock_minimo || 0,
          Proveedor: product?.proveedor || '',
          fecha: formatDate(simulation.created_at),
          hora: formatTime(simulation.created_at),
        }
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setSimulations(prev => 
        prev.map(s => s.id === simulationId ? {
          ...s,
          estado_envio: response.ok ? 'enviado' as const : 'error' as const,
          respuesta_n8n: { status: response.status }
        } : s)
      )
    } catch {
      setSimulations(prev => 
        prev.map(s => s.id === simulationId ? { ...s, estado_envio: 'error' as const } : s)
      )
    }
  }, [simulations, products, webhookUrl])

  const kpis: KPIData = {
    ventasHoy: simulations.filter(s => {
      const today = new Date().toDateString()
      return new Date(s.created_at).toDateString() === today
    }).length,
    productosStockCritico: products.filter(p => 
      getStockStatus(p.stock_actual, p.stock_minimo) === 'critical'
    ).length,
    valorTotalMovido: simulations.reduce((acc, s) => acc + s.total, 0),
    ultimaSincronizacion: simulations[0]?.created_at || null,
  }

  return {
    products,
    simulations,
    selectedProduct,
    webhookUrl,
    webhookStatus,
    kpis,
    isLoading,
    setSelectedProduct,
    setWebhookUrl,
    verifyWebhook,
    addProduct,
    updateProduct,
    deleteProduct,
    executeSimulation,
    retrySimulation,
    setIsLoading,
  }
}
