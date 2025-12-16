-- AddColumn source to production_data (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'production_data' AND column_name = 'source'
    ) THEN
        ALTER TABLE "production_data" ADD COLUMN "source" TEXT;
    END IF;
END $$;

-- CreateIndex for source field (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS "production_data_source_idx" ON "production_data"("source");

