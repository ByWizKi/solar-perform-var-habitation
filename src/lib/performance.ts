/**
 * Utilitaires de monitoring de performance
 * Permet de mesurer et logger les temps d'exécution
 */

/**
 * Mesure le temps d'exécution d'une fonction async
 */
export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>,
  options: { logThreshold?: number; warnThreshold?: number } = {}
): Promise<T> {
  const { logThreshold = 0, warnThreshold = 1000 } = options

  const startTime = performance.now()
  
  try {
    const result = await fn()
    const duration = Math.round(performance.now() - startTime)

    // Logger seulement si au-dessus du seuil
    if (duration >= logThreshold) {
      if (duration >= warnThreshold) {
        console.warn(`[PERF] ${label}: ${duration}ms (SLOW!)`)
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${label}: ${duration}ms`)
      }
    }

    return result
  } catch (error) {
    const duration = Math.round(performance.now() - startTime)
    console.error(`[PERF] ${label}: ${duration}ms (ERROR)`)
    throw error
  }
}

/**
 * Decorator pour mesurer la performance d'une route API
 */
export function withPerformanceLogging(
  routeName: string,
  handler: (...args: any[]) => Promise<Response>
) {
  return async (...args: any[]): Promise<Response> => {
    return measurePerformance(
      `API ${routeName}`,
      () => handler(...args),
      { logThreshold: 50, warnThreshold: 500 }
    )
  }
}

/**
 * Timer simple pour mesurer des blocs de code
 */
export class PerformanceTimer {
  private startTime: number
  private checkpoints: Map<string, number> = new Map()

  constructor(private label: string) {
    this.startTime = performance.now()
  }

  checkpoint(name: string) {
    const duration = Math.round(performance.now() - this.startTime)
    this.checkpoints.set(name, duration)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${this.label} - ${name}: ${duration}ms`)
    }
  }

  end() {
    const totalDuration = Math.round(performance.now() - this.startTime)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${this.label} - TOTAL: ${totalDuration}ms`)
      
      if (this.checkpoints.size > 0) {
        console.log(`[PERF] ${this.label} - Breakdown:`)
        this.checkpoints.forEach((duration, name) => {
          const percentage = ((duration / totalDuration) * 100).toFixed(1)
          console.log(`  - ${name}: ${duration}ms (${percentage}%)`)
        })
      }
    }

    return totalDuration
  }
}

/**
 * Helper pour logger les requêtes DB lentes
 */
export function logSlowQuery(query: string, duration: number, threshold = 100) {
  if (duration >= threshold) {
    console.warn(`[PERF] Slow DB Query (${duration}ms): ${query.substring(0, 100)}...`)
  }
}

