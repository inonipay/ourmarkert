CREATE TYPE "MerchantStaffRole" AS ENUM ('owner', 'manager', 'operations', 'support', 'finance');
CREATE TYPE "MerchantStaffStatus" AS ENUM ('active', 'inactive');

CREATE TABLE "MerchantStaff" (
  "id" VARCHAR(100) NOT NULL,
  "merchantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "MerchantStaffRole" NOT NULL DEFAULT 'support',
  "status" "MerchantStaffStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MerchantStaff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantStaff_merchantId_userId_key" ON "MerchantStaff"("merchantId", "userId");
CREATE INDEX "MerchantStaff_merchantId_status_idx" ON "MerchantStaff"("merchantId", "status");
CREATE INDEX "MerchantStaff_userId_idx" ON "MerchantStaff"("userId");

ALTER TABLE "MerchantStaff"
  ADD CONSTRAINT "MerchantStaff_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MerchantStaff"
  ADD CONSTRAINT "MerchantStaff_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MerchantFinancialProfile" (
  "id" VARCHAR(100) NOT NULL,
  "merchantId" TEXT NOT NULL,
  "accountName" VARCHAR(160) NOT NULL,
  "bankName" VARCHAR(160),
  "bankAccountNumber" VARCHAR(100),
  "mobileMoneyProvider" VARCHAR(100),
  "mobileMoneyNumber" VARCHAR(32),
  "currency" CHAR(3) NOT NULL DEFAULT 'RWF',
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "verifiedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MerchantFinancialProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantFinancialProfile_merchantId_key" ON "MerchantFinancialProfile"("merchantId");
CREATE INDEX "MerchantFinancialProfile_isVerified_currency_idx" ON "MerchantFinancialProfile"("isVerified", "currency");

ALTER TABLE "MerchantFinancialProfile"
  ADD CONSTRAINT "MerchantFinancialProfile_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MerchantFinancialProfile"
  ADD CONSTRAINT "MerchantFinancialProfile_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
