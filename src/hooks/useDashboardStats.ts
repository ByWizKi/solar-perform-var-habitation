/**
 * Hook personnalisé pour gérer les stats du dashboard
 * Optimisé pour performance avec memoization et mise en cache
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface Stats {
  current: {
    powerNow: number
    consumptionNow: number
    batteryPowerNow: number
    batteryPercentage: number
  }
  today: {
    production: number
    consumption: number
  }
  month: {
    production: number
  }
  lifetime: {
    production: number
    consumption: number
  }
  system: {
    status: string
    systemSize: number
    unresolvedEvents: number
  }
  lastUpdate: string | null
}

export function useDashboardStats(accessToken: string | null) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [systemId, setSystemId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cache pour éviter les requêtes multiples simultanées
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef<number>(0)

  const fetchStats = useCallback(async () => {
    if (!accessToken) return

    // Éviter les requêtes multiples simultanées
    if (fetchInProgress.current) {
      console.log('[PERF] Requête stats déjà en cours, skip')
      return
    }

    // Throttle : minimum 2 secondes entre les requêtes
    const now = Date.now()
    if (now - lastFetchTime.current < 2000) {
      console.log('[PERF] Requête stats trop rapide, throttled')
      return
    }

    fetchInProgress.current = true
    lastFetchTime.current = now

    try {
      const res = await fetch('/api/connections', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error('Erreur lors de la récupération des connexions')
      }

      const { connections } = await res.json()

      if (connections && connections.length > 0) {
        const firstConnection = connections[0]
        setSystemId(firstConnection.systemId)

        const statsRes = await fetch(
          `/api/data/stats?systemId=${firstConnection.systemId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
          setError(null)
        } else {
          throw new Error('Erreur lors de la récupération des statistiques')
        }
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      fetchInProgress.current = false
    }
  }, [accessToken])

  // Charger les stats au montage
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    systemId,
    loading,
    error,
    refetch: fetchStats,
  }
}

