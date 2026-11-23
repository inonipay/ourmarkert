CREATE TYPE "PaymentProofMethod" AS ENUM ('bank_transfer', 'mobile_money');
CREATE TYPE "OrderPaymentProofStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "OrderPaymentProof" (
    "id" VARCHAR(100) NOT NULL,
    "orderId" VARCHAR(100) NOT NULL,
    "customerId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "method" "PaymentProofMethod" NOT NULL,
    "transactionReference" VARCHAR(120) NOT NULL,
    "document" BYTEA NOT NULL,
    "documentName" VARCHAR(255) NOT NULL,
    "documentMimeType" VARCHAR(100) NOT NULL,
    "status" "OrderPaymentProofStatus" NOT NULL DEFAULT 'pending',
    "reviewReason" VARCHAR(500),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPaymentProof_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderPaymentProof_orderId_status_idx"
ON "OrderPaymentProof"("orderId", "status");
CREATE INDEX "OrderPaymentProof_status_createdAt_idx"
ON "OrderPaymentProof"("status", "createdAt");
CREATE INDEX "OrderPaymentProof_customerId_createdAt_idx"
ON "OrderPaymentProof"("customerId", "createdAt");

ALTER TABLE "OrderPaymentProof"
ADD CONSTRAINT "OrderPaymentProof_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderPaymentProof"
ADD CONSTRAINT "OrderPaymentProof_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderPaymentProof"
ADD CONSTRAINT "OrderPaymentProof_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
