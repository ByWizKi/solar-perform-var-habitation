import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'
import { getEnphaseService } from '@/lib/services/enphase'
import { getEnphaseDataCollector } from '@/lib/services/enphase-data-collector'
import { getMonthlyApiCallCount } from '@/lib/services/enphase-cache'

async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)
    const { searchParams } = new URL(req.url)
    const systemId = searchParams.get('systemId')

    if (!systemId) {
      return NextResponse.json({ error: 'systemId requis' }, { status: 400 })
    }

    // Rcuprer l'utilisateur avec ses infos de refresh
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    // Vrifier que l'utilisateur est admin (pas VIEWER)
    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent actualiser les donnes' },
        { status: 403 }
      )
    }

    // Vrifier la limite quotidienne (15 actualisations par jour pour les admins, pas de limite pour super admin)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastRefreshDate = user.lastRefreshDate ? new Date(user.lastRefreshDate) : null
    const isNewDay = !lastRefreshDate || lastRefreshDate < today

    // Si c'est un nouveau jour, rinitialiser le compteur
    let currentRefreshCount = isNewDay ? 0 : user.dailyRefreshCount

    // Vrifier la limite uniquement pour les admins (pas les super admins)
    if (user.role === 'ADMIN' && currentRefreshCount >= 15) {
      return NextResponse.json(
        {
          error: 'Limite quotidienne atteinte',
          message: 'Vous avez atteint la limite de 15 actualisations par jour. Ressayez demain.',
          refreshCount: currentRefreshCount,
          maxRefreshes: 15,
        },
        { status: 429 }
      )
    }

    // Rcuprer la connexion Enphase
    const connection = await prisma.enphaseConnection.findFirst({
      where: {
        userId,
        systemId,
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Systme non trouv' }, { status: 404 })
    }

    // Compter les appels API avant le refresh
    const apiCallsBefore = await getMonthlyApiCallCount(connection.id)

    console.log('\n' + '='.repeat(80))
    console.log(`[SYNC] [REFRESH] Actualisation manuelle - System ${systemId}`)
    console.log('='.repeat(80))
    console.log(`[USER] Utilisateur: ${user.firstName} ${user.lastName} (${user.role})`)
    if (user.role === 'ADMIN') {
      console.log(`[DATA] Actualisations: ${currentRefreshCount}/15 utilises aujourd'hui`)
    }
    console.log(`[API] Appels API ce mois: ${apiCallsBefore}/1000`)

    // Rafrachir le token si ncessaire
    const enphaseService = getEnphaseService()
    const accessToken = await enphaseService.ensureValidToken(userId)

    // Rcuprer les dernires donnes depuis l'API Enphase
    const dataCollector = getEnphaseDataCollector()

    console.log(`[SYNC] [API] Rcupration du summary Enphase...`)

    // Rcuprer le rsum du systme (contient energyToday, powerNow, etc.)
    await dataCollector.fetchAndStoreSystemSummary(connection.id, systemId, accessToken)

    // Compter les appels API aprs le refresh
    const apiCallsAfter = await getMonthlyApiCallCount(connection.id)
    const newCalls = apiCallsAfter - apiCallsBefore

    console.log(
      ` [SUCCESS] Donnes rafrachies (${newCalls} appel${newCalls > 1 ? 's' : ''} API utilis${
        newCalls > 1 ? 's' : ''
      })`
    )
    console.log(`[UP] Total appels API: ${apiCallsAfter}/1000`)
    console.log('='.repeat(80) + '\n')

    // Rcuprer les donnes mises  jour
    const latestData = await prisma.productionData.findFirst({
      where: {
        connectionId: connection.id,
      },
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp: true,
        energy: true,
        power: true,
        metadata: true,
      },
    })

    // Incrmenter le compteur d'actualisations quotidiennes (sauf pour les super admins)
    if (user.role === 'ADMIN') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyRefreshCount: currentRefreshCount + 1,
          lastRefreshDate: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Donnes actualises avec succs',
      data: {
        energyToday: latestData?.energy || 0,
        powerNow: latestData?.power || 0,
        energyLifetime: (latestData?.metadata as any)?.energyLifetime || 0,
        consumptionToday: 0,
        consumptionNow: 0,
        timestamp: latestData?.timestamp,
      },
      apiCallsThisMonth: apiCallsAfter,
      apiLimit: 1000,
      apiCallsUsed: newCalls,
      refreshCount: user.role === 'ADMIN' ? currentRefreshCount + 1 : undefined,
      maxRefreshes: user.role === 'ADMIN' ? 15 : undefined,
    })
  } catch (error: any) {
    console.log('\n' + '='.repeat(80))
    console.error(`[ERREUR] [ERREUR] Rafrachissement chou: ${error.message}`)
    console.log('='.repeat(80) + '\n')
    return NextResponse.json(
      { error: 'Erreur lors du rafrachissement', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: AuthRequest) {
  return withAuth(req, handler)
}
