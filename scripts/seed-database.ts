/**
 * Database seed script - Run this once to initialize the database
 * 
 * Usage:
 *   npx tsx scripts/seed-database.ts
 */

import { execSync } from 'child_process'

const shouldSeed = process.env.SEED_DATABASE === 'true'

if (!shouldSeed) {
  console.log('[SEED] SEED_DATABASE is not set to "true", skipping seed')
  process.exit(0)
}

try {
  console.log('[SEED] Running database seed...')
  execSync('npx prisma db seed', { stdio: 'inherit' })
  console.log('[SEED] Database seed completed')
} catch (error) {
  console.error('[SEED] Error running seed:', error)
  process.exit(1)
}
