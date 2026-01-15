import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { hasPermission } from '@/lib/permissions'

/**
 * Route pour créer manuellement la table enphase_connections si elle n'existe pas
 * Nécessite les permissions super-admin
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Vérifier les permissions super-admin
    if (!hasPermission(user, 'super-admin')) {
      return NextResponse.json(
        { error: 'Accès refusé. Permissions super-admin requises.' },
        { status: 403 }
      )
    }

    // Exécuter le script SQL pour créer la table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "enphase_connections" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "accessToken" TEXT NOT NULL,
        "refreshToken" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "systemId" TEXT,
        "systemName" TEXT,
        "systemSize" DOUBLE PRECISION,
        "timezone" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastSyncAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "enphase_connections_pkey" PRIMARY KEY ("id")
      );
    `

    const createIndexesSQL = `
      CREATE UNIQUE INDEX IF NOT EXISTS "enphase_connections_systemId_key" ON "enphase_connections"("systemId");
      CREATE UNIQUE INDEX IF NOT EXISTS "enphase_connections_userId_systemId_key" ON "enphase_connections"("userId", "systemId");
      CREATE INDEX IF NOT EXISTS "enphase_connections_userId_idx" ON "enphase_connections"("userId");
    `

    const createForeignKeySQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_schema = 'public' 
          AND constraint_name = 'enphase_connections_userId_fkey'
        ) THEN
          ALTER TABLE "enphase_connections" 
          ADD CONSTRAINT "enphase_connections_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `

    // Exécuter les requêtes SQL
    await prisma.$executeRawUnsafe(createTableSQL)
    await prisma.$executeRawUnsafe(createIndexesSQL)
    await prisma.$executeRawUnsafe(createForeignKeySQL)

    return NextResponse.json({
      success: true,
      message: 'Table enphase_connections créée avec succès'
    })
  } catch (error: any) {
    console.error('Erreur lors de la création de la table:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la création de la table',
        message: error.message
      },
      { status: 500 }
    )
  }
}
