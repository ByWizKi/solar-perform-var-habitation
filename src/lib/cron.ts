import cron from 'node-cron'
import { prisma } from './prisma'

let isInitialized = false

/**
 * Initialise les tches planifies
 *  appeler une seule fois au dmarrage de l'application
 *
 * Note: Les tches de synchronisation Enphase sont gres manuellement
 * via le bouton "Actualiser" dans le dashboard pour les admins.
 */
export function initCronJobs() {
  if (isInitialized) {
    console.log(' Les tches planifies sont dj initialises')
    return
  }

  // Tche quotidienne  23h59 - Nettoyer les tokens expirs et rinitialiser les compteurs
  cron.schedule(
    '59 23 * * *',
    async () => {
      console.log(' Excution de la tche quotidienne de maintenance...')

      try {
        // 1. Nettoyer les refresh tokens expirs
        const tokensResult = await prisma.refreshToken.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        })
        console.log(`[OK] ${tokensResult.count} token(s) expir(s) supprim(s)`)

        // 2. Rinitialiser les compteurs d'actualisations quotidiennes pour tous les admins
        const refreshResult = await prisma.user.updateMany({
          where: {
            role: 'ADMIN',
          },
          data: {
            dailyRefreshCount: 0,
          },
        })
        console.log(`[OK] ${refreshResult.count} compteur(s) d'actualisation rinitialis(s)`)
      } catch (error) {
        console.error('[ERREUR] Erreur lors de la maintenance:', error)
      }
    },
    {
      timezone: 'Europe/Paris',
    }
  )

  isInitialized = true
  console.log('[OK] Tches planifies initialises:')
  console.log('  - Nettoyage quotidien des tokens  23h59 (Europe/Paris)')
  console.log("  - Rinitialisation des compteurs d'actualisations quotidiennes  23h59")
  console.log(
    '  - Les admins peuvent actualiser manuellement les données Enphase depuis leur dashboard (max 15/jour)'
  )
}

/**
 * Arrte toutes les tches planifies
 */
export function stopCronJobs() {
  cron.getTasks().forEach((task) => task.stop())
  isInitialized = false
  console.log('[PAUSE]  Tches planifies arrtes')
}
