-- CreateTable
CREATE TABLE "system_snapshots" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "systemName" TEXT,
    "publicName" TEXT,
    "timezone" TEXT,
    "address" JSONB,
    "connectionType" TEXT,
    "systemSize" DOUBLE PRECISION,
    "status" TEXT,
    "energyLifetime" DOUBLE PRECISION,
    "energyToday" DOUBLE PRECISION,
    "powerNow" DOUBLE PRECISION,
    "consumptionLifetime" DOUBLE PRECISION,
    "consumptionToday" DOUBLE PRECISION,
    "consumptionNow" DOUBLE PRECISION,
    "batteryLifetime" DOUBLE PRECISION,
    "batteryToday" DOUBLE PRECISION,
    "batteryPercentage" DOUBLE PRECISION,
    "batteryPowerNow" DOUBLE PRECISION,
    "importLifetime" DOUBLE PRECISION,
    "exportLifetime" DOUBLE PRECISION,
    "importToday" DOUBLE PRECISION,
    "exportToday" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_data" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "deviceId" TEXT,
    "power" DOUBLE PRECISION,
    "energy" DOUBLE PRECISION,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "frequency" DOUBLE PRECISION,
    "powerFactor" DOUBLE PRECISION,
    "interval" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_data" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "deviceId" TEXT,
    "power" DOUBLE PRECISION,
    "energy" DOUBLE PRECISION,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "frequency" DOUBLE PRECISION,
    "powerFactor" DOUBLE PRECISION,
    "interval" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumption_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battery_data" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "deviceSerialNo" TEXT NOT NULL,
    "power" DOUBLE PRECISION,
    "energy" DOUBLE PRECISION,
    "percentFull" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "state" TEXT,
    "maxCellTemp" DOUBLE PRECISION,
    "interval" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battery_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_data" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "power" DOUBLE PRECISION,
    "energy" DOUBLE PRECISION,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "status" TEXT,
    "lastReportAt" TIMESTAMP(3),
    "metadata" JSONB,
    "interval" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventTypeId" TEXT,
    "severity" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recommendedAction" TEXT,
    "deviceSerialNo" TEXT,
    "deviceType" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_snapshots_connectionId_timestamp_idx" ON "system_snapshots"("connectionId", "timestamp");

-- CreateIndex
CREATE INDEX "system_snapshots_systemId_timestamp_idx" ON "system_snapshots"("systemId", "timestamp");

-- CreateIndex
CREATE INDEX "production_data_connectionId_timestamp_idx" ON "production_data"("connectionId", "timestamp");

-- CreateIndex
CREATE INDEX "production_data_systemId_timestamp_idx" ON "production_data"("systemId", "timestamp");

-- CreateIndex
CREATE INDEX "production_data_deviceId_timestamp_idx" ON "production_data"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "consumption_data_connectionId_timestamp_idx" ON "consumption_data"("connectionId", "timestamp");

-- CreateIndex
CREATE INDEX "consumption_data_systemId_timestamp_idx" ON "consumption_data"("systemId", "timestamp");

-- CreateIndex
CREATE INDEX "battery_data_connectionId_timestamp_idx" ON "battery_data"("connectionId", "timestamp");

-- CreateIndex
CREATE INDEX "battery_data_systemId_timestamp_idx" ON "battery_data"("systemId", "timestamp");

-- CreateIndex
CREATE INDEX "battery_data_deviceSerialNo_timestamp_idx" ON "battery_data"("deviceSerialNo", "timestamp");

-- CreateIndex
CREATE INDEX "device_data_connectionId_timestamp_idx" ON "device_data"("connectionId", "timestamp");

-- CreateIndex
CREATE INDEX "device_data_systemId_timestamp_idx" ON "device_data"("systemId", "timestamp");

-- CreateIndex
CREATE INDEX "device_data_serialNumber_timestamp_idx" ON "device_data"("serialNumber", "timestamp");

-- CreateIndex
CREATE INDEX "system_events_connectionId_occurredAt_idx" ON "system_events"("connectionId", "occurredAt");

-- CreateIndex
CREATE INDEX "system_events_systemId_occurredAt_idx" ON "system_events"("systemId", "occurredAt");

-- CreateIndex
CREATE INDEX "system_events_eventType_isResolved_idx" ON "system_events"("eventType", "isResolved");

-- AddForeignKey
ALTER TABLE "system_snapshots" ADD CONSTRAINT "system_snapshots_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "service_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_data" ADD CONSTRAINT "production_data_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "service_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_data" ADD CONSTRAINT "consumption_data_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "service_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battery_data" ADD CONSTRAINT "battery_data_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "service_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_data" ADD CONSTRAINT "device_data_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "service_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "service_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
