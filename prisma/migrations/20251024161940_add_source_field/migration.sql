-- AddColumn source to production_data
ALTER TABLE "production_data" ADD COLUMN "source" TEXT;

-- CreateIndex for source field
CREATE INDEX "production_data_source_idx" ON "production_data"("source");

