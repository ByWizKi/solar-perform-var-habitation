import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEnphaseService } from '@/lib/services/enphase'

// Prix du kWh en euros (configurable)
const PRIX_KWH_EURO = 0.2062 // Prix moyen en France 2024

/**
 * GET /api/data/history - Rcuprer l'historique des productions journalires (14 jours)
 * Rcupre automatiquement les données manquantes depuis Enphase
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifi' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // Rcuprer les paramtres
    const searchParams = request.nextUrl.searchParams
    const systemId = searchParams.get('systemId')
    const days = parseInt(searchParams.get('days') || '14', 10)

    if (!systemId) {
      return NextResponse.json({ error: 'systemId requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur a accs  ce système
    let connection = await prisma.enphaseConnection.findFirst({
      where: {
        userId: payload.userId,
        systemId,
      },
    })

    if (!connection) {
      // Si l'utilisateur n'a pas directement la connexion, vérifier si c'est un visualisateur
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { role: true, createdById: true },
      })

      if (!user || !user.createdById) {
        return NextResponse.json({ error: 'Accs non autoris' }, { status: 403 })
      }

      // Vérifier que le crateur a cette connexion
      connection = await prisma.enphaseConnection.findFirst({
        where: {
          userId: user.createdById,
          systemId,
        },
      })

      if (!connection) {
        return NextResponse.json({ error: 'Accs non autoris' }, { status: 403 })
      }
    }

    // Gnrer les 14 derniers jours
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const last14Days: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      last14Days.push(date.toISOString().split('T')[0])
    }

    // Rcuprer les données de production journalires existantes pour ces jours
    const startDate = new Date(last14Days[0])
    const existingSummaries = await prisma.productionData.findMany({
      where: {
        connectionId: connection.id,
        interval: 0,
        timestamp: { gte: startDate },
        source: {
          in: ['summary', 'energy_lifetime', 'energy_lifetime_daily'],
        },
      },
      select: {
        timestamp: true,
        energy: true,
        metadata: true,
      },
      orderBy: { timestamp: 'asc' },
    })

    // Mapper les données existantes par jour (garder la plus rcente si plusieurs entres)
    const dataByDay = new Map<string, { production: number; lifetime: number }>()
    existingSummaries.forEach((summary) => {
      const dateKey = summary.timestamp.toISOString().split('T')[0]
      // Garder seulement si pas dj prsent (le premier, car orderBy timestamp asc)
      if (!dataByDay.has(dateKey)) {
        dataByDay.set(dateKey, {
          production: summary.energy || 0,
          lifetime: (summary.metadata as any)?.energyLifetime || 0,
        })
      }
    })

    // Vérifier quels jours manquent
    const missingDays = last14Days.filter((day) => !dataByDay.has(day))

    console.log('\n' + '='.repeat(80))
    console.log(`[DATA] [HISTORY] Historique 14 jours - System ${systemId}`)
    console.log('='.repeat(80))
    console.log(`[UP] En cache: ${dataByDay.size}/${last14Days.length} jours`)
    console.log(`[DOWN] Manquants: ${missingDays.length} jours`)

    // [ATTENTION] RGLE IMPORTANTE : Appel API UNIQUEMENT si des données manquent !
    if (missingDays.length > 0) {
      console.log(
        `\n[API] [API] Récupération depuis Enphase (1 requête pour ${missingDays.length} jours)`
      )
      const enphaseService = getEnphaseService()
      const accessToken = await enphaseService.ensureValidToken(payload.userId)

      try {
        // UNE SEULE requête pour rcuprer toutes les données
        // L'API Enphase retourne toujours 888 jours, peu importe les dates demandes
        const lifetimeData = await enphaseService.getProductionData(
          systemId,
          accessToken,
          new Date(last14Days[0]),
          new Date(last14Days[last14Days.length - 1])
        )

        // Vérifier le format
        if (!lifetimeData?.production || !Array.isArray(lifetimeData.production)) {
          console.error('[ERREUR] Format de rponse Enphase invalide')
          return NextResponse.json({
            history: last14Days.map((date) => ({
              date,
              production: 0,
              productionKWh: 0,
              coutEuros: 0,
              available: false,
            })),
            prixKWhEuro: PRIX_KWH_EURO,
            totalKWh: 0,
            totalEuros: 0,
          })
        }

        const productionArray = lifetimeData.production as number[]
        const apiStartDate = new Date(lifetimeData.start_date)

        console.log(
          `[CACHE] [API] Rponse reue: ${productionArray.length} jours depuis ${
            apiStartDate.toISOString().split('T')[0]
          }`
        )
        console.log(`[SEARCH] [TRAITEMENT] Extraction des ${missingDays.length} jours manquants...`)

        let successCount = 0

        // Extraire uniquement les jours manquants
        for (const dateKey of missingDays) {
          const targetDate = new Date(dateKey)

          // Calculer l'index de ce jour dans le tableau
          const daysSinceStart = Math.floor(
            (targetDate.getTime() - apiStartDate.getTime()) / (1000 * 60 * 60 * 24)
          )

          // Vérifier que l'index est valide
          if (daysSinceStart < 0 || daysSinceStart >= productionArray.length) {
            console.warn(`  [ATTENTION] [SKIP] ${dateKey}: Index ${daysSinceStart} hors limites`)
            continue
          }

          // [ATTENTION] IMPORTANT : Le tableau 'production' contient DIRECTEMENT la production du jour
          // Ce n'est PAS cumulatif, contrairement  ce que le nom 'energy_lifetime' suggre !
          const productionToday = productionArray[daysSinceStart]

          // Stocker en base même si production = 0 (jour sans soleil)
          try {
            await prisma.productionData.create({
              data: {
                connectionId: connection.id,
                connectionType: 'enphase',
                systemId,
                source: 'energy_lifetime_daily',
                energy: productionToday,
                power: 0,
                timestamp: targetDate,
                interval: 0,
                metadata: {
                  status: 'normal',
                },
              },
            })
          } catch (dbError: any) {
            // Ignorer les erreurs de doublon (si le jour existe dj)
            if (!dbError.message?.includes('Unique constraint')) {
              throw dbError
            }
          }

          // Ajouter au cache local
          dataByDay.set(dateKey, {
            production: productionToday,
            lifetime: 0,
          })

          console.log(`  [OK] [DB] ${dateKey}: ${(productionToday / 1000).toFixed(3)} kWh stock`)
          successCount++
        }

        console.log(
          `\n[SAVE] [RSULTAT] ${successCount}/${missingDays.length} jours rcuprs et stocks`
        )
        console.log('='.repeat(80) + '\n')
      } catch (error: any) {
        console.error(`\n[ERREUR] [ERREUR] Récupération Enphase: ${error.message}`)
        console.log('='.repeat(80) + '\n')
      }
    } else {
      console.log(`\n[CACHE] [CACHE] Toutes les données sont en base  0 appel API`)
      console.log('='.repeat(80) + '\n')
    }

    // Construire l'historique final avec calcul en euros
    const history = last14Days.map((date) => {
      const data = dataByDay.get(date)
      const productionWh = data?.production || 0
      const productionKWh = productionWh / 1000
      const coutEuros = productionKWh * PRIX_KWH_EURO

      return {
        date,
        production: productionWh,
        productionKWh: Math.round(productionKWh * 100) / 100,
        coutEuros: Math.round(coutEuros * 100) / 100,
        available: !!data,
      }
    })

    // Inverser pour afficher du plus rcent au plus ancien
    history.reverse()

    return NextResponse.json({
      history,
      prixKWhEuro: PRIX_KWH_EURO,
      totalKWh: Math.round(history.reduce((sum, day) => sum + day.productionKWh, 0) * 100) / 100,
      totalEuros: Math.round(history.reduce((sum, day) => sum + day.coutEuros, 0) * 100) / 100,
    })
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'historique:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    )
  }
}
