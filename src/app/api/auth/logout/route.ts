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
      message: 'Dconnexion russie',
    })
  } catch (error: any) {
    // Mme si le token n'existe pas, on considre la dconnexion comme russie
    if (error.code === 'P2025') {
      return NextResponse.json({
        message: 'Dconnexion russie',
      })
    }

    console.error('Erreur lors de la dconnexion:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la dconnexion' },
      { status: 500 }
    )
  }
}
