CREATE TYPE "ProductReportStatus" AS ENUM ('pending', 'reviewed', 'dismissed');

ALTER TABLE "Product"
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "subcategoryId" VARCHAR(100);

CREATE TABLE "ProductSubcategory" (
  "id" VARCHAR(100) NOT NULL,
  "category" "ProductCategory" NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductSubcategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductSubcategory_category_slug_key" ON "ProductSubcategory"("category", "slug");
CREATE INDEX "ProductSubcategory_category_isActive_idx" ON "ProductSubcategory"("category", "isActive");

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_subcategoryId_fkey"
  FOREIGN KEY ("subcategoryId") REFERENCES "ProductSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductReport" (
  "id" VARCHAR(100) NOT NULL,
  "productId" VARCHAR(100) NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "status" "ProductReportStatus" NOT NULL DEFAULT 'pending',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductReport_status_createdAt_idx" ON "ProductReport"("status", "createdAt");
CREATE INDEX "ProductReport_productId_createdAt_idx" ON "ProductReport"("productId", "createdAt");
CREATE INDEX "ProductReport_reporterId_createdAt_idx" ON "ProductReport"("reporterId", "createdAt");

ALTER TABLE "ProductReport"
  ADD CONSTRAINT "ProductReport_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductReport"
  ADD CONSTRAINT "ProductReport_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductReport"
  ADD CONSTRAINT "ProductReport_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
