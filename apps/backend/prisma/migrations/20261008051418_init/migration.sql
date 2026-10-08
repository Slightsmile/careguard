-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- CreateTable
CREATE TABLE "MonitoredAPI" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "responseTimeThreshold" INTEGER NOT NULL DEFAULT 3000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredAPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringCheck" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseTimeMs" INTEGER,
    "recordsReturned" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL,
    "monitoringCheckId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "anomalyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "possibleCause" TEXT,
    "recommendedAction" TEXT,
    "severity" "Severity" NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredAPI_name_key" ON "MonitoredAPI"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_anomalyId_key" ON "Alert"("anomalyId");

-- AddForeignKey
ALTER TABLE "MonitoringCheck" ADD CONSTRAINT "MonitoringCheck_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "MonitoredAPI"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_monitoringCheckId_fkey" FOREIGN KEY ("monitoringCheckId") REFERENCES "MonitoringCheck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_anomalyId_fkey" FOREIGN KEY ("anomalyId") REFERENCES "Anomaly"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
