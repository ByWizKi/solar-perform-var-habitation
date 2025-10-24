import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'
import { getEnphaseService } from '@/lib/services/enphase'
import { getEnphaseDataCollector } from '@/lib/services/enphase-data-collector'

async function handler(req: AuthRequest, { params }: { params: { connectionId: string } }) {
  try {
    const { userId } = getUserFromRequest(req)
    const { connectionId } = params
    const { searchParams } = new URL(req.url)
    const fullSync = searchParams.get('full') === 'true'

    // Vérifier que la connexion appartient  l'utilisateur
    const connection = await prisma.enphaseConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connexion non trouve' }, { status: 404 })
    }

    if (!connection.systemId) {
      return NextResponse.json({ error: 'Aucun système associ' }, { status: 400 })
    }

    // Vérifier et rafrachir le token si ncessaire
    const enphaseService = getEnphaseService()
    const accessToken = await enphaseService.ensureValidToken(userId)

    // Lancer la synchronisation
    const dataCollector = getEnphaseDataCollector()
    const result = fullSync
      ? await dataCollector.syncFullHistory(connectionId, connection.systemId, accessToken)
      : await dataCollector.syncAllData(connectionId, connection.systemId, accessToken)

    return NextResponse.json({
      success: true,
      message: fullSync
        ? `Synchronisation complte termine (${result.apiCalls} API calls)`
        : `Synchronisation termine (${result.apiCalls} API calls)`,
      apiCalls: result.apiCalls,
      lastSyncAt: new Date(),
    })
  } catch (error: any) {
    console.error('Erreur lors de la synchronisation:', error)
    return NextResponse.json({ error: error.message || 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function POST(req: AuthRequest, context: { params: { connectionId: string } }) {
  return withAuth(req, (authReq) => handler(authReq, context))
}
