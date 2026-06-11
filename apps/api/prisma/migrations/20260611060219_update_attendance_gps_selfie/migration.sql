-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkInNote" TEXT,
ADD COLUMN     "checkOutNote" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "selfieUrl" TEXT;
