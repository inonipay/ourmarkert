CREATE TYPE "AnnouncementAudience" AS ENUM (
    'all_users',
    'merchants',
    'customers',
    'admins',
    'specific_users'
);

CREATE TYPE "AnnouncementPriority" AS ENUM (
    'urgent',
    'high',
    'normal',
    'low'
);

CREATE TABLE "Announcement" (
    "id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "message" VARCHAR(4000) NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'normal',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "cancelledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnnouncementRecipient" (
    "announcementId" VARCHAR(100) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRecipient_pkey" PRIMARY KEY ("announcementId", "userId")
);

CREATE TABLE "AnnouncementDismissal" (
    "announcementId" VARCHAR(100) NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementDismissal_pkey" PRIMARY KEY ("announcementId", "userId")
);

CREATE INDEX "Announcement_startsAt_endsAt_cancelledAt_idx"
ON "Announcement"("startsAt", "endsAt", "cancelledAt");
CREATE INDEX "Announcement_audience_startsAt_endsAt_idx"
ON "Announcement"("audience", "startsAt", "endsAt");
CREATE INDEX "Announcement_createdAt_idx"
ON "Announcement"("createdAt");
CREATE INDEX "AnnouncementRecipient_userId_idx"
ON "AnnouncementRecipient"("userId");
CREATE INDEX "AnnouncementDismissal_userId_dismissedAt_idx"
ON "AnnouncementDismissal"("userId", "dismissedAt");

ALTER TABLE "Announcement"
ADD CONSTRAINT "Announcement_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Announcement"
ADD CONSTRAINT "Announcement_cancelledById_fkey"
FOREIGN KEY ("cancelledById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnnouncementRecipient"
ADD CONSTRAINT "AnnouncementRecipient_announcementId_fkey"
FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnnouncementRecipient"
ADD CONSTRAINT "AnnouncementRecipient_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnnouncementDismissal"
ADD CONSTRAINT "AnnouncementDismissal_announcementId_fkey"
FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnnouncementDismissal"
ADD CONSTRAINT "AnnouncementDismissal_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
