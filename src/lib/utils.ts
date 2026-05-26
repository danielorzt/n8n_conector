import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date))
}

export function getStockStatus(current: number, minimum: number): 'critical' | 'low' | 'ok' {
  if (current < 5) return 'critical'
  if (current < minimum) return 'low'
  return 'ok'
}

export function getStockLabel(status: 'critical' | 'low' | 'ok'): string {
  switch (status) {
    case 'critical': return 'Stock Critico'
    case 'low': return 'Stock Bajo'
    case 'ok': return 'Disponible'
  }
}
