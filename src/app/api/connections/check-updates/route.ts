import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'

/**
 * GET /api/connections/check-updates
 * Endpoint ultra-lger pour vrifier si les donnes ont t mises  jour
 * Utilis par les Viewers pour dtecter les actualisations de l'Admin
 */
async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)

    // Vrifier si l'utilisateur est un viewer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, createdById: true },
    })

    // Dterminer l'ID utilisateur pour rcuprer la connexion
    const targetUserId = user?.role === 'VIEWER' && user.createdById ? user.createdById : userId

    // Rcuprer uniquement le timestamp de dernire synchronisation
    const connection = await prisma.enphaseConnection.findFirst({
      where: { userId: targetUserId, isActive: true },
      select: { lastSyncAt: true },
      orderBy: { lastSyncAt: 'desc' },
    })

    return NextResponse.json({
      lastSyncAt: connection?.lastSyncAt || null,
    })
  } catch (error) {
    console.error('Erreur lors de la vrification des mises  jour:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function GET(req: AuthRequest) {
  return withAuth(req, handler)
}
