import { useState, useCallback, useEffect } from 'react'
import type { Product, Simulation, CustomerData, KPIData } from '@/types'
import { initialProducts } from '@/data/products'
import { getStockStatus, formatDate, formatTime } from '@/lib/utils'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const WEBHOOK_URL_KEY = 'novasync_webhook_url'

export function useStore() {
  const [products, setProducts] = useState<Product[]>([])
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [webhookUrl, setWebhookUrlState] = useState(() =>
    localStorage.getItem(WEBHOOK_URL_KEY) || ''
  )
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProducts(initialProducts)
      setIsLoading(false)
      return
    }

    async function loadData() {
      setIsLoading(true)
      try {
        const [{ data: productsData }, { data: simulationsData }] = await Promise.all([
          supabase.from('products').select('*').order('created_at'),
          supabase.from('simulations').select('*').order('created_at', { ascending: false }),
        ])

        if (productsData !== null) {
          if (productsData.length === 0) {
            const seed = initialProducts.map(({ id: _id, created_at: _ca, ...p }) => p)
            const { data: seeded } = await supabase.from('products').insert(seed).select()
            setProducts(seeded ?? initialProducts)
          } else {
            setProducts(productsData)
          }
        }

        if (simulationsData !== null) {
          setSimulations(simulationsData)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('products').insert(product).select().single()
      if (!error && data) {
        setProducts(prev => [...prev, data])
        return data as Product
      }
    }
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    setProducts(prev => [...prev, newProduct])
    return newProduct
  }, [])

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    if (isSupabaseConfigured) {
      await supabase.from('products').update(updates).eq('id', id)
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('products').delete().eq('id', id)
    }
    setProducts(prev => prev.filter(p => p.id !== id))
    if (selectedProduct?.id === id) setSelectedProduct(null)
  }, [selectedProduct])

  const executeSimulation = useCallback(async (
    product: Product,
    quantity: number,
    customer: CustomerData
  ): Promise<Simulation> => {
    const stockPostVenta = product.stock_actual - quantity
    const estadoStock = getStockStatus(stockPostVenta, product.stock_minimo)

    const simulationData = {
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
      estado_envio: 'pendiente' as const,
      respuesta_n8n: null,
    }

    let simulation: Simulation

    if (isSupabaseConfigured) {
      const { data } = await supabase.from('simulations').insert(simulationData).select().single()
      simulation = data ?? { ...simulationData, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    } else {
      simulation = { ...simulationData, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    }

    setSimulations(prev => [simulation, ...prev])
    await updateProduct(product.id, { stock_actual: stockPostVenta })

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

        simulation.estado_envio = response.ok ? 'enviado' : 'error'
        simulation.respuesta_n8n = { status: response.status }
      } catch (error) {
        simulation.estado_envio = 'error'
        simulation.respuesta_n8n = { error: String(error) }
      }

      if (isSupabaseConfigured) {
        await supabase.from('simulations').update({
          estado_envio: simulation.estado_envio,
          respuesta_n8n: simulation.respuesta_n8n,
        }).eq('id', simulation.id)
      }

      setSimulations(prev => prev.map(s => s.id === simulation.id ? simulation : s))
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

      const newStatus = response.ok ? 'enviado' as const : 'error' as const

      if (isSupabaseConfigured) {
        await supabase.from('simulations').update({
          estado_envio: newStatus,
          respuesta_n8n: { status: response.status },
        }).eq('id', simulationId)
      }

      setSimulations(prev =>
        prev.map(s => s.id === simulationId ? {
          ...s,
          estado_envio: newStatus,
          respuesta_n8n: { status: response.status },
        } : s)
      )
    } catch {
      if (isSupabaseConfigured) {
        await supabase.from('simulations').update({ estado_envio: 'error' }).eq('id', simulationId)
      }
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
