'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function ProfilePage() {
  const { user, isLoading, changePassword } = useAuth()
  const router = useRouter()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    setIsChangingPassword(true)

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      setMessage('Mot de passe modifi avec succs. Reconnexion...')
      // L'utilisateur sera automatiquement dconnect par changePassword
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsChangingPassword(false)
    }
  }

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

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Profil</h1>

        <div className="space-y-6">
          {/* Informations personnelles */}
          <Card title="Informations personnelles">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Prnom</p>
                  <p className="mt-1 text-lg text-gray-900">{user.firstName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nom</p>
                  <p className="mt-1 text-lg text-gray-900">{user.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nom d&apos;utilisateur</p>
                <p className="mt-1 text-lg text-gray-900">{user.username}</p>
              </div>
            </div>
          </Card>

          {/* Changer le mot de passe */}
          <Card title="Changer le mot de passe">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {message}
                </div>
              )}

              <Input
                label="Mot de passe actuel"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
                placeholder=""
              />

              <Input
                label="Nouveau mot de passe"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                placeholder=""
              />

              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                required
                placeholder=""
              />

              <div className="text-sm text-gray-600">
                <p>Le nouveau mot de passe doit contenir :</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Au moins 8 caractres</li>
                  <li>Une majuscule et une minuscule</li>
                  <li>Un chiffre</li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isChangingPassword}
                className="w-full"
              >
                {isChangingPassword ? 'Modification...' : 'Changer le mot de passe'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
