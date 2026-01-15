import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { UserRole } from '@/types'

/**
 * Route pour créer manuellement la table enphase_connections si elle n'existe pas
 * Nécessite les permissions super-admin
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // Récupérer l'utilisateur pour vérifier son rôle
    const prismaClient = new PrismaClient()
    const user = await prismaClient.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      await prismaClient.$disconnect()
      return NextResponse.json(
        { error: 'Accès refusé. Permissions super-admin requises.' },
        { status: 403 }
      )
    }

    // Utiliser la connexion directe (POSTGRES_URL) pour les opérations DDL
    // Prisma Accelerate ne permet pas les opérations de schéma
    const directUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL
    if (!directUrl) {
      await prismaClient.$disconnect()
      return NextResponse.json(
        { error: 'POSTGRES_URL non configuré pour les opérations de schéma' },
        { status: 500 }
      )
    }

    // Créer un client Prisma avec la connexion directe
    const prismaDirect = new PrismaClient({
      datasources: {
        db: {
          url: directUrl
        }
      }
    })

    // Script SQL complet pour corriger toutes les tables manquantes/colonnes manquantes

    // 1. Créer la table enphase_connections si elle n'existe pas
    const createEnphaseTableSQL = `
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

    const createEnphaseIndexesSQL = `
      CREATE UNIQUE INDEX IF NOT EXISTS "enphase_connections_systemId_key" ON "enphase_connections"("systemId");
      CREATE UNIQUE INDEX IF NOT EXISTS "enphase_connections_userId_systemId_key" ON "enphase_connections"("userId", "systemId");
      CREATE INDEX IF NOT EXISTS "enphase_connections_userId_idx" ON "enphase_connections"("userId");
    `

    const createEnphaseForeignKeySQL = `
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

    // 2. Ajouter connectionType à production_data si elle n'existe pas
    const addConnectionTypeSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'production_data'
          AND column_name = 'connectionType'
        ) THEN
          ALTER TABLE "production_data"
          ADD COLUMN "connectionType" TEXT NOT NULL DEFAULT 'enphase';

          UPDATE "production_data"
          SET "connectionType" = 'enphase'
          WHERE "connectionType" IS NULL OR "connectionType" = '';
        END IF;
      END $$;
    `

    // 3. Ajouter metadata à production_data si elle n'existe pas (pour compatibilité)
    const addMetadataSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'production_data'
          AND column_name = 'metadata'
        ) THEN
          ALTER TABLE "production_data"
          ADD COLUMN "metadata" JSONB;
        END IF;
      END $$;
    `

    // 4. Mettre à jour les foreign keys de production_data pour pointer vers enphase_connections
    const updateProductionDataForeignKeysSQL = `
      DO $$
      BEGIN
        -- Supprimer l'ancienne foreign key vers service_connections si elle existe
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_schema = 'public'
          AND constraint_name = 'production_data_connectionId_fkey'
        ) THEN
          ALTER TABLE "production_data"
          DROP CONSTRAINT "production_data_connectionId_fkey";
        END IF;

        -- Ajouter la nouvelle foreign key vers enphase_connections si elle n'existe pas
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_schema = 'public'
          AND constraint_name = 'production_data_connectionId_fkey'
        ) THEN
          ALTER TABLE "production_data"
          ADD CONSTRAINT "production_data_connectionId_fkey"
          FOREIGN KEY ("connectionId") REFERENCES "enphase_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `

    // Exécuter toutes les requêtes SQL avec la connexion directe
    await prismaDirect.$executeRawUnsafe(createEnphaseTableSQL)
    await prismaDirect.$executeRawUnsafe(createEnphaseIndexesSQL)
    await prismaDirect.$executeRawUnsafe(createEnphaseForeignKeySQL)
    await prismaDirect.$executeRawUnsafe(addConnectionTypeSQL)
    await prismaDirect.$executeRawUnsafe(addMetadataSQL)
    await prismaDirect.$executeRawUnsafe(updateProductionDataForeignKeysSQL)

    // Fermer les connexions
    await prismaDirect.$disconnect()
    await prismaClient.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'Base de données corrigée avec succès : tables et colonnes créées/mises à jour'
    })
  } catch (error: any) {
    console.error('Erreur lors de la correction de la base de données:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la correction de la base de données',
        message: error.message
      },
      { status: 500 }
    )
  }
}
