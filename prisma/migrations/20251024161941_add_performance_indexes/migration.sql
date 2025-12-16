-- Migration pour ajouter des index de performance
-- Accélère les requêtes fréquentes sur les tables critiques

-- Index sur production_data pour accélérer la recherche des derniers summary
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_data') THEN
        CREATE INDEX IF NOT EXISTS "production_data_connectionId_interval_source_timestamp_idx"
        ON "production_data"("connectionId", "interval", "source", "timestamp" DESC);

        CREATE INDEX IF NOT EXISTS "production_data_connectionId_timestamp_idx"
        ON "production_data"("connectionId", "timestamp" DESC);
    END IF;
END $$;

-- Index sur enphase_connections pour les requêtes par userId et statut actif
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enphase_connections') THEN
        CREATE INDEX IF NOT EXISTS "enphase_connections_userId_isActive_idx"
        ON "enphase_connections"("userId", "isActive");
    END IF;
END $$;

-- Index sur users pour les requêtes par createdById (hiérarchie)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE INDEX IF NOT EXISTS "users_createdById_idx"
        ON "users"("createdById");
    END IF;
END $$;

-- Index sur api_call_logs pour les requêtes mensuelles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_call_logs') THEN
        CREATE INDEX IF NOT EXISTS "api_call_logs_timestamp_idx"
        ON "api_call_logs"("timestamp" DESC);

        CREATE INDEX IF NOT EXISTS "api_call_logs_connectionId_timestamp_idx"
        ON "api_call_logs"("connectionId", "timestamp" DESC);
    END IF;
END $$;

