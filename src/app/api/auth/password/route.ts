import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, revokeAllUserTokens } from '@/lib/auth'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'
import { changePasswordSchema } from '@/lib/validators'

async function handler(req: AuthRequest) {
  try {
    const { userId } = getUserFromRequest(req)
    const body = await req.json()

    // Validation
    const validatedData = changePasswordSchema.parse(body)

    // Rcuprer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    // Vrifier le mot de passe actuel
    const isPasswordValid = await verifyPassword(validatedData.currentPassword, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
    }

    // Vrifier que le nouveau mot de passe est diffrent
    const isSamePassword = await verifyPassword(validatedData.newPassword, user.password)

    if (isSamePassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit tre diffrent de l'ancien" },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(validatedData.newPassword)

    // Mettre  jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Rvoquer tous les refresh tokens (force la reconnexion)
    await revokeAllUserTokens(userId)

    return NextResponse.json({
      message: 'Mot de passe modifi avec succs. Veuillez vous reconnecter.',
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Donnes invalides', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erreur lors du changement de mot de passe:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function PATCH(req: AuthRequest) {
  return withAuth(req, handler)
}
