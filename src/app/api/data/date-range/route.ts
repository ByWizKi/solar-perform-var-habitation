import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'
import { getEnphaseService } from '@/lib/services/enphase'
import { logApiCall, getMonthlyApiCallCount } from '@/lib/services/enphase-cache'

// Gnrer tous les mois entre deux dates
function getMonthsBetween(startDate: Date, endDate: Date): string[] {
  const months: string[] = []
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  while (current <= end) {
    const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    months.push(monthStr)
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)
    const { searchParams } = new URL(req.url)

    const systemId = searchParams.get('systemId')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const refresh = searchParams.get('refresh') === 'true'

    if (!systemId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'systemId, startDate et endDate sont requis' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Valider les dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 })
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'La date de dbut doit tre antrieure  la date de fin' },
        { status: 400 }
      )
    }

    // Vérifier la connexion
    const connection = await prisma.enphaseConnection.findFirst({
      where: {
        userId,
        systemId,
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Système non trouv' }, { status: 404 })
    }

    // Compter les appels API ce mois
    const apiCallsBefore = await getMonthlyApiCallCount(connection.id)
    console.log(`[DATA] Appels API avant requête: ${apiCallsBefore}/1000`)

    // Obtenir tous les mois dans la plage
    const months = getMonthsBetween(startDate, endDate)
    console.log(
      `[RANGE] Plage demande: ${months.length} mois (${months[0]}  ${months[months.length - 1]})`
    )

    const enphaseService = getEnphaseService()
    const accessToken = await enphaseService.ensureValidToken(userId)
    const apiKey = process.env.ENPHASE_API_KEY!

    let totalApiCalls = 0

    // Pour chaque mois, vérifier si on a les données en BDD
    for (const month of months) {
      const [year, monthNum] = month.split('-').map(Number)
      const monthStart = new Date(year, monthNum - 1, 1)
      const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999)

      // Vérifier si on a des données pour ce mois
      const existingData = await prisma.productionData.count({
        where: {
          connectionId: connection.id,
          systemId,
          source: 'energy_lifetime',
          timestamp: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })

      // Si on force le refresh OU qu'il n'y a pas de données, on fait l'appel API
      if (refresh || existingData === 0) {
        console.log(
          `[API] API CALL pour ${month}: ${refresh ? 'refresh forc' : 'aucune donne en BDD'}`
        )

        // Calculer les dates de dbut et fin pour ce mois
        const firstDay = new Date(year, monthNum - 1, 1)
        const lastDay = new Date(year, monthNum, 0)

        // Ajuster si la plage demande est plus restreinte
        const actualStartDate = firstDay < startDate ? startDate : firstDay
        const actualEndDate = lastDay > endDate ? endDate : lastDay

        const startDateParam = `${actualStartDate.getFullYear()}-${String(
          actualStartDate.getMonth() + 1
        ).padStart(2, '0')}-${String(actualStartDate.getDate()).padStart(2, '0')}`
        const endDateParam = `${actualEndDate.getFullYear()}-${String(
          actualEndDate.getMonth() + 1
        ).padStart(2, '0')}-${String(actualEndDate.getDate()).padStart(2, '0')}`

        // 1. Production
        try {
          const prodUrl = `https://api.enphaseenergy.com/api/v4/systems/${systemId}/energy_lifetime?key=${apiKey}&start_date=${startDateParam}&end_date=${endDateParam}`
          const prodRes = await fetch(prodUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          await logApiCall(
            connection.id,
            `/api/v4/systems/${systemId}/energy_lifetime`,
            'GET',
            prodRes.status,
            prodRes.ok
          )
          totalApiCalls++

          if (prodRes.ok) {
            const prodData = await prodRes.json()
            console.log(`[DATA] ${month}: ${prodData.production?.length || 0} jours de production`)

            if (prodData.production && Array.isArray(prodData.production)) {
              const batchData = []
              let currentDate = new Date(actualStartDate)

              for (let i = 0; i < prodData.production.length; i++) {
                const energyWh = prodData.production[i]

                if (energyWh > 0) {
                  batchData.push({
                    connectionId: connection.id,
                    connectionType: 'enphase',
                    systemId,
                    source: 'energy_lifetime',
                    power: 0, // Pas de données de puissance pour les agrgats journaliers
                    energy: energyWh,
                    timestamp: new Date(currentDate.getTime() + i * 86400 * 1000),
                    interval: 86400,
                  })
                }
              }

              if (batchData.length > 0) {
                await prisma.productionData.createMany({
                  data: batchData,
                  skipDuplicates: true,
                })
                console.log(`[OK] ${month}: ${batchData.length} jours stocks`)
              }
            }
          }
        } catch (error) {
          console.error(`[ERREUR] Erreur production ${month}:`, error)
        }

        // 2. Consommation (si disponible)
        try {
          const consUrl = `https://api.enphaseenergy.com/api/v4/systems/${systemId}/consumption_lifetime?key=${apiKey}&start_date=${startDateParam}&end_date=${endDateParam}`
          const consRes = await fetch(consUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          await logApiCall(
            connection.id,
            `/api/v4/systems/${systemId}/consumption_lifetime`,
            'GET',
            consRes.status,
            consRes.ok
          )
          totalApiCalls++

          if (consRes.ok) {
            const consData = await consRes.json()
            console.log(
              `[DATA] ${month}: ${consData.consumption?.length || 0} jours de consommation`
            )

            if (consData.consumption && Array.isArray(consData.consumption)) {
              const batchData = []
              let currentDate = new Date(actualStartDate)

              for (let i = 0; i < consData.consumption.length; i++) {
                const energyWh = consData.consumption[i]

                if (energyWh > 0) {
                  batchData.push({
                    connectionId: connection.id,
                    connectionType: 'enphase',
                    systemId,
                    source: 'consumption_lifetime',
                    power: 0, // Pas de données de puissance pour les agrgats journaliers
                    energy: energyWh,
                    timestamp: new Date(currentDate.getTime() + i * 86400 * 1000),
                    interval: 86400,
                  })
                }
              }

              if (batchData.length > 0) {
                await prisma.productionData.createMany({
                  data: batchData,
                  skipDuplicates: true,
                })
                console.log(`[OK] ${month}: ${batchData.length} jours consommation stocks`)
              }
            }
          } else if (consRes.status === 422) {
            console.log(`[ATTENTION] ${month}: Pas de compteur de consommation`)
          }
        } catch (error: any) {
          console.log(`[ATTENTION] ${month}: Consommation non disponible: ${error.message}`)
        }
      } else {
        console.log(`[CACHE] ${month}: Données dj en cache (${existingData} entres)`)
      }
    }

    // Maintenant rcuprer toutes les données de la plage depuis la BDD
    const productionData = await prisma.productionData.findMany({
      where: {
        connectionId: connection.id,
        systemId,
        source: 'energy_lifetime',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    })

    const consumptionData = await prisma.productionData.findMany({
      where: {
        connectionId: connection.id,
        systemId,
        source: 'consumption_lifetime',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    })

    // Agrger les données par jour
    const dailyProduction: { [key: string]: number } = {}
    const dailyConsumption: { [key: string]: number } = {}

    productionData.forEach((record) => {
      const day = record.timestamp.toISOString().split('T')[0]
      dailyProduction[day] = (dailyProduction[day] || 0) + (record.energy || 0)
    })

    consumptionData.forEach((record) => {
      const day = record.timestamp.toISOString().split('T')[0]
      dailyConsumption[day] = (dailyConsumption[day] || 0) + (record.energy || 0)
    })

    // Calculer les totaux
    const totalProduction = Object.values(dailyProduction).reduce((sum, val) => sum + val, 0)
    const totalConsumption = Object.values(dailyConsumption).reduce((sum, val) => sum + val, 0)
    const selfConsumption = Math.min(totalProduction, totalConsumption)

    const apiCallsAfter = await getMonthlyApiCallCount(connection.id)
    console.log(
      `[API] Appels API aprs requête: ${apiCallsAfter}/1000 (+${totalApiCalls} pour cette requête)`
    )

    return NextResponse.json({
      period: {
        start: startDateStr,
        end: endDateStr,
      },
      totals: {
        production: totalProduction,
        consumption: totalConsumption,
        selfConsumption,
      },
      daily: {
        production: dailyProduction,
        consumption: dailyConsumption,
      },
      dataPoints: {
        production: productionData.length,
        consumption: consumptionData.length,
      },
      apiCallsUsed: totalApiCalls,
      fromCache: totalApiCalls === 0,
      apiCallsThisMonth: apiCallsAfter,
      apiLimit: 1000,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des données par plage:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function GET(req: AuthRequest) {
  return withAuth(req, handler)
}
