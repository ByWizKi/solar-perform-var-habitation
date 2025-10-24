'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import VarHabitatLogo from './VarHabitatLogo'
import { cn } from '@/lib/utils'

export default function Navigation() {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getNavItems = () => {
    if (!user) return []

    const items = []

    // Super Admin a son propre dashboard
    if (isSuperAdmin()) {
      items.push({ name: 'Dashboard', href: '/super-admin-dashboard', icon: 'dashboard' })
    } else {
      items.push({ name: 'Dashboard', href: '/dashboard', icon: 'dashboard' })
    }

    // Seulement les admins peuvent voir les connexions (pas les super admins)
    if (isAdmin() && !isSuperAdmin()) {
      items.push({ name: 'Connexions', href: '/connections', icon: 'connection' })
    }

    // Seulement les admins et super admins peuvent voir l'administration
    if (isAdmin() || isSuperAdmin()) {
      items.push({ name: 'Administration', href: '/admin', icon: 'admin' })
    }

    items.push({ name: 'Profil', href: '/profile', icon: 'profile' })

    return items
  }

  const navItems = getNavItems()

  const getIcon = (iconName: string) => {
    const className = 'w-5 h-5'

    switch (iconName) {
      case 'dashboard':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        )
      case 'connection':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )
      case 'admin':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )
      case 'profile':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )
      default:
        return null
    }
  }

  const getRoleBadge = () => {
    if (!user) return null

    const badgeColors = {
      SUPER_ADMIN: 'bg-gradient-to-r from-purple-500 to-pink-500',
      ADMIN: 'bg-gradient-to-r from-vh-purple to-vh-blue',
      VIEWER: 'bg-gradient-to-r from-vh-blue to-vh-blue-light',
    }

    const roleLabels = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Administrateur',
      VIEWER: 'Observateur',
    }

    return (
      <span
        className={cn(
          'px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap',
          badgeColors[user.role as keyof typeof badgeColors]
        )}
      >
        {roleLabels[user.role as keyof typeof roleLabels]}
      </span>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <VarHabitatLogo className="h-12 w-40" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-vh-purple/10 via-vh-blue/10 to-vh-blue-light/10 text-vh-blue'
                      : 'text-vh-gray-dark hover:bg-vh-gray-light hover:text-vh-blue'
                  )}
                >
                  {getIcon(item.icon)}
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* User info et actions (Desktop) */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            {user && (
              <>
                {/* Badge de rle */}
                {getRoleBadge()}

                {/* Nom de l'utilisateur */}
                <div className="hidden xl:flex flex-col items-end">
                  <span className="text-sm font-semibold text-vh-gray-dark">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-xs text-vh-gray">@{user.username}</span>
                </div>

                {/* Bouton dconnexion */}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-vh-gray-dark hover:text-vh-error border-2 border-vh-gray-light hover:border-vh-error rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden xl:inline">Dconnexion</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-3">
            {user && getRoleBadge()}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-vh-gray-dark hover:bg-vh-gray-light focus:outline-none"
            >
              <span className="sr-only">Ouvrir le menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {/* User info mobile */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-vh-gray-light rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-vh-gray-dark">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-vh-gray">@{user.username}</p>
                </div>
              </div>
            )}

            {/* Nav items mobile */}
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-vh-purple/10 via-vh-blue/10 to-vh-blue-light/10 text-vh-blue'
                      : 'text-vh-gray-dark hover:bg-vh-gray-light'
                  )}
                >
                  {getIcon(item.icon)}
                  {item.name}
                </Link>
              )
            })}

            {/* Logout button mobile */}
            {user && (
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-vh-error hover:bg-red-50 transition-colors mt-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Dconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
