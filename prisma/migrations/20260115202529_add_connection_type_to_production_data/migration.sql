-- Migration pour ajouter la colonne connectionType à production_data
-- Cette colonne est requise pour identifier le type de connexion (enphase, solaredge, etc.)

-- Ajouter la colonne connectionType si elle n'existe pas
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
        
        -- Mettre à jour les enregistrements existants pour qu'ils aient tous 'enphase' par défaut
        -- (puisque actuellement seuls les systèmes Enphase sont supportés)
        UPDATE "production_data" 
        SET "connectionType" = 'enphase' 
        WHERE "connectionType" IS NULL OR "connectionType" = '';
    END IF;
END $$;
