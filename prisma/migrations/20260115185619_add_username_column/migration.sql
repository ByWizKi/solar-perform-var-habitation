-- Migration pour ajouter la colonne username et supprimer email si nécessaire
-- Cette migration transforme le système d'authentification de email vers username

-- Ajouter la colonne username si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        -- Ajouter username avec une valeur temporaire basée sur email ou id
        ALTER TABLE "users" ADD COLUMN "username" TEXT;
        
        -- Remplir username avec email si email existe, sinon avec id
        UPDATE "users" 
        SET "username" = COALESCE(
            (SELECT "email" FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email' LIMIT 1),
            "id"
        );
        
        -- Rendre username NOT NULL et UNIQUE
        ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
        
        -- Supprimer email si elle existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'email'
        ) THEN
            ALTER TABLE "users" DROP COLUMN "email";
        END IF;
    END IF;
END $$;

-- Ajouter mustChangePassword si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'mustChangePassword'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Ajouter dailyRefreshCount et lastRefreshDate si elles n'existent pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'dailyRefreshCount'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "dailyRefreshCount" INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'lastRefreshDate'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "lastRefreshDate" TIMESTAMP(3);
    END IF;
END $$;
