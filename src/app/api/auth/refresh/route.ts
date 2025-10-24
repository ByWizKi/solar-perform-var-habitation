import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyRefreshToken,
  generateAccessToken,
  revokeRefreshToken,
  createAuthTokens,
} from '@/lib/auth'
import { refreshTokenSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validation
    const validatedData = refreshTokenSchema.parse(body)

    // Vrifier que le refresh token existe en DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: validatedData.refreshToken },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            mustChangePassword: true,
          },
        },
      },
    })

    if (!storedToken) {
      return NextResponse.json({ error: 'Refresh token invalide' }, { status: 401 })
    }

    // Vrifier que le token n'est pas expir
    if (storedToken.expiresAt < new Date()) {
      await revokeRefreshToken(validatedData.refreshToken)
      return NextResponse.json({ error: 'Refresh token expir' }, { status: 401 })
    }

    // Vrifier la signature du token
    try {
      verifyRefreshToken(validatedData.refreshToken)
    } catch (error) {
      // Token invalide, on le rvoque s'il existe encore
      await revokeRefreshToken(validatedData.refreshToken)
      return NextResponse.json({ error: 'Refresh token invalide' }, { status: 401 })
    }

    // Rvoquer l'ancien refresh token (avant de crer les nouveaux)
    await revokeRefreshToken(validatedData.refreshToken)

    // Crer de nouveaux tokens
    const tokens = await createAuthTokens({
      id: storedToken.user.id,
      username: storedToken.user.username,
    })

    return NextResponse.json({
      message: 'Tokens rafrachis avec succs',
      user: storedToken.user,
      ...tokens,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Donnes invalides', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erreur lors du rafrachissement du token:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
