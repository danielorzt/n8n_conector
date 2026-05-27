export interface Product {
  id: string
  codigo: string
  nombre: string
  categoria: string
  precio: number
  stock_actual: number
  stock_minimo: number
  proveedor: string
  score_ia: number
  icono: string
  created_at: string
}

export interface Simulation {
  id: string
  cliente_nombre: string
  cliente_empresa: string
  cliente_email: string
  cliente_cargo: string
  cliente_telefono: string
  producto_id: string
  producto_nombre: string
  producto_codigo: string
  cantidad: number
  total: number
  stock_post_venta: number
  estado_stock: 'critical' | 'low' | 'ok'
  webhook_url: string
  estado_envio: 'pendiente' | 'enviado' | 'error'
  orden_generada: boolean
  respuesta_n8n: {
    status?: number
    orden_generada?: boolean
    alerta?: string
    producto?: string
    stock_post_venta?: number
    mensaje?: string
    motivo?: string
  } | null
  created_at: string
}

export interface CustomerData {
  nombre: string
  empresa: string
  email: string
  cargo: string
  telefono: string
}

export interface WebhookPayload {
  nombre: string
  empresa: string
  email: string
  cargo: string
  telefono: string
  Score_IA: number
  Estado_Venta: string
  Producto_Comprado: string
  Codigo: string
  Cantidad: number
  Total: number
  Stock_Actual: number
  Stock_Minimo: number
  Proveedor: string
  fecha: string
  hora: string
}

export interface KPIData {
  ventasHoy: number
  productosStockCritico: number
  valorTotalMovido: number
  ultimaSincronizacion: string | null
}
