ALTER TABLE "User"
  ALTER COLUMN "twoFactorSecret" TYPE VARCHAR(128),
  ADD COLUMN "twoFactorPendingSecret" VARCHAR(128);
