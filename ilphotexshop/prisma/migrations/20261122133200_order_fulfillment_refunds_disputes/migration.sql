ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'delivered';

CREATE TYPE "RefundStatus" AS ENUM ('requested', 'approved', 'rejected', 'refunded', 'cancelled');
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'under_review', 'resolved', 'closed');

CREATE TABLE "OrderShipment" (
  "id" VARCHAR(100) NOT NULL,
  "orderId" VARCHAR(100) NOT NULL,
  "carrier" VARCHAR(160) NOT NULL,
  "trackingNumber" VARCHAR(160) NOT NULL,
  "status" VARCHAR(80) NOT NULL,
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "notes" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderShipment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderShipment_orderId_createdAt_idx" ON "OrderShipment"("orderId", "createdAt");
CREATE INDEX "OrderShipment_trackingNumber_idx" ON "OrderShipment"("trackingNumber");
ALTER TABLE "OrderShipment" ADD CONSTRAINT "OrderShipment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OrderRefund" (
  "id" VARCHAR(100) NOT NULL,
  "orderId" VARCHAR(100) NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'requested',
  "reviewedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderRefund_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderRefund_orderId_createdAt_idx" ON "OrderRefund"("orderId", "createdAt");
CREATE INDEX "OrderRefund_status_createdAt_idx" ON "OrderRefund"("status", "createdAt");
ALTER TABLE "OrderRefund" ADD CONSTRAINT "OrderRefund_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OrderDispute" (
  "id" VARCHAR(100) NOT NULL,
  "orderId" VARCHAR(100) NOT NULL,
  "openedById" TEXT NOT NULL,
  "assignedToId" TEXT,
  "reason" VARCHAR(500) NOT NULL,
  "resolution" VARCHAR(500),
  "status" "DisputeStatus" NOT NULL DEFAULT 'open',
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderDispute_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderDispute_orderId_createdAt_idx" ON "OrderDispute"("orderId", "createdAt");
CREATE INDEX "OrderDispute_status_createdAt_idx" ON "OrderDispute"("status", "createdAt");
ALTER TABLE "OrderDispute" ADD CONSTRAINT "OrderDispute_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
