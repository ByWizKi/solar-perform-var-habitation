-- AlterTable
ALTER TABLE "system_snapshots" ADD COLUMN     "attachmentType" TEXT,
ADD COLUMN     "interconnectDate" TEXT,
ADD COLUMN     "lastEnergyAt" INTEGER,
ADD COLUMN     "lastReportAt" INTEGER,
ADD COLUMN     "operationalAt" INTEGER,
ADD COLUMN     "reference" TEXT;

-- CreateTable
CREATE TABLE "system_devices" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "sku" TEXT,
    "partNumber" TEXT,
    "productName" TEXT,
    "status" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastReportAt" INTEGER,
    "metadata" JSONB,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_call_logs" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "systemId" TEXT,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "responseTimeMs" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_devices_connectionId_deviceType_idx" ON "system_devices"("connectionId", "deviceType");

-- CreateIndex
CREATE INDEX "system_devices_systemId_deviceType_idx" ON "system_devices"("systemId", "deviceType");

-- CreateIndex
CREATE UNIQUE INDEX "system_devices_connectionId_deviceId_key" ON "system_devices"("connectionId", "deviceId");

-- CreateIndex
CREATE INDEX "api_call_logs_connectionId_timestamp_idx" ON "api_call_logs"("connectionId", "timestamp");

-- CreateIndex
CREATE INDEX "api_call_logs_service_timestamp_idx" ON "api_call_logs"("service", "timestamp");

-- CreateIndex
CREATE INDEX "api_call_logs_endpoint_timestamp_idx" ON "api_call_logs"("endpoint", "timestamp");

-- AddForeignKey
ALTER TABLE "system_devices" ADD CONSTRAINT "system_devices_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "service_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_call_logs" ADD CONSTRAINT "api_call_logs_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "service_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
