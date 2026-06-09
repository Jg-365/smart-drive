-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'ETHANOL', 'FLEX', 'DIESEL', 'ELECTRIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'PAIRING', 'ERROR');

-- CreateEnum
CREATE TYPE "TripMode" AS ENUM ('REAL', 'DEMO', 'SIMULATOR');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('ACTIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DrivingEventType" AS ENUM ('HARD_ACCELERATION', 'HARD_BRAKE', 'SHARP_TURN', 'IMPACT_SUSPECTED', 'SPEED_SPIKE', 'GPS_LOST', 'DEVICE_DISCONNECTED');

-- CreateEnum
CREATE TYPE "EventSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "engine" TEXT NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "tankCapacityLiters" DOUBLE PRECISION NOT NULL,
    "baseUrbanConsumptionKmL" DOUBLE PRECISION NOT NULL,
    "baseHighwayConsumptionKmL" DOUBLE PRECISION NOT NULL,
    "baseMixedConsumptionKmL" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "calibrationFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleId" TEXT,
    "firmwareVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "status" "DeviceStatus" NOT NULL DEFAULT 'PAIRING',

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "mode" "TripMode" NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "averageSpeedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSpeedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedConsumptionKmL" DOUBLE PRECISION,
    "estimatedFuelSpentLiters" DOUBLE PRECISION,
    "drivingScore" INTEGER,
    "vehicleSnapshot" JSONB NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_points" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "speedKmh" DOUBLE PRECISION,
    "satellites" INTEGER,
    "hdop" DOUBLE PRECISION,
    "accelX" DOUBLE PRECISION NOT NULL,
    "accelY" DOUBLE PRECISION NOT NULL,
    "accelZ" DOUBLE PRECISION NOT NULL,
    "gyroX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gyroY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gyroZ" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "telemetry_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driving_events" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "type" "DrivingEventType" NOT NULL,
    "severity" "EventSeverity" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "value" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "driving_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_estimates" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "baseConsumptionKmL" DOUBLE PRECISION NOT NULL,
    "adjustedConsumptionKmL" DOUBLE PRECISION NOT NULL,
    "estimatedLitersSpent" DOUBLE PRECISION NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,

    CONSTRAINT "fuel_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refuel_records" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "pricePerLiter" DOUBLE PRECISION NOT NULL,
    "odometerKm" DOUBLE PRECISION NOT NULL,
    "fullTank" BOOLEAN NOT NULL DEFAULT true,
    "computedRealConsumptionKmL" DOUBLE PRECISION,

    CONSTRAINT "refuel_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "vehicles_ownerId_idx" ON "vehicles"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_deviceCode_key" ON "devices"("deviceCode");

-- CreateIndex
CREATE INDEX "devices_vehicleId_idx" ON "devices"("vehicleId");

-- CreateIndex
CREATE INDEX "trips_vehicleId_startedAt_idx" ON "trips"("vehicleId", "startedAt");

-- CreateIndex
CREATE INDEX "telemetry_points_tripId_timestamp_idx" ON "telemetry_points"("tripId", "timestamp");

-- CreateIndex
CREATE INDEX "driving_events_tripId_timestamp_idx" ON "driving_events"("tripId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_estimates_tripId_key" ON "fuel_estimates"("tripId");

-- CreateIndex
CREATE INDEX "refuel_records_vehicleId_date_idx" ON "refuel_records"("vehicleId", "date");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_points" ADD CONSTRAINT "telemetry_points_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driving_events" ADD CONSTRAINT "driving_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_estimates" ADD CONSTRAINT "fuel_estimates_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refuel_records" ADD CONSTRAINT "refuel_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
