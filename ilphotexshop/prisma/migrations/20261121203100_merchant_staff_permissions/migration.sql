ALTER TABLE "MerchantStaff"
  ADD COLUMN "canManageProducts" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageOrders" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageStaff" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageFinancialProfile" BOOLEAN NOT NULL DEFAULT false;
