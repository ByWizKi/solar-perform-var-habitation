import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/initial-password-change - Changer le mot de passe initial
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifi' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, mustChangePassword: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    if (!user.mustChangePassword) {
      return NextResponse.json(
        { error: "Le changement de mot de passe n'est pas requis" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { newPassword } = body

    // Validation
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractres' },
        { status: 400 }
      )
    }

    // Vrifier la complexit du mot de passe
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        {
          error:
            'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
        },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre  jour le mot de passe et dsactiver le flag
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        dailyRefreshCount: true,
        lastRefreshDate: true,
      },
    })

    return NextResponse.json({
      message: 'Mot de passe chang avec succs',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Erreur lors du changement de mot de passe initial:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe' },
      { status: 500 }
    )
  }
}
