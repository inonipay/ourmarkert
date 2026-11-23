-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('technology', 'fashion', 'home', 'beauty');

-- CreateTable
CREATE TABLE "Product" (
    "id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "nameFr" VARCHAR(160),
    "nameRw" VARCHAR(160),
    "category" "ProductCategory" NOT NULL,
    "price" INTEGER NOT NULL,
    "previousPrice" INTEGER,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "badge" VARCHAR(80),
    "badgeFr" VARCHAR(80),
    "badgeRw" VARCHAR(80),
    "image" VARCHAR(2048) NOT NULL,
    "seller" VARCHAR(160) NOT NULL,
    "location" VARCHAR(120) NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_isPublished_category_idx" ON "Product"("isPublished", "category");

-- CreateIndex
CREATE INDEX "Product_isPublished_createdAt_idx" ON "Product"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "Product_isPublished_price_idx" ON "Product"("isPublished", "price");
