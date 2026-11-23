ALTER TYPE "UserRole" ADD VALUE 'super_admin';

ALTER TABLE "User"
ADD COLUMN "phone" VARCHAR(32);
