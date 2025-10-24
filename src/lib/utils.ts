import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatEnergy(wh: number): string {
  if (wh === 0) return '0 Wh'
  if (wh >= 1000000000) {
    // GWh (milliards de Wh)
    return `${(wh / 1000000000).toFixed(2)} GWh`
  } else if (wh >= 1000000) {
    // MWh (millions de Wh)
    return `${(wh / 1000000).toFixed(2)} MWh`
  } else if (wh >= 1000) {
    // kWh (milliers de Wh)
    return `${(wh / 1000).toFixed(2)} kWh`
  } else {
    return `${wh.toFixed(0)} Wh`
  }
}

export function formatPower(w: number): string {
  if (w === 0) return '0 W'
  if (w >= 1000000) {
    return `${(w / 1000000).toFixed(2)} MW`
  } else if (w >= 1000) {
    return `${(w / 1000).toFixed(2)} kW`
  } else {
    return `${w.toFixed(0)} W`
  }
}
