-- Script SQL pour créer manuellement la table enphase_connections
-- À exécuter directement sur la base de données si la migration ne fonctionne pas

-- Créer la table si elle n'existe pas
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

-- Créer les index
CREATE UNIQUE INDEX IF NOT EXISTS "enphase_connections_systemId_key" ON "enphase_connections"("systemId");
CREATE UNIQUE INDEX IF NOT EXISTS "enphase_connections_userId_systemId_key" ON "enphase_connections"("userId", "systemId");
CREATE INDEX IF NOT EXISTS "enphase_connections_userId_idx" ON "enphase_connections"("userId");

-- Ajouter la foreign key si elle n'existe pas
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
