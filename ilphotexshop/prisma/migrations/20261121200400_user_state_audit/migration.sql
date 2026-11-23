CREATE TYPE "UserStateAuditAction" AS ENUM ('activated', 'deactivated', 'archived', 'restored');

CREATE TABLE "UserStateAudit" (
  "id" VARCHAR(100) NOT NULL,
  "actorId" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "action" "UserStateAuditAction" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserStateAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserStateAudit_actorId_createdAt_idx" ON "UserStateAudit"("actorId", "createdAt");
CREATE INDEX "UserStateAudit_targetId_createdAt_idx" ON "UserStateAudit"("targetId", "createdAt");
CREATE INDEX "UserStateAudit_action_createdAt_idx" ON "UserStateAudit"("action", "createdAt");

ALTER TABLE "UserStateAudit"
  ADD CONSTRAINT "UserStateAudit_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserStateAudit"
  ADD CONSTRAINT "UserStateAudit_targetId_fkey"
  FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
