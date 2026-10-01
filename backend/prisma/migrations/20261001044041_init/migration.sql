-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ElectrolyzerStatus" AS ENUM ('RUNNING', 'IDLE', 'MAINTENANCE', 'FAULT');

-- CreateEnum
CREATE TYPE "ChargingStatus" AS ENUM ('CHARGING', 'DISCHARGING', 'IDLE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_RENEWABLE', 'LOW_BATTERY', 'HIGH_BATTERY', 'LOW_HYDROGEN_STORAGE', 'HIGH_HYDROGEN_STORAGE', 'PRODUCTION', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyReading" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solarGeneration" DOUBLE PRECISION NOT NULL,
    "windGeneration" DOUBLE PRECISION NOT NULL,
    "solarCapacity" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "windCapacity" DOUBLE PRECISION NOT NULL DEFAULT 400,
    "demand" DOUBLE PRECISION NOT NULL,
    "gridExport" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergyReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HydrogenProduction" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productionRate" DOUBLE PRECISION NOT NULL,
    "targetRate" DOUBLE PRECISION NOT NULL,
    "electrolyzerStatus" "ElectrolyzerStatus" NOT NULL DEFAULT 'RUNNING',
    "energyConsumed" DOUBLE PRECISION NOT NULL,
    "efficiency" DOUBLE PRECISION NOT NULL DEFAULT 65,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HydrogenProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageStatus" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batteryLevel" DOUBLE PRECISION NOT NULL,
    "batteryCapacity" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "hydrogenLevel" DOUBLE PRECISION NOT NULL,
    "hydrogenCapacity" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "chargingStatus" "ChargingStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationResult" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputSolar" DOUBLE PRECISION NOT NULL,
    "inputWind" DOUBLE PRECISION NOT NULL,
    "inputDemand" DOUBLE PRECISION NOT NULL,
    "batteryLevel" DOUBLE PRECISION NOT NULL,
    "hydrogenLevel" DOUBLE PRECISION NOT NULL,
    "currentHydrogenAlloc" DOUBLE PRECISION NOT NULL,
    "currentBatteryAlloc" DOUBLE PRECISION NOT NULL,
    "currentGridAlloc" DOUBLE PRECISION NOT NULL,
    "optimizedHydrogenAlloc" DOUBLE PRECISION NOT NULL,
    "optimizedBatteryAlloc" DOUBLE PRECISION NOT NULL,
    "optimizedGridAlloc" DOUBLE PRECISION NOT NULL,
    "efficiencyImprovement" DOUBLE PRECISION NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'rule-based-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "EnergyReading_timestamp_idx" ON "EnergyReading"("timestamp");

-- CreateIndex
CREATE INDEX "HydrogenProduction_timestamp_idx" ON "HydrogenProduction"("timestamp");

-- CreateIndex
CREATE INDEX "StorageStatus_timestamp_idx" ON "StorageStatus"("timestamp");

-- CreateIndex
CREATE INDEX "OptimizationResult_timestamp_idx" ON "OptimizationResult"("timestamp");

-- CreateIndex
CREATE INDEX "Alert_resolved_createdAt_idx" ON "Alert"("resolved", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
