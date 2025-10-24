/**
 * Système de rate limiting pour protéger contre les attaques brute-force
 * Limite le nombre de tentatives de connexion par IP/username
 */

interface RateLimitEntry {
  count: number
  resetAt: number
  lockedUntil?: number
}

// Store en mémoire (pour production, utiliser Redis ou base de données)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const RATE_LIMIT_CONFIG = {
  LOGIN: {
    MAX_ATTEMPTS: 5, // Nombre maximum de tentatives
    WINDOW_MS: 15 * 60 * 1000, // Fenêtre de 15 minutes
    LOCKOUT_MS: 15 * 60 * 1000, // Durée du verrouillage : 15 minutes
  },
  API: {
    MAX_ATTEMPTS: 100, // Requêtes API génériques
    WINDOW_MS: 60 * 1000, // 1 minute
    LOCKOUT_MS: 60 * 1000, // 1 minute
  },
}

/**
 * Nettoie les entrées expirées du store (appelé périodiquement)
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now && (!entry.lockedUntil || entry.lockedUntil < now)) {
      rateLimitStore.delete(key)
    }
  }
}

// Nettoyage automatique toutes les 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)

/**
 * Génère une clé unique pour le rate limiting
 */
function generateKey(identifier: string, type: 'LOGIN' | 'API'): string {
  return `${type}:${identifier}`
}

/**
 * Vérifie si une requête est autorisée selon les limites
 */
export function checkRateLimit(
  identifier: string,
  type: 'LOGIN' | 'API' = 'LOGIN'
): {
  allowed: boolean
  remaining: number
  resetAt: number
  lockedUntil?: number
} {
  const config = RATE_LIMIT_CONFIG[type]
  const key = generateKey(identifier, type)
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Si pas d'entrée ou fenêtre expirée, créer nouvelle entrée
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.WINDOW_MS,
    }
    rateLimitStore.set(key, entry)
  }

  // Vérifier si verrouillé
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      lockedUntil: entry.lockedUntil,
    }
  }

  // Si verrouillage expiré, réinitialiser
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    entry.count = 0
    entry.lockedUntil = undefined
    entry.resetAt = now + config.WINDOW_MS
  }

  // Vérifier la limite
  if (entry.count >= config.MAX_ATTEMPTS) {
    // Verrouiller
    entry.lockedUntil = now + config.LOCKOUT_MS
    rateLimitStore.set(key, entry)

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      lockedUntil: entry.lockedUntil,
    }
  }

  return {
    allowed: true,
    remaining: config.MAX_ATTEMPTS - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Incrémente le compteur après une tentative
 */
export function incréementRateLimit(identifier: string, type: 'LOGIN' | 'API' = 'LOGIN'): void {
  const key = generateKey(identifier, type)
  const entry = rateLimitStore.get(key)

  if (entry) {
    entry.count++
    rateLimitStore.set(key, entry)
  }
}

/**
 * Réinitialise le compteur (après succès de connexion par exemple)
 */
export function resetRateLimit(identifier: string, type: 'LOGIN' | 'API' = 'LOGIN'): void {
  const key = generateKey(identifier, type)
  rateLimitStore.delete(key)
}

/**
 * Obtient le temps restant avant réinitialisation (en secondes)
 */
export function getRemainingTime(identifier: string, type: 'LOGIN' | 'API' = 'LOGIN'): number {
  const key = generateKey(identifier, type)
  const entry = rateLimitStore.get(key)

  if (!entry) return 0

  const now = Date.now()

  // Si verrouillé, retourner le temps jusqu'à la fin du verrouillage
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return Math.ceil((entry.lockedUntil - now) / 1000)
  }

  // Sinon, retourner le temps jusqu'à la réinitialisation de la fenêtre
  if (entry.resetAt > now) {
    return Math.ceil((entry.resetAt - now) / 1000)
  }

  return 0
}

/**
 * Obtient des statistiques pour le monitoring
 */
export function getRateLimitStats() {
  return {
    totalEntries: rateLimitStore.size,
    entries: Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
      key,
      count: entry.count,
      resetAt: new Date(entry.resetAt).toISOString(),
      lockedUntil: entry.lockedUntil ? new Date(entry.lockedUntil).toISOString() : null,
    })),
  }
}

