-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'all',
ALTER COLUMN "isPublic" SET DEFAULT true;

-- CreateTable
CREATE TABLE "DocumentFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFolder_name_key" ON "DocumentFolder"("name");
