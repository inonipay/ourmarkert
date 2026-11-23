CREATE TYPE "ProductModerationStatus" AS ENUM ('draft', 'pending', 'published', 'rejected', 'hidden');

ALTER TABLE "Product"
  ADD COLUMN "moderationStatus" "ProductModerationStatus" NOT NULL DEFAULT 'draft',
  ADD COLUMN "moderationReason" VARCHAR(500),
  ADD COLUMN "moderatedAt" TIMESTAMP(3),
  ADD COLUMN "moderatedById" TEXT;

UPDATE "Product"
SET "moderationStatus" = CASE
  WHEN "isPublished" = true THEN 'published'::"ProductModerationStatus"
  ELSE 'draft'::"ProductModerationStatus"
END;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_moderatedById_fkey"
  FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Product_moderationStatus_createdAt_idx"
  ON "Product"("moderationStatus", "createdAt");
