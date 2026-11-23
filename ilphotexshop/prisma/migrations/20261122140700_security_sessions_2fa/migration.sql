CREATE TYPE "LoginOutcome" AS ENUM ('success', 'failed', 'blocked');
CREATE TYPE "SecurityAlertStatus" AS ENUM ('open', 'investigating', 'resolved', 'dismissed');
CREATE TYPE "SecurityPolicyType" AS ENUM ('password', 'session', 'access');

ALTER TABLE "User"
  ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "twoFactorSecret" VARCHAR(64);

CREATE TABLE "LoginEvent" (
  "id" VARCHAR(100) NOT NULL,
  "userId" TEXT,
  "email" VARCHAR(254) NOT NULL,
  "outcome" "LoginOutcome" NOT NULL,
  "reason" VARCHAR(500),
  "ipAddress" VARCHAR(64) NOT NULL,
  "userAgent" VARCHAR(500),
  "deviceName" VARCHAR(160),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LoginEvent_userId_createdAt_idx" ON "LoginEvent"("userId", "createdAt");
CREATE INDEX "LoginEvent_email_createdAt_idx" ON "LoginEvent"("email", "createdAt");
CREATE INDEX "LoginEvent_outcome_createdAt_idx" ON "LoginEvent"("outcome", "createdAt");
CREATE INDEX "LoginEvent_ipAddress_createdAt_idx" ON "LoginEvent"("ipAddress", "createdAt");
ALTER TABLE "LoginEvent" ADD CONSTRAINT "LoginEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SecuritySession" (
  "id" VARCHAR(100) NOT NULL,
  "sessionToken" CHAR(64) NOT NULL,
  "userId" TEXT NOT NULL,
  "ipAddress" VARCHAR(64) NOT NULL,
  "userAgent" VARCHAR(500),
  "deviceName" VARCHAR(160),
  "isRevoked" BOOLEAN NOT NULL DEFAULT false,
  "revokedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecuritySession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SecuritySession_sessionToken_key" ON "SecuritySession"("sessionToken");
CREATE INDEX "SecuritySession_userId_isRevoked_expiresAt_idx" ON "SecuritySession"("userId", "isRevoked", "expiresAt");
CREATE INDEX "SecuritySession_expiresAt_idx" ON "SecuritySession"("expiresAt");
ALTER TABLE "SecuritySession" ADD CONSTRAINT "SecuritySession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SecurityDevice" (
  "id" VARCHAR(100) NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceHash" CHAR(64) NOT NULL,
  "deviceName" VARCHAR(160) NOT NULL,
  "lastIpAddress" VARCHAR(64) NOT NULL,
  "trusted" BOOLEAN NOT NULL DEFAULT false,
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecurityDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SecurityDevice_userId_deviceHash_key" ON "SecurityDevice"("userId", "deviceHash");
CREATE INDEX "SecurityDevice_userId_trusted_blocked_idx" ON "SecurityDevice"("userId", "trusted", "blocked");
ALTER TABLE "SecurityDevice" ADD CONSTRAINT "SecurityDevice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SecurityAlert" (
  "id" VARCHAR(100) NOT NULL,
  "userId" TEXT,
  "title" VARCHAR(160) NOT NULL,
  "description" VARCHAR(1000) NOT NULL,
  "ipAddress" VARCHAR(64),
  "status" "SecurityAlertStatus" NOT NULL DEFAULT 'open',
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SecurityAlert_status_createdAt_idx" ON "SecurityAlert"("status", "createdAt");
CREATE INDEX "SecurityAlert_userId_createdAt_idx" ON "SecurityAlert"("userId", "createdAt");
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SecurityPolicy" (
  "id" VARCHAR(100) NOT NULL,
  "type" "SecurityPolicyType" NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "value" VARCHAR(500) NOT NULL,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecurityPolicy_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SecurityPolicy_type_updatedAt_idx" ON "SecurityPolicy"("type", "updatedAt");
