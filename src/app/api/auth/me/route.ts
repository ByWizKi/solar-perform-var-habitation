import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'

async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)

    // Rcuprer les infos de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        mustChangePassword: true,
        dailyRefreshCount: true,
        lastRefreshDate: true,
        créeatedAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function GET(req: AuthRequest) {
  return withAuth(req, handler)
}
