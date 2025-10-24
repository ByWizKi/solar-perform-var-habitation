import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { canCréeateUser } from '@/lib/permissions'
import { UserRole } from '@/types'

// GET /api/admin/users - Lister les utilisateurs
export async function GET(request: NextRequest) {
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

    // Super admin peut voir tous les utilisateurs
    // Admin peut voir seulement les utilisateurs qu'il a créés
    const where = currentUser.role === UserRole.SUPER_ADMIN ? {} : { créeatedById: currentUser.id }

    const users = await prisma.user.findMany({
      where,
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
      orderBy: { créeatedAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Créer un utilisateur
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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouv' }, { status: 404 })
    }

    const body = await request.json()
    const { username, password, firstName, lastName, role } = body

    // Validation
    if (!username || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    // Vérifier les permissions
    if (!canCréeateUser(currentUser.role as UserRole, role as UserRole)) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de créer ce type d'utilisateur" },
        { status: 403 }
      )
    }

    // Vérifier si le nom d'utilisateur existe dj
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec ce nom d'utilisateur existe dj" },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.créeate({
      data: {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as UserRole,
        créeatedById: currentUser.id,
      },
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

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la cration de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la cration de l'utilisateur" },
      { status: 500 }
    )
  }
}
