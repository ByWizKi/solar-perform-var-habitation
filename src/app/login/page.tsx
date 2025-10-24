'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import VarHabitatLogo from '@/components/VarHabitatLogo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
      // La redirection est gérée par AuthContext
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Conteneur principal avec largeur maximale pour écrans ultra-wide */}
      <div className="w-full max-w-[1600px] mx-auto min-h-screen flex flex-col lg:flex-row">
        {/* Partie gauche - Couleur unie professionnelle */}
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
          style={{ backgroundColor: '#4a9fbd' }}
        >
          <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
            <div className="max-w-xl w-full">
              <h1 className="text-4xl xl:text-5xl font-bold mb-6 text-white drop-shadow-lg">
                Bienvenue sur
                <br />
                <span className="text-white">Var Habitat</span>
              </h1>
              <p className="text-xl text-white mb-8 leading-relaxed font-medium drop-shadow-md">
                Votre solution de suivi de production solaire en temps réel
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <svg
                    className="w-7 h-7 mt-1 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-white drop-shadow-md">
                      Supervision en temps réel
                    </h3>
                    <p className="text-white text-base leading-relaxed drop-shadow-sm">
                      Suivez votre production solaire minute par minute depuis n&apos;importe où
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg
                    className="w-7 h-7 mt-1 flex-shrink-0 drop-shadow-md"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-white drop-shadow-md">
                      Gestion hiérarchique
                    </h3>
                    <p className="text-white text-base leading-relaxed drop-shadow-sm">
                      Administrateurs, superviseurs et observateurs - chacun son rôle
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg
                    className="w-7 h-7 mt-1 flex-shrink-0 drop-shadow-md"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-white drop-shadow-md">
                      Données complètes
                    </h3>
                    <p className="text-white text-base leading-relaxed drop-shadow-sm">
                      Historique 14 jours, statistiques détaillées et analyses de performance
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/30">
                <p className="text-sm text-white text-center leading-relaxed drop-shadow-sm font-medium">
                  Plateforme développée et pilotée par{' '}
                  <span className="font-bold text-white">SolarPerform</span>
                </p>
              </div>
            </div>
          </div>
          {/* Pattern décoratif */}
          <div className="absolute bottom-0 right-0 opacity-10">
            <svg width="400" height="400" viewBox="0 0 400 400">
              <circle cx="200" cy="200" r="150" fill="white" opacity="0.1" />
              <circle cx="200" cy="200" r="100" fill="white" opacity="0.1" />
              <circle cx="200" cy="200" r="50" fill="white" opacity="0.1" />
            </svg>
          </div>
        </div>

        {/* Partie droite - Formulaire */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center px-6 sm:px-8 lg:px-12 xl:px-16 bg-gray-50 py-12">
          <div className="max-w-md w-full">
            {/* Logo mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex justify-center mb-4">
                <VarHabitatLogo className="h-24 w-64" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Var Habitat</h1>
              <p className="text-sm text-gray-600 mt-2">Suivi de production solaire</p>
            </div>

            {/* Logo desktop */}
            <div className="hidden lg:block text-center mb-10">
              <div className="flex justify-center mb-6">
                <VarHabitatLogo className="h-32 w-80" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Connexion</h2>
              <p className="mt-2 text-gray-600">Accédez à votre espace de monitoring</p>
            </div>

            {/* Carte de connexion */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-vh-error text-vh-error px-4 py-3 rounded-lg flex items-start">
                    <svg
                      className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm leading-relaxed">{error}</span>
                  </div>
                )}

                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Nom d&apos;utilisateur
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="votre-nom-utilisateur"
                    className="w-full px-4 py-3 text-base bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{ color: '#000000', borderColor: '#e5e7eb' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#4a9fbd')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Votre mot de passe"
                      className="w-full px-4 py-3 pr-12 text-base bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                      style={{ color: '#000000', borderColor: '#e5e7eb' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#4a9fbd')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-vh-gray hover:text-vh-blue transition-colors"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 text-lg text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ backgroundColor: '#4a9fbd' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2e5a7a')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4a9fbd')}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connexion en cours...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Solution{' '}
                  <span className="font-semibold" style={{ color: '#4a9fbd' }}>
                    Var Habitat
                  </span>{' '}
                  dveloppe par{' '}
                  <span className="font-semibold" style={{ color: '#7b68a6' }}>
                    SolarPerform
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
