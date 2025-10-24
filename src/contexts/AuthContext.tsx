'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User as UserType, UserRole } from '@/types'

type User = UserType

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  reloadProfile: () => Promise<void>
  isSuperAdmin: () => boolean
  isAdmin: () => boolean
  isViewer: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Charger l'utilisateur au dmarrage
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      setAccessToken(token)
      fetchUserProfile(token)
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Vérifier si le changement de mot de passe est requis
  useEffect(() => {
    if (
      user &&
      user.mustChangePassword &&
      window.location.pathname !== '/change-password-required'
    ) {
      router.push('/change-password-required')
    }
  }, [user, router])

  // Vérifier priodiquement la validit du token
  useEffect(() => {
    if (!accessToken || !user) return

    const checkTokenValidity = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (res.status === 401) {
          // Token expir, essayer de refresh
          const refreshed = await refreshToken()
          if (!refreshed) {
            // Impossible de rafrachir, rediriger vers login
            router.push('/login')
          }
        }
      } catch (error) {
        // Erreur réseau, on ignore pour ne pas dconnecter l'utilisateur
        console.error('Erreur lors de la vérification du token:', error)
      }
    }

    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user])

  // Rcuprer le profil utilisateur
  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else if (res.status === 401) {
        // Token expir, essayer de refresh
        const refreshed = await refreshToken()
        if (!refreshed) {
          // Impossible de rafrachir, rediriger vers login
          router.push('/login')
        }
      } else {
        // Autre erreur, dconnecter
        await logout()
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      await logout()
    } finally {
      setIsLoading(false)
    }
  }

  // Connexion
  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Erreur lors de la connexion')
    }

    // Sauvegarder les tokens (sessionStorage pour isolation par onglet)
    sessionStorage.setItem('accessToken', data.accessToken)
    sessionStorage.setItem('refreshToken', data.refreshToken)

    setAccessToken(data.accessToken)
    setUser(data.user)

    // Vérifier si le changement de mot de passe est requis
    if (data.user.mustChangePassword) {
      router.push('/change-password-required')
    } else {
      router.push('/dashboard')
    }
  }

  // Rafrachir le token
  const refreshToken = async (): Promise<boolean> => {
    const refreshTok = sessionStorage.getItem('refreshToken')

    if (!refreshTok) {
      setIsLoading(false)
      return false
    }

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTok }),
      })

      if (res.ok) {
        const data = await res.json()
        sessionStorage.setItem('accessToken', data.accessToken)
        sessionStorage.setItem('refreshToken', data.refreshToken)
        setAccessToken(data.accessToken)
        setUser(data.user)
        return true
      } else {
        // Refresh token invalide, dconnecter
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('refreshToken')
        setAccessToken(null)
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Erreur lors du rafrachissement du token:', error)
      return false
    }
  }

  // Dconnexion
  const logout = async () => {
    const refreshTok = sessionStorage.getItem('refreshToken')

    if (refreshTok) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refreshTok }),
        })
      } catch (error) {
        console.error('Erreur lors de la dconnexion:', error)
      }
    }

    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    setAccessToken(null)
    setUser(null)
    router.push('/login')
  }

  // Changer le mot de passe
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!accessToken) {
      throw new Error('Non authentifi')
    }

    const res = await fetch('/api/auth/password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Erreur lors du changement de mot de passe')
    }

    // Dconnecter aprs le changement de mot de passe
    await logout()
  }

  // Recharger le profil utilisateur
  const reloadProfile = async () => {
    if (!accessToken) return
    await fetchUserProfile(accessToken)
  }

  // Fonctions de vérification de rle
  const isSuperAdmin = () => user?.role === UserRole.SUPER_ADMIN
  const isAdmin = () => user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
  const isViewer = () => user?.role === UserRole.VIEWER

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        logout,
        refreshToken,
        changePassword,
        reloadProfile,
        isSuperAdmin,
        isAdmin,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
