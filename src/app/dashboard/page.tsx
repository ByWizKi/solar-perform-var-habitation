'use client'

import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

// Lazy loading des composants lourds pour réduire le bundle initial
const EcoFacts = lazy(() => import('@/components/EcoFacts'))

// Prix du kWh en euros (configurable)
const PRIX_KWH_EURO = 0.2062 // Prix moyen en France 2024

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

interface HistoryEntry {
  date: string
  timestamp?: string
  production: number
  productionKWh: number
  coutEuros: number
  consumption?: number
  available: boolean
}

export default function DashboardPage() {
  const { user, isLoading, accessToken, isAdmin, isSuperAdmin } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [systemId, setSystemId] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [refreshCount, setRefreshCount] = useState<number>(0)
  const [maxRefreshes, setMaxRefreshes] = useState<number>(15)
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null)

  // Fonction pour recharger le profil utilisateur (pour mettre à jour dailyRefreshCount)
  const reloadUserProfile = useCallback(async () => {
    if (!accessToken) return

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.user.role === 'ADMIN') {
          setRefreshCount(data.user.dailyRefreshCount || 0)
        }
      }
    } catch (error) {
      console.error('Erreur lors du rechargement du profil:', error)
    }
  }, [accessToken])

  // Rediriger le super admin vers son dashboard spécial
  useEffect(() => {
    if (!isLoading && user && isSuperAdmin()) {
      router.push('/super-admin-dashboard')
    }
  }, [user, isLoading, isSuperAdmin, router])

  // Fonctions de formatage
  const formatEnergy = useCallback((wh: number) => {
    if (wh === 0) return '0 Wh'
    if (wh >= 1000000000) {
      // GWh (milliards de Wh)
      return `${(wh / 1000000000).toFixed(2)} GWh`
    } else if (wh >= 1000000) {
      // MWh (millions de Wh)
      return `${(wh / 1000000).toFixed(2)} MWh`
    } else if (wh >= 1000) {
      // kWh
      return `${(wh / 1000).toFixed(2)} kWh`
    } else {
      // Wh
      return `${wh.toFixed(0)} Wh`
    }
  }, [])

  const formatPower = useCallback((w: number) => {
    if (w === 0) return '0 W'
    if (w >= 1000000) {
      // MW
      return `${(w / 1000000).toFixed(2)} MW`
    } else if (w >= 1000) {
      // kW
      return `${(w / 1000).toFixed(2)} kW`
    } else {
      // W
      return `${w.toFixed(0)} W`
    }
  }, [])

  // Fonctions API
  const fetchSystemId = useCallback(async () => {
    try {
      const res = await fetch('/api/connections', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        const enphaseConnection = data.connections?.find(
          (c: any) => c.service === 'enphase' && c.systemId
        )
        if (enphaseConnection) {
          setSystemId(enphaseConnection.systemId)
          // Initialiser le timestamp pour les viewers
          if (enphaseConnection.lastSyncAt) {
            setLastSyncTimestamp(enphaseConnection.lastSyncAt)
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du systemId:', error)
    }
  }, [accessToken])

  // Fonction légère pour vérifier si les données ont été mises à jour (viewers uniquement)
  const checkForUpdates = useCallback(async () => {
    if (!accessToken || isAdmin()) return false

    try {
      const res = await fetch('/api/connections/check-updates', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        const newTimestamp = data.lastSyncAt

        // Si le timestamp a changé, retourner true pour déclencher le rechargement
        if (newTimestamp && newTimestamp !== lastSyncTimestamp) {
          console.log('[VIEWER] Nouvelles données détectées, rechargement...')
          setLastSyncTimestamp(newTimestamp)
          return true
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error)
    }
    return false
  }, [accessToken, lastSyncTimestamp, isAdmin])

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true)
      const res = await fetch(`/api/data/stats?systemId=${systemId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store', // Force le rechargement sans cache
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [systemId, accessToken])

  const fetchHistory = useCallback(async () => {
    if (!systemId || !accessToken) return

    try {
      setLoadingHistory(true)
      const res = await fetch(`/api/data/history?systemId=${systemId}&days=14`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store', // Force le rechargement sans cache
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error)
    } finally {
      setLoadingHistory(false)
    }
  }, [systemId, accessToken])

  const handleRefresh = useCallback(async () => {
    if (!systemId || !accessToken) return

    try {
      setLoadingStats(true)

      // D'abord, synchroniser les données depuis Enphase (seulement pour les admins)
      if (isAdmin()) {
        const refreshRes = await fetch(`/api/data/refresh?systemId=${systemId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          console.log('[OK] Données synchronisées depuis Enphase')

          // Mettre à jour le compteur d'actualisations
          if (refreshData.refreshCount !== undefined) {
            setRefreshCount(refreshData.refreshCount)
          }
          if (refreshData.maxRefreshes !== undefined) {
            setMaxRefreshes(refreshData.maxRefreshes)
          }
        } else {
          const errorData = await refreshRes.json()
          if (refreshRes.status === 429) {
            // IMPORTANT: Mettre à jour le compteur même en cas d'erreur 429
            setRefreshCount(maxRefreshes)
            alert(errorData.message || 'Limite quotidienne atteinte')
            // Ne pas return, on charge quand même les données existantes
          }
        }
      }

      // Ensuite, récupérer les stats mises à jour (même si refresh a échoué)
      await fetchStats()
      await fetchHistory()
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [systemId, accessToken, fetchStats, fetchHistory, isAdmin, maxRefreshes])

  // Effects
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && accessToken) {
      fetchSystemId()
      // Recharger le profil pour avoir le compteur à jour
      if (user.role === 'ADMIN') {
        reloadUserProfile()
      }
    }
  }, [user, accessToken, fetchSystemId, reloadUserProfile])

  useEffect(() => {
    if (systemId && accessToken) {
      fetchStats()
      fetchHistory()
    }
  }, [systemId, accessToken, fetchStats, fetchHistory])

  // Auto-actualisation intelligente selon le rôle
  useEffect(() => {
    if (!systemId || !accessToken) return

    let intervalId: NodeJS.Timeout

    if (isAdmin()) {
      // Admin : Actualisation toutes les heures
      intervalId = setInterval(() => {
        console.log('[SYNC] [ADMIN] Actualisation automatique des données...')
        handleRefresh()
      }, 60 * 60 * 1000) // 1 heure
    } else {
      // Viewer : Vérification légère toutes les 5 secondes (juste le timestamp)
      intervalId = setInterval(async () => {
        const hasUpdates = await checkForUpdates()
        if (hasUpdates) {
          // Recharger les données si changement détecté
          await fetchStats()
          await fetchHistory()
        }
      }, 5 * 1000) // 5 secondes - requête très légère
    }

    // Nettoyer l'intervalle quand le composant est démonté
    return () => {
      clearInterval(intervalId)
    }
  }, [systemId, accessToken, handleRefresh, checkForUpdates, fetchStats, fetchHistory, isAdmin])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Bienvenue, {user.firstName}. Consultez vos données de production solaire.
            </p>
            {!isAdmin() && (
              <p className="mt-1 text-sm text-blue-600 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                Synchronisation automatique avec l&apos;admin
              </p>
            )}
          </div>
          {systemId && isAdmin() && (
            <div className="text-right">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loadingStats || (user.role === 'ADMIN' && refreshCount >= maxRefreshes)}
              >
                {loadingStats ? 'Actualisation...' : 'Actualiser les données'}
              </Button>
              {user.role === 'ADMIN' && (
                <p className="text-sm text-gray-600 mt-2">
                  {refreshCount >= maxRefreshes ? (
                    <span className="text-red-600 font-medium">
                      [ATTENTION] Limite atteinte ({maxRefreshes}/{maxRefreshes})
                    </span>
                  ) : (
                    <span>
                      Actualisations restantes :{' '}
                      <span className="font-semibold text-blue-600">
                        {maxRefreshes - refreshCount}/{maxRefreshes}
                      </span>
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Dernière mise à jour - Mise en évidence */}
        {stats && stats.lastUpdate && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Dernière mise à jour des données</p>
                  <p className="text-lg font-bold text-blue-900">
                    {new Date(stats.lastUpdate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {(() => {
                  const diffMinutes = Math.floor(
                    (new Date().getTime() - new Date(stats.lastUpdate).getTime()) / (1000 * 60)
                  )
                  if (diffMinutes < 60)
                    return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
                  const diffHours = Math.floor(diffMinutes / 60)
                  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
                  const diffDays = Math.floor(diffHours / 24)
                  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
                })()}
              </div>
            </div>
          </Card>
        )}

        {/* Statistiques principales */}
        {loadingStats ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement des données...</p>
          </div>
        ) : !systemId ? (
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Aucun système connecté</h3>
              <p className="text-blue-700 mb-4">
                Connectez votre système Enphase pour commencer à suivre votre production solaire.
              </p>
              <Button variant="primary" onClick={() => router.push('/connections')}>
                Connecter un système
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-green-700">
                    Production Aujourd&apos;hui
                  </span>
                  <span className="text-4xl font-bold text-green-900 mt-2">
                    {stats ? formatEnergy(stats.today.production) : '0 kWh'}
                  </span>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-green-600">
                      {stats
                        ? `Puissance actuelle: ${formatPower(stats.current.powerNow)}`
                        : 'Aucune donnée'}
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      Valeur:{' '}
                      {stats
                        ? `${((stats.today.production / 1000) * PRIX_KWH_EURO).toFixed(2)} `
                        : '0.00 '}
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-gray-600 italic">
                        Calcul : Production (kWh) {PRIX_KWH_EURO} /kWh
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tarif moyen de l&apos;électricité en France 2024
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-blue-700">Production Totale</span>
                  <span className="text-4xl font-bold text-blue-900 mt-2">
                    {stats ? formatEnergy(stats.lifetime.production) : '0 kWh'}
                  </span>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm font-semibold text-green-600">
                      Valeur totale:{' '}
                      {stats
                        ? `${((stats.lifetime.production / 1000) * PRIX_KWH_EURO).toFixed(2)} `
                        : '0.00 '}
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-gray-600 italic">
                        💡 Valeur depuis l&apos;installation
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {stats && stats.system.unresolvedEvents > 0 && (
              <Card className="bg-yellow-50 border-yellow-200 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-900">Événements non résolus</h3>
                    <p className="text-xs text-yellow-700 mt-1">
                      {stats.system.unresolvedEvents} événement
                      {stats.system.unresolvedEvents > 1 ? 's' : ''} nécessite
                      {stats.system.unresolvedEvents > 1 ? 'nt' : ''} votre attention
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {}}>
                    Voir les détails
                  </Button>
                </div>
              </Card>
            )}

            {/* Fun Facts écologiques - Basé sur la production du jour */}
            {stats && stats.today.production > 0 && (
              <div className="mb-8">
                <Suspense
                  fallback={
                    <div className="bg-gray-100 rounded-lg p-6 animate-pulse">
                      <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                  }
                >
                  <EcoFacts
                    energyTodayWh={stats.today.production}
                    lifetimeEnergyWh={stats.lifetime.production}
                  />
                </Suspense>
              </div>
            )}
          </>
        )}

        {/* Historique des productions */}
        {systemId && (
          <Card className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>
                Historique des 14 derniers jours
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? 'Masquer' : 'Afficher'}
              </Button>
            </div>

            {showHistory && (
              <>
                {loadingHistory ? (
                  <p className="text-gray-500 text-center py-8" style={{ color: '#6b7280' }}>
                    Chargement de l&apos;historique...
                  </p>
                ) : history.length === 0 ? (
                  <p className="text-gray-500 text-center py-8" style={{ color: '#6b7280' }}>
                    Aucun historique disponible
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ color: '#6b7280' }}
                          >
                            Date
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ color: '#6b7280' }}
                          >
                            Production
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ color: '#6b7280' }}
                          >
                            Valeur ()
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((entry) => (
                          <tr
                            key={entry.date}
                            className={entry.available ? '' : 'bg-gray-50 opacity-50'}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900" style={{ color: '#000000' }}>
                                  {new Date(entry.date).toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                                {!entry.available && (
                                  <span
                                    className="text-xs text-gray-400"
                                    style={{ color: '#9ca3af' }}
                                  >
                                    (pas de données)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {entry.available ? formatEnergy(entry.production) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                              {entry.available ? `${entry.coutEuros.toFixed(2)} ` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                        <tr>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900"
                            style={{ color: '#000000' }}
                          >
                            TOTAL (14 jours)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                            {history
                              .reduce((sum, entry) => sum + (entry.productionKWh || 0), 0)
                              .toFixed(2)}{' '}
                            kWh
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                            {history
                              .reduce((sum, entry) => sum + (entry.coutEuros || 0), 0)
                              .toFixed(2)}{' '}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* Résumé du système - Responsive */}
        {stats && (
          <div className="mt-8">
            <Card title="Résumé du Système">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Statut du système</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        stats.system.status === 'normal'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {stats.system.status === 'normal' ? ' Normal' : stats.system.status}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Puissance installe</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.system.systemSize.toFixed(2)} kW
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Production totale</div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatEnergy(stats.lifetime.production)}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
