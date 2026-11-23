CREATE TYPE "MerchantAccessAction" AS ENUM ('suspended', 'reactivated');

ALTER TABLE "User"
ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "MerchantAccessAudit" (
    "id" VARCHAR(100) NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "MerchantAccessAction" NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantAccessAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MerchantAccessAudit_actorId_createdAt_idx"
ON "MerchantAccessAudit"("actorId", "createdAt");

CREATE INDEX "MerchantAccessAudit_targetId_createdAt_idx"
ON "MerchantAccessAudit"("targetId", "createdAt");

ALTER TABLE "MerchantAccessAudit"
ADD CONSTRAINT "MerchantAccessAudit_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantAccessAudit"
ADD CONSTRAINT "MerchantAccessAudit_targetId_fkey"
FOREIGN KEY ("targetId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
