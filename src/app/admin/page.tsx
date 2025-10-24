'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { UserRole } from '@/types'

interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  role: UserRole
  créeatedById?: string | null
  créeatedAt: string
}

export default function AdminPage() {
  const { user, accessToken, isLoading, isSuperAdmin, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showCréeateForm, setShowCréeateForm] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    // Super Admin crée des Admins, Admin crée des Viewers
    role: isSuperAdmin() ? UserRole.ADMIN : UserRole.VIEWER,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirection si pas admin
  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin() && !isSuperAdmin()))) {
      router.push('/dashboard')
    }
  }, [user, isLoading, isAdmin, isSuperAdmin, router])

  // Charger les utilisateurs
  useEffect(() => {
    if (user && accessToken && (isAdmin() || isSuperAdmin())) {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      } else {
        setError('Erreur lors du chargement des utilisateurs')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleCréeateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Utilisateur cr avec succs')
        setFormData({
          username: '',
          password: '',
          firstName: '',
          lastName: '',
          // Super Admin crée des Admins, Admin crée des Viewers
          role: isSuperAdmin() ? UserRole.ADMIN : UserRole.VIEWER,
        })
        setShowCréeateForm(false)
        fetchUsers()
      } else {
        setError(data.error || "Erreur lors de la cration de l'utilisateur")
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError("Erreur lors de la cration de l'utilisateur")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('tes-vous sr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        setSuccess('Utilisateur supprim avec succs')
        fetchUsers()
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de la suppression de l'utilisateur")
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError("Erreur lors de la suppression de l'utilisateur")
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin'
      case UserRole.ADMIN:
        return 'Administrateur'
      case UserRole.VIEWER:
        return 'Visualisateur'
      default:
        return role
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800'
      case UserRole.ADMIN:
        return 'bg-blue-100 text-blue-800'
      case UserRole.VIEWER:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ color: '#000000' }}>
              Administration
            </h1>
            <p className="mt-2 text-gray-600" style={{ color: '#6b7280' }}>
              Grez les utilisateurs de la plateforme
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCréeateForm(!showCréeateForm)}>
            {showCréeateForm ? 'Annuler' : 'Créer un utilisateur'}
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <p className="text-green-800">{success}</p>
          </Card>
        )}

        {/* Formulaire de cration */}
        {showCréeateForm && (
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#000000' }}>
              Créer un nouvel utilisateur
            </h2>
            <form onSubmit={handleCréeateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Prnom"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Nom"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Nom d'utilisateur"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
              />
              <Input
                label="Mot de passe"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ color: '#374151' }}
                >
                  Rle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ color: '#000000' }}
                >
                  {isSuperAdmin() && <option value={UserRole.ADMIN}>Administrateur</option>}
                  {!isSuperAdmin() && isAdmin() && (
                    <option value={UserRole.VIEWER}>Visualisateur</option>
                  )}
                </select>
              </div>
              <div className="flex gap-4">
                <Button type="submit" variant="primary">
                  Créer l&apos;utilisateur
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCréeateForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Liste des utilisateurs */}
        <Card>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#000000' }}>
            Utilisateurs
          </h2>
          {loadingUsers ? (
            <p className="text-gray-500 text-center py-8">Chargement...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun utilisateur</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom d&apos;utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cr le
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="text-sm font-medium text-gray-900"
                          style={{ color: '#000000' }}
                        >
                          {u.firstName} {u.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500" style={{ color: '#6b7280' }}>
                          {u.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                            u.role
                          )}`}
                        >
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        style={{ color: '#6b7280' }}
                      >
                        {new Date(u.créeatedAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {u.id !== user.id && u.role !== UserRole.SUPER_ADMIN && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
