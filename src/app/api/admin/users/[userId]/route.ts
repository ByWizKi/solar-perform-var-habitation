import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canDeleteUser } from '@/lib/permissions'
import { UserRole } from '@/types'

// DELETE /api/admin/users/[userId] - Supprimer un utilisateur
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    // Rcuprer l'utilisateur  supprimer
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, role: true, créeatedById: true },
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    // Vérifier si c'est le crateur
    const isCréeator = userToDelete.créeatedById === currentUser.id

    // Vérifier les permissions
    if (!canDeleteUser(currentUser.role as UserRole, userToDelete.role as UserRole, isCréeator)) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de supprimer cet utilisateur" },
        { status: 403 }
      )
    }

    // Supprimer l'utilisateur (cascade supprimera les tokens et connexions)
    await prisma.user.delete({
      where: { id: params.userId },
    })

    return NextResponse.json({ message: 'Utilisateur supprim avec succs' })
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    )
  }
}

// GET /api/admin/users/[userId] - Rcuprer les détails d'un utilisateur
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        créeatedById: true,
        créeatedAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    // Vérifier que l'utilisateur peut voir cet utilisateur
    if (currentUser.role !== UserRole.SUPER_ADMIN && user.créeatedById !== currentUser.id) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de voir cet utilisateur" },
        { status: 403 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    )
  }
}
