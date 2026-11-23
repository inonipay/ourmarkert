CREATE TYPE "MerchantKycStatus" AS ENUM ('pending', 'approved');
CREATE TYPE "MerchantKycAuditAction" AS ENUM ('approved', 'rejected', 'erased');

ALTER TABLE "User"
ADD COLUMN "isAnonymized" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "MerchantKyc" (
    "id" VARCHAR(100) NOT NULL,
    "userId" TEXT NOT NULL,
    "ownerFullName" VARCHAR(100) NOT NULL,
    "businessName" VARCHAR(160) NOT NULL,
    "businessAddress" VARCHAR(500) NOT NULL,
    "taxId" VARCHAR(64),
    "registrationDocument" BYTEA NOT NULL,
    "registrationDocumentName" VARCHAR(255) NOT NULL,
    "registrationDocumentMimeType" VARCHAR(100) NOT NULL,
    "identityDocument" BYTEA NOT NULL,
    "identityDocumentName" VARCHAR(255) NOT NULL,
    "identityDocumentMimeType" VARCHAR(100) NOT NULL,
    "status" "MerchantKycStatus" NOT NULL DEFAULT 'pending',
    "reviewReason" VARCHAR(500),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantKyc_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MerchantKycAudit" (
    "id" VARCHAR(100) NOT NULL,
    "applicationId" VARCHAR(100) NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "MerchantKycAuditAction" NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantKycAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantKyc_userId_key" ON "MerchantKyc"("userId");
CREATE INDEX "MerchantKyc_status_submittedAt_idx"
ON "MerchantKyc"("status", "submittedAt");
CREATE INDEX "MerchantKycAudit_applicationId_createdAt_idx"
ON "MerchantKycAudit"("applicationId", "createdAt");
CREATE INDEX "MerchantKycAudit_actorId_createdAt_idx"
ON "MerchantKycAudit"("actorId", "createdAt");
CREATE INDEX "MerchantKycAudit_action_createdAt_idx"
ON "MerchantKycAudit"("action", "createdAt");

ALTER TABLE "MerchantKyc"
ADD CONSTRAINT "MerchantKyc_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantKyc"
ADD CONSTRAINT "MerchantKyc_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MerchantKycAudit"
ADD CONSTRAINT "MerchantKycAudit_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
