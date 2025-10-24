import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createAuthTokens } from '@/lib/auth'
import { loginSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validation des donnes
    const validatedData = loginSchema.parse(body)

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { username: validatedData.username },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Nom d'utilisateur ou mot de passe incorrect", errorType: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    // Vrifier le mot de passe
    const isPasswordValid = await verifyPassword(validatedData.password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Nom d'utilisateur ou mot de passe incorrect", errorType: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    // Gnrer les tokens
    const tokens = await createAuthTokens(user)

    return NextResponse.json({
      message: 'Connexion russie',
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      ...tokens,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Donnes invalides', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la connexion:', error)
    return NextResponse.json(
      {
        error: 'Erreur systme : impossible de se connecter. Veuillez ressayer.',
        errorType: 'SYSTEM_ERROR',
      },
      { status: 500 }
    )
  }
}
