import { prisma } from '../prisma'
import { getEnphaseService } from './enphase'

// Dures de cache (en millisecondes)
const CACHE_DURATIONS = {
  SYSTEM_INFO: 24 * 60 * 60 * 1000, // 24 heures (infos statiques)
  DEVICES: 24 * 60 * 60 * 1000, // 24 heures (quipements changent rarement)
  SYSTEM_SUMMARY: 15 * 60 * 1000, // 15 minutes (donnes dynamiques)
}

/**
 * Enregistre un appel API dans les logs
 */
export async function logApiCall(
  connectionId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  success: boolean,
  errorMessage?: string,
  responseTimeMs?: number
) {
  try {
    await prisma.apiCallLog.create({
      data: {
        connectionId,
        service: 'enphase',
        endpoint,
        method,
        statusCode,
        success,
        errorMessage,
        responseTimeMs,
      },
    })
  } catch (error) {
    console.error('[ERREUR] Erreur lors du logging API:', error)
  }
}

/**
 * Compte le nombre d'appels API ce mois-ci
 */
export async function getMonthlyApiCallCount(connectionId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const count = await prisma.apiCallLog.count({
    where: {
      connectionId,
      timestamp: {
        gte: startOfMonth,
      },
    },
  })

  return count
}

/**
 * Rcupre les infos systme avec cache
 */
export async function getCachedSystemInfo(
  connectionId: string,
  systemId: string,
  accessToken: string,
  forceRefresh: boolean = false
) {
  const enphaseService = getEnphaseService()

  // Les infos systme sont maintenant stockes dans EnphaseConnection
  // On peut les rcuprer depuis l si on veut viter l'appel API
  if (!forceRefresh) {
    const connection = await prisma.enphaseConnection.findFirst({
      where: {
        id: connectionId,
        systemId,
      },
      select: {
        systemName: true,
        systemSize: true,
        timezone: true,
      },
    })

    if (connection && connection.systemName) {
      console.log(`[CACHE] Cache HIT: System info depuis connection`)
      // Retourne les infos basiques, on fera quand mme un appel API pour les donnes temps rel
      // Cette section est maintenant simplifie, on fait toujours un appel API pour les donnes fraches
    }
  }

  // Cache MISS ou forc  appel API
  console.log(`[API] API CALL: System info pour ${systemId}`)
  const startTime = Date.now()

  try {
    const systemInfo = await enphaseService.getSystemInfo(systemId, accessToken)
    const responseTime = Date.now() - startTime

    // Logger l'appel
    await logApiCall(
      connectionId,
      `/api/v4/systems/${systemId}`,
      'GET',
      200,
      true,
      undefined,
      responseTime
    )

    // Mettre  jour les infos systme dans EnphaseConnection
    await prisma.enphaseConnection.update({
      where: { id: connectionId },
      data: {
        systemName: systemInfo.name || systemInfo.public_name,
        systemSize: systemInfo.system_size ? systemInfo.system_size / 1000 : null, // Convertir W en kW
        timezone: systemInfo.timezone,
      },
    })

    return systemInfo
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    await logApiCall(
      connectionId,
      `/api/v4/systems/${systemId}`,
      'GET',
      error.status || 0,
      false,
      error.message,
      responseTime
    )
    throw error
  }
}

/**
 * Rcupre les quipements (appel API direct, pas de cache)
 */
export async function getCachedSystemDevices(
  connectionId: string,
  systemId: string,
  accessToken: string,
  forceRefresh: boolean = false
) {
  const enphaseService = getEnphaseService()

  // Appel API direct (le cache des devices a t supprim du schma simplifi)
  console.log(`[API] [API] Rcupration des devices pour systme ${systemId}`)
  const startTime = Date.now()

  try {
    const devicesData = await enphaseService.getSystemDevices(systemId, accessToken)
    const responseTime = Date.now() - startTime

    // Logger l'appel
    await logApiCall(
      connectionId,
      `/api/v4/systems/${systemId}/devices`,
      'GET',
      200,
      true,
      undefined,
      responseTime
    )

    console.log(`[OK] Devices rcuprs depuis Enphase (${responseTime}ms)`)

    return devicesData
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    await logApiCall(
      connectionId,
      `/api/v4/systems/${systemId}/devices`,
      'GET',
      error.status || 0,
      false,
      error.message,
      responseTime
    )
    throw error
  }
}
