CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'fulfilled', 'cancelled');

CREATE TABLE "Order" (
    "id" VARCHAR(100) NOT NULL,
    "customerId" TEXT NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "deliveryName" VARCHAR(100) NOT NULL,
    "deliveryPhone" VARCHAR(32) NOT NULL,
    "deliveryAddress" VARCHAR(500) NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'RWF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
    "id" VARCHAR(100) NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" VARCHAR(100),
    "sellerId" TEXT,
    "productName" VARCHAR(160) NOT NULL,
    "productImage" VARCHAR(2048) NOT NULL,
    "sellerName" VARCHAR(160) NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE UNIQUE INDEX "Order_customerId_idempotencyKey_key" ON "Order"("customerId", "idempotencyKey");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "OrderItem_sellerId_createdAt_idx" ON "OrderItem"("sellerId", "createdAt");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_sellerId_fkey"
FOREIGN KEY ("sellerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
