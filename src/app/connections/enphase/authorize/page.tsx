'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function EnphaseAuthorizePage() {
  const { accessToken } = useAuth()
  const router = useRouter()
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken) {
      fetchAuthUrl()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const fetchAuthUrl = async () => {
    try {
      const res = await fetch('/api/connections/enphase/authorize', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()

        // Si dj connect, rediriger vers le dashboard
        if (data.alreadyConnected) {
          console.log('[OK] Connexion Enphase existante détectée, redirection...')
          router.push(data.redirectUrl || '/dashboard')
          return
        }

        setAuthUrl(data.authUrl)
      } else {
        setError('Erreur lors de la gnration de l&apos;URL d&apos;autorisation')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleAuthorize = () => {
    if (authUrl) {
      window.location.href = authUrl
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connexion  Enphase Energy</h2>

            {loading ? (
              <p className="text-gray-600">Chargement...</p>
            ) : error ? (
              <div className="space-y-4">
                <p className="text-red-600">{error}</p>
                <Button variant="outline" onClick={() => router.push('/connections')}>
                  Retour
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">
                  Vous allez tre redirig vers Enphase Energy pour autoriser l&apos;accs  vos
                  données de production solaire.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Informations requises</h3>
                  <ul className="text-sm text-blue-800 text-left space-y-1">
                    <li> Identifiants Enlighten (compte Enphase)</li>
                    <li> Autorisation d&apos;accs aux données du système</li>
                  </ul>
                </div>

                <Button variant="primary" onClick={handleAuthorize} className="w-full">
                  Continuer vers Enphase
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/connections')}
                  className="w-full"
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
