/**
 * Validation et configuration des variables d'environnement
 * Ce fichier s'exécute UNE SEULE FOIS au démarrage pour garantir que toutes les variables
 * nécessaires sont présentes et valides (pattern singleton pour performance)
 */

// Flag pour éviter la validation multiple (performance)
let isValidated = false

// Liste des variables d'environnement obligatoires
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENPHASE_CLIENT_ID',
  'ENPHASE_CLIENT_SECRET',
  'ENPHASE_API_KEY',
] as const

/**
 * Valide les variables d'environnement (exécuté une seule fois)
 */
function validateEnv() {
  // Si déjà validé, skip (optimisation performance)
  if (isValidated) {
    return
  }

  // Vérifier la présence de toutes les variables obligatoires
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(
        `ERREUR DE CONFIGURATION: Variable d'environnement manquante: ${envVar}\n` +
          `Consultez .env.example pour la configuration requise`
      )
    }
  }

  // Validation spécifique du format de DATABASE_URL
  if (!process.env.DATABASE_URL!.startsWith('postgresql://')) {
    throw new Error(
      `ERREUR DE CONFIGURATION: DATABASE_URL doit être une URL PostgreSQL valide\n` +
        `Format attendu: postgresql://user:password@host:port/database\n` +
        `Reçu: ${process.env.DATABASE_URL!.substring(0, 20)}...`
    )
  }

  // Validation de la longueur minimale des secrets JWT (sécurité)
  const MIN_SECRET_LENGTH = 32

  if (process.env.JWT_SECRET!.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `ERREUR DE SECURITE: JWT_SECRET doit faire au moins ${MIN_SECRET_LENGTH} caractères\n` +
        `Longueur actuelle: ${process.env.JWT_SECRET!.length} caractères\n` +
        `Générez un secret fort avec: openssl rand -base64 32`
    )
  }

  if (process.env.JWT_REFRESH_SECRET!.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `ERREUR DE SECURITE: JWT_REFRESH_SECRET doit faire au moins ${MIN_SECRET_LENGTH} caractères\n` +
        `Longueur actuelle: ${process.env.JWT_REFRESH_SECRET!.length} caractères\n` +
        `Générez un secret fort avec: openssl rand -base64 32`
    )
  }

  // Avertissement si les secrets sont identiques
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.warn(
      `AVERTISSEMENT DE SECURITE: JWT_SECRET et JWT_REFRESH_SECRET sont identiques\n` +
        `Il est recommandé d'utiliser des secrets différents pour chaque type de token`
    )
  }

  // Validation de l'URL de l'application en production
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://localhost')
  ) {
    throw new Error(
      `ERREUR DE CONFIGURATION: NEXT_PUBLIC_APP_URL ne peut pas être localhost en production\n` +
        `Valeur actuelle: ${process.env.NEXT_PUBLIC_APP_URL}`
    )
  }

  // Log de confirmation du chargement (uniquement en développement, une seule fois)
  if (process.env.NODE_ENV === 'development') {
    console.log('[ENV] Variables d\'environnement validées avec succès')
  }

  // Marquer comme validé pour éviter la revalidation
  isValidated = true
}

// Exécuter la validation au premier import
validateEnv()

// Export typé et sécurisé des variables d'environnement
export const env = {
  // Base de données
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,

  // Application
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Enphase API
  ENPHASE_CLIENT_ID: process.env.ENPHASE_CLIENT_ID!,
  ENPHASE_CLIENT_SECRET: process.env.ENPHASE_CLIENT_SECRET!,
  ENPHASE_API_KEY: process.env.ENPHASE_API_KEY!,
  ENPHASE_REDIRECT_URI:
    process.env.ENPHASE_REDIRECT_URI || 'http://localhost:3000/api/connections/enphase/callback',
} as const

// Type pour TypeScript
export type Env = typeof env

