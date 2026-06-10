-- AlterTable
ALTER TABLE "LeaveType" ADD COLUMN     "accrualType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "carryOver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxCarry" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LeaveBlackout" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBlackout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 11,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBlackout_date_key" ON "LeaveBlackout"("date");
