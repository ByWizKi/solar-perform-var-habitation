import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'

/**
 * GET /api/connections/check-updates
 * Endpoint ultra-lger pour vérifier si les données ont t mises à jour
 * Utilis par les Viewers pour détectéer les actualisations de l'Admin
 */
async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)

    // Vérifier si l'utilisateur est un viewer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, createdById: true },
    })

    // Dterminer l'ID utilisateur pour rcuprer la connexion
    const targetUserId = user?.role === 'VIEWER' && user.createdById ? user.createdById : userId

    // Rcuprer uniquement le timestamp de dernière synchronisation
    const connection = await prisma.enphaseConnection.findFirst({
      where: { userId: targetUserId, isActive: true },
      select: { lastSyncAt: true },
      orderBy: { lastSyncAt: 'desc' },
    })

    return NextResponse.json({
      lastSyncAt: connection?.lastSyncAt || null,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification des mises à jour:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function GET(req: AuthRequest) {
  return withAuth(req, handler)
}
