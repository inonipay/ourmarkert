CREATE TABLE "UserRoleAudit" (
    "id" VARCHAR(100) NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "previousRole" "UserRole" NOT NULL,
    "newRole" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserRoleAudit_actorId_createdAt_idx"
ON "UserRoleAudit"("actorId", "createdAt");

CREATE INDEX "UserRoleAudit_targetId_createdAt_idx"
ON "UserRoleAudit"("targetId", "createdAt");

ALTER TABLE "UserRoleAudit"
ADD CONSTRAINT "UserRoleAudit_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserRoleAudit"
ADD CONSTRAINT "UserRoleAudit_targetId_fkey"
FOREIGN KEY ("targetId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
