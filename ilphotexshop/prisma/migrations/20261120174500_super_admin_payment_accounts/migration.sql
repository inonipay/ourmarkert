CREATE TYPE "PaymentAccountType" AS ENUM ('bank', 'mobile_money');

CREATE TABLE "SuperAdminPaymentAccount" (
    "id" VARCHAR(100) NOT NULL,
    "type" "PaymentAccountType" NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "accountName" VARCHAR(160) NOT NULL,
    "accountNumber" VARCHAR(100) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'RWF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminPaymentAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SuperAdminPaymentAccount_type_isActive_idx"
ON "SuperAdminPaymentAccount"("type", "isActive");

CREATE INDEX "SuperAdminPaymentAccount_createdAt_idx"
ON "SuperAdminPaymentAccount"("createdAt");

CREATE UNIQUE INDEX "PaymentAccount_account_unique"
ON "SuperAdminPaymentAccount"("type", "provider", "accountNumber", "currency");
