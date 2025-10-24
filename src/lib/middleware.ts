import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './auth'

export interface AuthRequest extends NextRequest {
  user?: {
    userId: string
    username: string
  }
}

// Middleware pour protger les routes
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Rcuprer le token depuis le header Authorization
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant ou invalide' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Enlever "Bearer "

    // Vérifier le token
    const payload = verifyAccessToken(token)

    // Ajouter les infos user  la requête
    const authReq = req as AuthRequest
    authReq.user = payload

    // Appeler le handler
    return handler(authReq)
  } catch (error) {
    return NextResponse.json({ error: 'Non autoris - Token invalide ou expir' }, { status: 401 })
  }
}

// Helper pour extraire l'utilisateur de la requête
export function getUserFromRequest(req: AuthRequest) {
  if (!req.user) {
    throw new Error('Utilisateur non authentifi')
  }
  return req.user
}
