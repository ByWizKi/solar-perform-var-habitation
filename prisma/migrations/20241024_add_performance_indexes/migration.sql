-- Migration pour ajouter des index de performance
-- Accélère les requêtes fréquentes sur les tables critiques

-- Index sur production_data pour accélérer la recherche des derniers summary
CREATE INDEX IF NOT EXISTS "production_data_connectionId_interval_source_timestamp_idx"
ON "production_data"("connectionId", "interval", "source", "timestamp" DESC);

-- Index sur production_data pour les requêtes par date
CREATE INDEX IF NOT EXISTS "production_data_connectionId_timestamp_idx"
ON "production_data"("connectionId", "timestamp" DESC);

-- Index sur enphase_connections pour les requêtes par userId et statut actif
CREATE INDEX IF NOT EXISTS "enphase_connections_userId_isActive_idx"
ON "enphase_connections"("userId", "isActive");

-- Index sur users pour les requêtes par createdById (hiérarchie)
CREATE INDEX IF NOT EXISTS "users_createdById_idx"
ON "users"("createdById");

-- Index sur api_call_logs pour les requêtes mensuelles
CREATE INDEX IF NOT EXISTS "api_call_logs_timestamp_idx"
ON "api_call_logs"("timestamp" DESC);

-- Index sur api_call_logs pour les stats par connexion
CREATE INDEX IF NOT EXISTS "api_call_logs_connectionId_timestamp_idx"
ON "api_call_logs"("connectionId", "timestamp" DESC);

