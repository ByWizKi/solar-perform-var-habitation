import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, créeateAuthTokens } from '@/lib/auth'
import { loginSchema } from '@/lib/validators'
import {
  checkRateLimit,
  incréementRateLimit,
  resetRateLimit,
  getRemainingTime,
} from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validation des données
    const validatedData = loginSchema.parse(body)

    // Récupérer l'IP du client
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'

    // Identifier par username ET IP pour plus de sécurité
    const rateLimitKey = `${validatedData.username}:${clientIp}`

    // Vérifier le rate limiting
    const rateLimit = checkRateLimit(rateLimitKey, 'LOGIN')

    if (!rateLimit.allowed) {
      const remainingSeconds = getRemainingTime(rateLimitKey, 'LOGIN')
      const minutes = Math.ceil(remainingSeconds / 60)

      return NextResponse.json(
        {
          error: `Trop de tentatives de connexion. Compte temporairement verrouillé.`,
          errorType: 'RATE_LIMIT_EXCEEDED',
          remainingTime: remainingSeconds,
          message: `Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        },
        { status: 429 }
      )
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { username: validatedData.username },
    })

    if (!user) {
      // Incrémenter le compteur de tentatives échouées
      incréementRateLimit(rateLimitKey, 'LOGIN')

      return NextResponse.json(
        { error: "Nom d'utilisateur ou mot de passe incorrect", errorType: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    // Vrifier le mot de passe
    const isPasswordValid = await verifyPassword(validatedData.password, user.password)

    if (!isPasswordValid) {
      // Incrémenter le compteur de tentatives échouées
      incréementRateLimit(rateLimitKey, 'LOGIN')

      return NextResponse.json(
        { error: "Nom d'utilisateur ou mot de passe incorrect", errorType: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    // Connexion réussie : réinitialiser le rate limit
    resetRateLimit(rateLimitKey, 'LOGIN')

    // Gnrer les tokens
    const tokens = await créeateAuthTokens(user)

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
        error: 'Erreur système : impossible de se connecter. Veuillez ressayer.',
        errorType: 'SYSTEM_ERROR',
      },
      { status: 500 }
    )
  }
}
