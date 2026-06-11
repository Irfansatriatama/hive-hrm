-- CreateTable
CREATE TABLE "LicenseType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "validityDays" INTEGER NOT NULL DEFAULT 365,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLicense" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "licenseTypeId" TEXT,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "issuedBy" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeLicense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LicenseType_code_key" ON "LicenseType"("code");

-- AddForeignKey
ALTER TABLE "EmployeeLicense" ADD CONSTRAINT "EmployeeLicense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLicense" ADD CONSTRAINT "EmployeeLicense_licenseTypeId_fkey" FOREIGN KEY ("licenseTypeId") REFERENCES "LicenseType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
