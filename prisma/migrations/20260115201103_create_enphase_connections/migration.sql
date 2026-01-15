-- Migration pour créer la table enphase_connections
-- Cette table stocke les connexions OAuth Enphase pour chaque utilisateur

-- Vérifier si la table existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'enphase_connections'
    ) THEN
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

        -- Créer l'index unique sur systemId
        CREATE UNIQUE INDEX "enphase_connections_systemId_key" ON "enphase_connections"("systemId");

        -- Créer l'index unique sur userId et systemId
        CREATE UNIQUE INDEX "enphase_connections_userId_systemId_key" ON "enphase_connections"("userId", "systemId");

        -- Créer l'index sur userId
        CREATE INDEX "enphase_connections_userId_idx" ON "enphase_connections"("userId");

        -- Ajouter la foreign key vers users
        ALTER TABLE "enphase_connections" 
        ADD CONSTRAINT "enphase_connections_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
