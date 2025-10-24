import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'

async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)

    // Vrifier si l'utilisateur est un viewer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, createdById: true },
    })

    // Dterminer l'ID utilisateur pour rcuprer les connexions
    // Si viewer  utiliser l'ID du crateur (admin)
    // Sinon  utiliser l'ID de l'utilisateur actuel
    const targetUserId = user?.role === 'VIEWER' && user.createdById ? user.createdById : userId

    // Rcuprer toutes les connexions Enphase de l'utilisateur (ou de son admin si viewer)
    const connections = await prisma.enphaseConnection.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        systemId: true,
        systemName: true,
        systemSize: true,
        timezone: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Formater pour correspondre  l'ancien format (rtrocompatibilit)
    const formattedConnections = connections.map((conn) => ({
      id: conn.id,
      service: 'enphase', // Toutes les connexions ici sont Enphase
      systemId: conn.systemId,
      systemName: conn.systemName,
      systemSize: conn.systemSize,
      isActive: conn.isActive,
      lastSyncAt: conn.lastSyncAt,
      createdAt: conn.createdAt,
    }))

    return NextResponse.json({ connections: formattedConnections })
  } catch (error) {
    console.error('Erreur lors de la récupération des connexions:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function GET(req: AuthRequest) {
  return withAuth(req, handler)
}
