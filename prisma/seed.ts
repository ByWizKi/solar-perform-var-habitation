/**
 * Database seed script
 * Creates the initial super admin user if it doesn't exist
 *
 * This script is idempotent and can be run multiple times safely.
 * It will only create the user if it doesn't already exist.
 *
 * Usage:
 *   - Run manually: npx prisma db seed
 *   - Run on first deployment: Set SEED_DATABASE=true in environment variables
 */

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
    console.log(`[SEED] User "${username}" already exists, skipping creation`)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      mustChangePassword: false,
    },
  })

  console.log(`[SEED] Created user: ${user.username} (${user.role})`)
}

async function main(): Promise<void> {
  console.log('[SEED] Starting database seed...')

  try {
    for (const userData of SEED_USERS) {
      await seedUser(userData)
    }

    console.log('[SEED] Database seed completed successfully')
  } catch (error) {
    console.error('[SEED] Error during seed execution:', error)
    if (error instanceof Error) {
      console.error('[SEED] Error message:', error.message)
      if (error.stack) {
        console.error('[SEED] Stack trace:', error.stack)
      }
    }
    throw error
  }
}

main()
  .catch((error) => {
    console.error('[SEED] Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
