import { NextRequest, NextResponse } from 'next/server'
import { getEnphaseService } from '@/lib/services/enphase'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)

    // Vérifier si l'utilisateur a dj une connexion Enphase active
    const existingConnection = await prisma.enphaseConnection.findFirst({
      where: {
        userId,
        isActive: true,
      },
    })

    // Si une connexion existe dj et qu'elle a un systemId, pas besoin de rautoriser
    if (existingConnection && existingConnection.systemId) {
      console.log(
        ` Connexion Enphase existante trouve pour l'utilisateur ${userId} (système: ${existingConnection.systemId})`
      )
      return NextResponse.json({
        alreadyConnected: true,
        message: 'Vous avez dj une connexion Enphase active',
        systemId: existingConnection.systemId,
        redirectUrl: '/dashboard',
      })
    }

    // Pas de connexion ou connexion incomplte : gnrer l'URL d'autorisation
    console.log(`[AUTH] Gnration de l'URL d'autorisation Enphase pour l'utilisateur ${userId}`)
    const enphaseService = getEnphaseService()
    const authUrl = enphaseService.getAuthorizationUrl(userId)

    return NextResponse.json({ authUrl, alreadyConnected: false })
  } catch (error: any) {
    console.error("Erreur lors de la gnration de l'URL d'autorisation:", error)
    console.error("Error stack:", error?.stack)
    console.error("Error message:", error?.message)
    
    return NextResponse.json(
      {
        error: 'Une erreur est survenue lors de la génération de l\'URL d\'autorisation',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}

export async function GET(req: AuthRequest) {
  return withAuth(req, handler)
}
