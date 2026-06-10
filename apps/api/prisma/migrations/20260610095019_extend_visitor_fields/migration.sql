-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "badgeNumber" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "idType" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "vehicleNumber" TEXT,
ALTER COLUMN "status" SET DEFAULT 'checked_in';
