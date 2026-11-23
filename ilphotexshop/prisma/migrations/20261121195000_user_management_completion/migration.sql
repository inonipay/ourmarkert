CREATE TYPE "StaffInvitationStatus" AS ENUM ('pending', 'accepted', 'cancelled', 'expired');

ALTER TABLE "User"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE TABLE "StaffInvitation" (
  "id" VARCHAR(100) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "role" "UserRole" NOT NULL,
  "status" "StaffInvitationStatus" NOT NULL DEFAULT 'pending',
  "tokenHash" CHAR(64) NOT NULL,
  "invitedById" TEXT NOT NULL,
  "acceptedById" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffInvitation_tokenHash_key" ON "StaffInvitation"("tokenHash");
CREATE INDEX "StaffInvitation_status_expiresAt_idx" ON "StaffInvitation"("status", "expiresAt");
CREATE INDEX "StaffInvitation_email_status_idx" ON "StaffInvitation"("email", "status");
CREATE INDEX "StaffInvitation_invitedById_createdAt_idx" ON "StaffInvitation"("invitedById", "createdAt");

ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
