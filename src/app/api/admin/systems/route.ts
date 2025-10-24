import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'

/**
 * GET /api/admin/systems - Rcuprer tous les systmes Enphase (Super Admin uniquement)
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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    })

    if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Accs rserv aux Super Admins' }, { status: 403 })
    }

    // Rcuprer tous les systmes avec leurs donnes en UNE SEULE requête (optimisation N+1)
    const connections = await prisma.enphaseConnection.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        systemId: true,
        systemName: true,
        systemSize: true,
        timezone: true,
        lastSyncAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        // Récupérer le dernier summary directement avec la connexion
        productionData: {
          where: {
            interval: 0,
            source: 'summary',
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 1, // Seulement le plus récent
          select: {
            timestamp: true,
            energy: true,
            power: true,
            metadata: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transformation des données (pas de requête supplémentaire)
    const systems = connections.map((connection) => {
      const latestSummary = connection.productionData[0] || null

      return {
        connectionId: connection.id,
        systemId: connection.systemId,
        systemName: connection.systemName,
        systemSize: connection.systemSize,
        service: 'Enphase',
        owner: connection.user,
        lastSync: connection.lastSyncAt,
        data: latestSummary
          ? {
              timestamp: latestSummary.timestamp,
              status: (latestSummary.metadata as any)?.status || 'normal',
              energyToday: latestSummary.energy || 0,
              energyLifetime: (latestSummary.metadata as any)?.energyLifetime || 0,
              powerNow: latestSummary.power || 0,
              consumptionToday: null,
              consumptionNow: null,
              batteryPercentage: null,
              batteryPowerNow: null,
            }
          : null,
      }
    })

    return NextResponse.json({ systems })
  } catch (error: any) {
    console.error('Erreur lors de la rcupration des systmes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la rcupration des systmes' },
      { status: 500 }
    )
  }
}
