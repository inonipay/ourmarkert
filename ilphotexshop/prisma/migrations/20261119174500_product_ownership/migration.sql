ALTER TABLE "Product" ADD COLUMN "ownerId" TEXT;

CREATE INDEX "Product_ownerId_idx" ON "Product"("ownerId");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
