import { NextRequest, NextResponse } from 'next/server'
import { revokeRefreshToken } from '@/lib/auth'
import { refreshTokenSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validation
    const validatedData = refreshTokenSchema.parse(body)

    // Rvoquer le refresh token
    await revokeRefreshToken(validatedData.refreshToken)

    return NextResponse.json({
      message: 'Déconnexion réussie',
    })
  } catch (error: any) {
    // Même si le token n'existe pas, on considère la déconnexion comme réussie
    if (error.code === 'P2025') {
      return NextResponse.json({
        message: 'Déconnexion réussie',
      })
    }

    console.error('Erreur lors de la déconnexion:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la déconnexion' },
      { status: 500 }
    )
  }
}
