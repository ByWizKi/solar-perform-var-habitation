-- Migration pour créer la table enphase_connections
-- Cette table stocke les connexions OAuth Enphase pour chaque utilisateur

-- Vérifier si la table existe déjà, sinon la créer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'enphase_connections'
    ) THEN
        -- Créer la table
        CREATE TABLE "enphase_connections" (
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

        -- Créer les index (avec IF NOT EXISTS pour éviter les erreurs)
        CREATE UNIQUE INDEX IF NOT EXISTS "enphase_connections_systemId_key" ON "enphase_connections"("systemId");
        CREATE UNIQUE INDEX IF NOT EXISTS "enphase_connections_userId_systemId_key" ON "enphase_connections"("userId", "systemId");
        CREATE INDEX IF NOT EXISTS "enphase_connections_userId_idx" ON "enphase_connections"("userId");

        -- Ajouter la foreign key (vérifier d'abord si elle existe)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'enphase_connections_userId_fkey'
        ) THEN
            ALTER TABLE "enphase_connections" 
            ADD CONSTRAINT "enphase_connections_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
