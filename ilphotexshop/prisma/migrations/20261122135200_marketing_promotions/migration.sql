CREATE TYPE "MarketingStatus" AS ENUM ('draft', 'scheduled', 'active', 'paused', 'ended', 'cancelled');
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed_amount');
CREATE TYPE "MarketingBannerPlacement" AS ENUM ('homepage', 'category', 'checkout');

ALTER TABLE "User" ADD COLUMN "isFeaturedMerchant" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Coupon" (
  "id" VARCHAR(100) NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" VARCHAR(500),
  "discountType" "DiscountType" NOT NULL,
  "discountValue" INTEGER NOT NULL,
  "minimumSubtotal" INTEGER NOT NULL DEFAULT 0,
  "maximumDiscount" INTEGER,
  "usageLimit" INTEGER,
  "perUserLimit" INTEGER NOT NULL DEFAULT 1,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "status" "MarketingStatus" NOT NULL DEFAULT 'draft',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_status_startsAt_endsAt_idx" ON "Coupon"("status", "startsAt", "endsAt");
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CouponRedemption" (
  "id" VARCHAR(100) NOT NULL,
  "couponId" VARCHAR(100) NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" VARCHAR(100) NOT NULL,
  "discountAmount" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CouponRedemption_couponId_orderId_key" ON "CouponRedemption"("couponId", "orderId");
CREATE INDEX "CouponRedemption_couponId_createdAt_idx" ON "CouponRedemption"("couponId", "createdAt");
CREATE INDEX "CouponRedemption_userId_createdAt_idx" ON "CouponRedemption"("userId", "createdAt");
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MarketingCampaign" (
  "id" VARCHAR(100) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" VARCHAR(1000),
  "kind" VARCHAR(40) NOT NULL,
  "status" "MarketingStatus" NOT NULL DEFAULT 'draft',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketingCampaign_status_startsAt_endsAt_idx" ON "MarketingCampaign"("status", "startsAt", "endsAt");
CREATE INDEX "MarketingCampaign_kind_createdAt_idx" ON "MarketingCampaign"("kind", "createdAt");
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MarketingCampaignEvent" (
  "id" VARCHAR(100) NOT NULL,
  "campaignId" VARCHAR(100) NOT NULL,
  "type" VARCHAR(40) NOT NULL,
  "userId" TEXT,
  "orderId" VARCHAR(100),
  "amount" INTEGER,
  "currency" CHAR(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingCampaignEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketingCampaignEvent_campaignId_type_createdAt_idx"
  ON "MarketingCampaignEvent"("campaignId", "type", "createdAt");
CREATE INDEX "MarketingCampaignEvent_createdAt_idx"
  ON "MarketingCampaignEvent"("createdAt");
ALTER TABLE "MarketingCampaignEvent"
  ADD CONSTRAINT "MarketingCampaignEvent_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FeaturedMerchant" (
  "id" VARCHAR(100) NOT NULL,
  "merchantId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeaturedMerchant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeaturedMerchant_merchantId_key" ON "FeaturedMerchant"("merchantId");
CREATE INDEX "FeaturedMerchant_isActive_position_idx" ON "FeaturedMerchant"("isActive", "position");
ALTER TABLE "FeaturedMerchant"
  ADD CONSTRAINT "FeaturedMerchant_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HomepageBanner" (
  "id" VARCHAR(100) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "subtitle" VARCHAR(500),
  "imageUrl" VARCHAR(2048) NOT NULL,
  "hrefUrl" VARCHAR(2048),
  "placement" "MarketingBannerPlacement" NOT NULL DEFAULT 'homepage',
  "status" "MarketingStatus" NOT NULL DEFAULT 'draft',
  "position" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomepageBanner_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HomepageBanner_placement_status_startsAt_endsAt_position_idx"
  ON "HomepageBanner"("placement", "status", "startsAt", "endsAt", "position");
ALTER TABLE "HomepageBanner"
  ADD CONSTRAINT "HomepageBanner_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
