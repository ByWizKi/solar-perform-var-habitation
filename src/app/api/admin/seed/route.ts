/**
 * Endpoint temporaire pour exécuter le seed de la base de données
 * 
 * SECURITE: Cet endpoint doit être protégé ou supprimé après le premier seed
 * 
 * Usage: POST /api/admin/seed
 * Headers: Authorization: Bearer <token> (optionnel, peut être sécurisé avec une clé secrète)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface SeedUser {
  username: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

const SEED_USERS: SeedUser[] = [
  {
    username: 'enzoAdmin',
    password: 'admin123',
    firstName: 'Enzo',
    lastName: 'Admin',
    role: UserRole.SUPER_ADMIN,
  },
]

async function seedUser(userData: SeedUser): Promise<void> {
  const { username, password, firstName, lastName, role } = userData

  const existingUser = await prisma.user.findUnique({
    where: { username },
  })

  if (existingUser) {
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      mustChangePassword: false,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    // Protection basique: vérifier une clé secrète si définie
    const seedKey = process.env.SEED_SECRET_KEY
    if (seedKey) {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || authHeader !== `Bearer ${seedKey}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    console.log('[SEED] Starting database seed via API...')

    for (const userData of SEED_USERS) {
      await seedUser(userData)
    }

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'Database seed completed successfully',
    })
  } catch (error: any) {
    console.error('[SEED] Error:', error)
    await prisma.$disconnect()

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed database',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
