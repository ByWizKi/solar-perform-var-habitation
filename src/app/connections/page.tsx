'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'

interface Connection {
  id: string
  service: string
  systemId?: string
  isActive: boolean
  lastSyncAt?: string
  createdAt: string
}

export default function ConnectionsPage() {
  const { user, isLoading, accessToken } = useAuth()
  const router = useRouter()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && accessToken) {
      fetchConnections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken])

  // Redirection automatique vers Enphase pour les admins sans connexion
  useEffect(() => {
    if (
      !loading &&
      user &&
      user.role === 'ADMIN' &&
      connections.length === 0 &&
      !user.mustChangePassword
    ) {
      console.log('[SYNC] Admin sans connexion, redirection automatique vers Enphase...')
      // Petit dlai pour viter une redirection trop abrupte
      const timer = setTimeout(() => {
        router.push('/connections/enphase/authorize')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, user, connections, router])

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/connections', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des connexions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectEnphase = () => {
    // Rediriger vers la page de connexion Enphase
    router.push('/connections/enphase/authorize')
  }

  const handleSync = async (connectionId: string, fullSync: boolean = false) => {
    try {
      setSyncing(connectionId)
      const url = fullSync
        ? `/api/connections/${connectionId}/sync?full=true`
        : `/api/connections/${connectionId}/sync`

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        await fetchConnections()
        alert(data.message)
      } else {
        const error = await res.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error)
      alert('Erreur lors de la synchronisation')
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = (connection: Connection) => {
    setConnectionToDelete(connection)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!connectionToDelete) return

    try {
      const res = await fetch(`/api/connections/${connectionToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await res.json()

      if (res.ok) {
        console.log('[OK] Suppression russie:', data)
        // Rafrachir la liste des connexions
        await fetchConnections()
        setDeleteModalOpen(false)
        setConnectionToDelete(null)
        // Afficher un message de succs
        alert(
          `Service ${connectionToDelete.service.toUpperCase()} dconnect avec succs.\n\n` +
            `${data.deletedRecords.total} enregistrements supprims au total.`
        )
      } else {
        console.error('[ERREUR] Erreur lors de la suppression:', data)
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('[ERREUR] Erreur lors de la dconnexion:', error)
      alert('Erreur lors de la dconnexion du service')
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-scréeen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  // Seul Enphase est disponible
  const services = [
    {
      id: 'enphase',
      name: 'Enphase Energy',
      description:
        'Connectez vos micro-onduleurs Enphase pour suivre la production solaire en temps réel',
      logo: '/logos/enphase.svg',
      available: true,
    },
  ]

  const getConnection = (serviceId: string) => {
    return connections.find((c) => c.service === serviceId)
  }

  return (
    <div className="min-h-scréeen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ color: '#000000' }}>
            Connexion Enphase
          </h1>
          <p className="mt-2 text-gray-600" style={{ color: '#6b7280' }}>
            Connectez votre système Enphase Energy pour suivre votre production solaire en temps
            rel.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement des connexions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const connection = getConnection(service.id)
              const isConnected = !!connection

              return (
                <Card key={service.id} className="relative">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3
                          className="text-lg font-semibold text-gray-900"
                          style={{ color: '#000000' }}
                        >
                          {service.name}
                        </h3>
                        {isConnected && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                            Connect
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 flex-grow">{service.description}</p>

                    {isConnected && connection ? (
                      <div className="space-y-2">
                        {connection.systemId && (
                          <p className="text-xs text-gray-500">Systme ID: {connection.systemId}</p>
                        )}
                        {connection.lastSyncAt && (
                          <p className="text-xs text-gray-500">
                            Dernière sync:{' '}
                            {new Date(connection.lastSyncAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        <div className="flex space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleSync(connection.id)}
                            disabled={syncing === connection.id}
                          >
                            {syncing === connection.id ? 'Synchronisation...' : 'Resynchroniser'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDisconnect(connection)}
                          >
                            Dconnecter
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {service.available ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            onClick={service.id === 'enphase' ? handleConnectEnphase : () => {}}
                          >
                            Connecter
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full" disabled>
                            Bientt disponible
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {!loading && connections.length === 0 && (
          <Card className="mt-8">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900" style={{ color: '#000000' }}>
                Aucune connexion
              </h3>
              <p className="mt-1 text-sm text-gray-500" style={{ color: '#6b7280' }}>
                {user?.role === 'ADMIN'
                  ? 'Redirection vers la connexion Enphase...'
                  : 'Connectez votre premier système solaire pour commencer.'}
              </p>
              {user?.role === 'ADMIN' && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {connectionToDelete && (
        <ConfirmDeleteModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setConnectionToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
          serviceName={connectionToDelete.service.toUpperCase()}
          confirmText={connectionToDelete.service}
          title="Dconnecter le service"
          description={`Vous tes sur le point de supprimer votre connexion ${connectionToDelete.service.toUpperCase()}. Cette action est irrversible.`}
          warningMessage={`Toutes les données collectes depuis le ${new Date(
            connectionToDelete.createdAt
          ).toLocaleDateString(
            'fr-FR'
          )} seront définitivement supprimées de la base de données. Cette action ne peut pas être annulée.`}
        />
      )}
    </div>
  )
}
