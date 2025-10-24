'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function ChangePasswordRequiredPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, accessToken, logout, reloadProfile } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/initial-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        // Recharger le profil utilisateur pour mettre  jour mustChangePassword
        await reloadProfile()

        // Rediriger selon le rle
        if (user?.role === 'ADMIN') {
          // Rediriger vers la connexion Enphase pour les admins (premire tape aprs changement de mot de passe)
          router.push('/connections/enphase/authorize')
        } else {
          // Super Admin et Viewer vont au dashboard
          router.push('/dashboard')
        }
      } else {
        setError(data.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h1
            className="mt-4 text-center text-3xl font-bold text-gray-900"
            style={{ color: '#000000' }}
          >
            Changement de mot de passe requis
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600" style={{ color: '#6b7280' }}>
            Pour des raisons de scurit, vous devez changer votre mot de passe avant de continuer
          </p>
        </div>

        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              <p className="text-sm">
                <strong>Bienvenue {user.firstName} !</strong>
                <br />
                Votre mot de passe temporaire doit tre chang.
              </p>
            </div>

            <Input
              label="Nouveau mot de passe"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder=""
            />

            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder=""
            />

            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Le mot de passe doit contenir :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Au moins 8 caractres</li>
                <li>Une lettre majuscule</li>
                <li>Une lettre minuscule</li>
                <li>Un chiffre</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="submit" variant="primary" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Changement...' : 'Changer le mot de passe'}
              </Button>
              <Button type="button" variant="outline" onClick={logout}>
                Se dconnecter
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
