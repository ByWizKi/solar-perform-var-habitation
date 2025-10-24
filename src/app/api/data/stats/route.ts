import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'
import { getEnphaseService } from '@/lib/services/enphase'

async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)
    const { searchParams } = new URL(req.url)

    const systemId = searchParams.get('systemId')

    if (!systemId) {
      return NextResponse.json({ error: 'systemId requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur a accs  ce système
    let connection = await prisma.enphaseConnection.findFirst({
      where: {
        userId,
        systemId,
      },
      select: {
        id: true,
        systemId: true,
        systemSize: true,
      },
    })

    // Si l'utilisateur n'a pas de connexion directe, vérifier s'il est viewer
    if (!connection) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, créeatedById: true },
      })

      if (user?.role === 'VIEWER' && user.créeatedById) {
        // Le viewer peut accder aux données de son crateur (admin)
        connection = await prisma.enphaseConnection.findFirst({
          where: {
            userId: user.créeatedById,
            systemId,
          },
          select: {
            id: true,
            systemId: true,
            systemSize: true,
          },
        })
      }

      if (!connection) {
        return NextResponse.json({ error: 'Système non trouv' }, { status: 404 })
      }
    }

    // Rcuprer le dernier summary (interval = 0, source = 'summary')
    // Il contient TOUTES les infos ncessaires directement depuis Enphase
    const latestSummary = await prisma.productionData.findFirst({
      where: {
        connectionId: connection.id,
        interval: 0,
        source: 'summary',
      },
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp: true,
        energy: true, // energy_today d'Enphase
        power: true, // current_power d'Enphase
        metadata: true, // Contient energyLifetime et status
      },
    })

    // Pour le mois : calculer depuis le dbut du mois
    // On prend le lifetime actuel - lifetime du dbut du mois
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let firstSummaryOfMonth = await prisma.productionData.findFirst({
      where: {
        connectionId: connection.id,
        interval: 0,
        timestamp: { gte: startOfMonth },
        source: 'summary',
      },
      orderBy: { timestamp: 'asc' },
      select: {
        metadata: true,
        timestamp: true,
      },
    })

    // Si pas de données du dbut du mois, les rcuprer depuis Enphase
    if (!firstSummaryOfMonth) {
      try {
        console.log('\n' + '='.repeat(80))
        console.log(`[DATE] [STATS] Calcul production mensuelle - System ${systemId}`)
        console.log('='.repeat(80))
        console.log(`[API] [API] Données dbut du mois manquantes  Récupération Enphase`)
        const enphaseService = getEnphaseService()
        const accessToken = await enphaseService.ensureValidToken(userId)

        // Rcuprer les données du mois
        const endOfMonth = new Date()
        const lifetimeData = await enphaseService.getProductionData(
          systemId,
          accessToken,
          startOfMonth,
          endOfMonth
        )

        // L'API Enphase retourne : { production: [...], start_date: "2023-05-20", ... }
        if (!lifetimeData?.production || !Array.isArray(lifetimeData.production)) {
          console.error('[ERREUR] Format invalide, production manquant:', lifetimeData)
        } else {
          const productionArray = lifetimeData.production as number[]
          const apiStartDate = new Date(lifetimeData.start_date)

          console.log(
            `[CACHE] ${productionArray.length} jours de données depuis ${
              apiStartDate.toISOString().split('T')[0]
            }`
          )

          // Calculer l'index du premier jour du mois
          const daysSinceStart = Math.floor(
            (startOfMonth.getTime() - apiStartDate.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (daysSinceStart >= 0 && daysSinceStart < productionArray.length) {
            const firstDayLifetime = productionArray[daysSinceStart]

            await prisma.productionData.créeate({
              data: {
                connectionId: connection.id,
                connectionType: 'enphase',
                systemId,
                energy: 0, // On ne connait pas la production du jour
                power: 0,
                timestamp: startOfMonth,
                interval: 0,
                metadata: {
                  source: 'energy_lifetime',
                  energyLifetime: firstDayLifetime,
                  status: 'normal',
                },
              },
            })

            firstSummaryOfMonth = {
              metadata: { energyLifetime: firstDayLifetime },
              timestamp: startOfMonth,
            }

            console.log(
              `  [OK] [DB] Lifetime dbut du mois: ${(firstDayLifetime / 1000).toFixed(2)} kWh`
            )
            console.log('='.repeat(80) + '\n')
          } else {
            console.error(
              `  [ATTENTION] [SKIP] Index ${daysSinceStart} hors limites (max: ${productionArray.length})`
            )
            console.log('='.repeat(80) + '\n')
          }
        }
      } catch (error) {
        console.error(`[ERREUR] [ERREUR] Récupération dbut du mois:`, error)
        console.log('='.repeat(80) + '\n')
      }
    } else {
      console.log('\n' + '='.repeat(80))
      console.log(`[DATE] [STATS] Calcul production mensuelle - System ${systemId}`)
      console.log('='.repeat(80))
      console.log(`[CACHE] [CACHE] Données dbut du mois dj en base  0 appel API`)
      console.log('='.repeat(80) + '\n')
    }

    // Production du mois = lifetime actuel - lifetime dbut du mois
    const lifetimeNow = (latestSummary?.metadata as any)?.energyLifetime || 0
    const lifetimeStartMonth = (firstSummaryOfMonth?.metadata as any)?.energyLifetime || lifetimeNow
    const productionThisMonth = Math.max(0, lifetimeNow - lifetimeStartMonth)

    // Si pas de données, afficher un message informatif
    if (!latestSummary) {
      console.log('\n' + '='.repeat(80))
      console.log(`[ATTENTION] [STATS] Aucune donne disponible pour le système ${systemId}`)
      console.log('='.repeat(80))
      console.log(
        ` Cliquez sur "Actualiser" dans le dashboard pour rcuprer les données depuis Enphase`
      )
      console.log('='.repeat(80) + '\n')
    } else {
      // Log des statistiques calcules
      console.log('[DATA] [STATS] Résumé calcul:')
      console.log(`  [TODAY] Aujourd'hui: ${((latestSummary?.energy || 0) / 1000).toFixed(2)} kWh`)
      console.log(`  [STATS] Ce mois: ${(productionThisMonth / 1000).toFixed(2)} kWh`)
      console.log(`  [LIFETIME] Lifetime total: ${(lifetimeNow / 1000).toFixed(2)} kWh`)
      console.log(`  [INFO] Puissance actuelle: ${latestSummary?.power || 0} W`)
    }

    return NextResponse.json({
      current: {
        powerNow: latestSummary?.power || 0,
        consumptionNow: 0,
        batteryPowerNow: 0,
        batteryPercentage: 0,
      },
      today: {
        production: latestSummary?.energy || 0, // energy_today
        consumption: 0,
      },
      month: {
        production: productionThisMonth,
      },
      lifetime: {
        production: lifetimeNow, // energy_lifetime
        consumption: 0,
      },
      system: {
        status: (latestSummary?.metadata as any)?.status || 'unknown',
        systemSize: connection.systemSize || 0,
        unresolvedEvents: 0,
      },
      lastUpdate: latestSummary?.timestamp || null,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function GET(req: AuthRequest) {
  return withAuth(req, handler)
}
