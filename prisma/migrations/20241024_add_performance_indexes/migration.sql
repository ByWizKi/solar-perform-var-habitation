-- Migration pour ajouter des index de performance
-- Accélère les requêtes fréquentes sur les tables critiques

-- Index sur ProductionData pour accélérer la recherche des derniers summary
CREATE INDEX IF NOT EXISTS "ProductionData_connectionId_interval_source_timestamp_idx"
ON "ProductionData"("connectionId", "interval", "source", "timestamp" DESC);

-- Index sur ProductionData pour les requêtes par date
CREATE INDEX IF NOT EXISTS "ProductionData_connectionId_timestamp_idx"
ON "ProductionData"("connectionId", "timestamp" DESC);

-- Index sur EnphaseConnection pour les requêtes par userId et statut actif
CREATE INDEX IF NOT EXISTS "EnphaseConnection_userId_isActive_idx"
ON "EnphaseConnection"("userId", "isActive");

-- Index sur User pour les requêtes par createdById (hiérarchie)
CREATE INDEX IF NOT EXISTS "User_createdById_idx"
ON "User"("createdById");

-- Index sur ApiCallLog pour les requêtes mensuelles
CREATE INDEX IF NOT EXISTS "ApiCallLog_timestamp_idx"
ON "ApiCallLog"("timestamp" DESC);

-- Index sur ApiCallLog pour les stats par connexion
CREATE INDEX IF NOT EXISTS "ApiCallLog_connectionId_timestamp_idx"
ON "ApiCallLog"("connectionId", "timestamp" DESC);

