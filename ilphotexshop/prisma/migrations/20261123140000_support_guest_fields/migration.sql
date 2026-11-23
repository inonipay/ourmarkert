ALTER TABLE "SupportTicket"
  ALTER COLUMN "requesterId" DROP NOT NULL,
  ADD COLUMN "guestName" VARCHAR(100),
  ADD COLUMN "guestEmail" VARCHAR(254),
  ADD COLUMN "guestPhone" VARCHAR(32);
