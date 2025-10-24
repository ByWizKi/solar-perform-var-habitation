'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface SystemData {
  timestamp: string
  systemName: string | null
  systemSize: number | null
  status: string | null
  energyToday: number | null
  energyLifetime: number | null
  powerNow: number | null
  consumptionToday: number | null
  consumptionNow: number | null
  batteryPercentage: number | null
  batteryPowerNow: number | null
}

interface SystemInfo {
  connectionId: string
  systemId: string
  service: string
  owner: {
    id: string
    username: string
    firstName: string
    lastName: string
    role: string
  }
  lastSync: string | null
  data: SystemData | null
}

export default function SuperAdminDashboardPage() {
  const { user, isLoading, accessToken, isSuperAdmin } = useAuth()
  const router = useRouter()
  const [systems, setSystems] = useState<SystemInfo[]>([])
  const [loadingSystems, setLoadingSystems] = useState(true)
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null)

  // Redirection si pas super admin
  useEffect(() => {
    if (!isLoading && (!user || !isSuperAdmin())) {
      router.push('/dashboard')
    }
  }, [user, isLoading, isSuperAdmin, router])

  const formatEnergy = useCallback((wh: number | null) => {
    if (!wh || wh === 0) return '0 Wh'
    if (wh >= 1000000000) {
      return `${(wh / 1000000000).toFixed(2)} GWh`
    } else if (wh >= 1000000) {
      return `${(wh / 1000000).toFixed(2)} MWh`
    } else if (wh >= 1000) {
      return `${(wh / 1000).toFixed(2)} kWh`
    } else {
      return `${wh.toFixed(0)} Wh`
    }
  }, [])

  const formatPower = useCallback((w: number | null) => {
    if (!w || w === 0) return '0 W'
    if (w >= 1000000) {
      return `${(w / 1000000).toFixed(2)} MW`
    } else if (w >= 1000) {
      return `${(w / 1000).toFixed(2)} kW`
    } else {
      return `${w.toFixed(0)} W`
    }
  }, [])

  const fetchSystems = useCallback(async () => {
    try {
      setLoadingSystems(true)
      const res = await fetch('/api/admin/systems', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setSystems(data.systems || [])
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des systèmes:', error)
    } finally {
      setLoadingSystems(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (user && accessToken && isSuperAdmin()) {
      fetchSystems()
    }
  }, [user, accessToken, isSuperAdmin, fetchSystems])

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ color: '#000000' }}>
            Dashboard Super Admin
          </h1>
          <p className="mt-2 text-gray-600" style={{ color: '#6b7280' }}>
            Vue d&apos;ensemble de tous les systèmes solaires connects
          </p>
        </div>

        {loadingSystems ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement des systèmes...</p>
          </div>
        ) : systems.length === 0 ? (
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Aucun système connect</h3>
              <p className="text-blue-700">
                Les administrateurs doivent connecter leurs systèmes Enphase pour que vous puissiez
                voir les données ici.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <div className="flex flex-col">
                  <span className="text-sm font-medium opacity-90">Systèmes actifs</span>
                  <span className="text-4xl font-bold mt-2">{systems.length}</span>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
                <div className="flex flex-col">
                  <span className="text-sm font-medium opacity-90">
                    Production totale aujourd&apos;hui
                  </span>
                  <span className="text-4xl font-bold mt-2">
                    {formatEnergy(
                      systems.reduce((sum, sys) => sum + (sys.data?.energyToday || 0), 0)
                    )}
                  </span>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                <div className="flex flex-col">
                  <span className="text-sm font-medium opacity-90">Puissance actuelle totale</span>
                  <span className="text-4xl font-bold mt-2">
                    {formatPower(systems.reduce((sum, sys) => sum + (sys.data?.powerNow || 0), 0))}
                  </span>
                </div>
              </Card>
            </div>

            {/* Liste des systèmes */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">Systèmes solaires</h2>
              <div className="space-y-4">
                {systems.map((system) => (
                  <div
                    key={system.systemId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className="text-lg font-semibold text-gray-900"
                            style={{ color: '#000000' }}
                          >
                            {system.data?.systemName || `Système ${system.systemId}`}
                          </h3>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {system.service}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600" style={{ color: '#6b7280' }}>
                          Propritaire: {system.owner.firstName} {system.owner.lastName} (
                          {system.owner.username})
                        </p>
                        {system.data?.systemSize && (
                          <p className="text-sm text-gray-600" style={{ color: '#6b7280' }}>
                            Puissance installe: {system.data.systemSize.toFixed(2)} kW
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          system.data?.status === 'normal'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {system.data?.status || 'N/A'}
                      </span>
                    </div>

                    {system.data ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500" style={{ color: '#6b7280' }}>
                            Production aujourd&apos;hui
                          </p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatEnergy(system.data.energyToday)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500" style={{ color: '#6b7280' }}>
                            Puissance actuelle
                          </p>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatPower(system.data.powerNow)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500" style={{ color: '#6b7280' }}>
                            Production totale
                          </p>
                          <p
                            className="text-lg font-semibold text-gray-900"
                            style={{ color: '#000000' }}
                          >
                            {formatEnergy(system.data.energyLifetime)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-4" style={{ color: '#6b7280' }}>
                        Aucune donne disponible
                      </p>
                    )}

                    {system.lastSync && (
                      <p className="text-xs text-gray-400 mt-3">
                        Dernière synchronisation:{' '}
                        {new Date(system.lastSync).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
