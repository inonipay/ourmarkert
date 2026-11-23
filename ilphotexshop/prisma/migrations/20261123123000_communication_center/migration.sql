CREATE TYPE "ConversationType" AS ENUM ('customer', 'merchant', 'staff');
CREATE TYPE "ConversationStatus" AS ENUM ('open', 'closed');
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE "SupportTicketPriority" AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE "CommunicationCampaignStatus" AS ENUM ('draft', 'scheduled', 'sent', 'cancelled');

CREATE TABLE "CommunicationConversation" (
  "id" VARCHAR(100) NOT NULL,
  "subject" VARCHAR(200) NOT NULL,
  "type" "ConversationType" NOT NULL,
  "status" "ConversationStatus" NOT NULL DEFAULT 'open',
  "participantIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunicationConversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommunicationConversation_type_status_createdAt_idx"
  ON "CommunicationConversation"("type", "status", "createdAt");
CREATE INDEX "CommunicationConversation_lastMessageAt_idx"
  ON "CommunicationConversation"("lastMessageAt");

CREATE TABLE "CommunicationMessage" (
  "id" VARCHAR(100) NOT NULL,
  "conversationId" VARCHAR(100) NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" VARCHAR(4000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommunicationMessage_conversationId_createdAt_idx"
  ON "CommunicationMessage"("conversationId", "createdAt");
CREATE INDEX "CommunicationMessage_senderId_createdAt_idx"
  ON "CommunicationMessage"("senderId", "createdAt");
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SupportTicket" (
  "id" VARCHAR(100) NOT NULL,
  "subject" VARCHAR(200) NOT NULL,
  "description" VARCHAR(4000) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "requesterId" TEXT NOT NULL,
  "assignedToId" TEXT,
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'normal',
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportTicket_status_priority_createdAt_idx"
  ON "SupportTicket"("status", "priority", "createdAt");
CREATE INDEX "SupportTicket_requesterId_createdAt_idx"
  ON "SupportTicket"("requesterId", "createdAt");
CREATE INDEX "SupportTicket_assignedToId_status_idx"
  ON "SupportTicket"("assignedToId", "status");

CREATE TABLE "SupportTicketMessage" (
  "id" VARCHAR(100) NOT NULL,
  "ticketId" VARCHAR(100) NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" VARCHAR(4000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportTicketMessage_ticketId_createdAt_idx"
  ON "SupportTicketMessage"("ticketId", "createdAt");
CREATE INDEX "SupportTicketMessage_senderId_createdAt_idx"
  ON "SupportTicketMessage"("senderId", "createdAt");
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailCampaign" (
  "id" VARCHAR(100) NOT NULL,
  "subject" VARCHAR(200) NOT NULL,
  "content" VARCHAR(4000) NOT NULL,
  "audience" "AnnouncementAudience" NOT NULL,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "status" "CommunicationCampaignStatus" NOT NULL DEFAULT 'draft',
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailCampaign_status_scheduledAt_idx"
  ON "EmailCampaign"("status", "scheduledAt");
CREATE INDEX "EmailCampaign_createdAt_idx" ON "EmailCampaign"("createdAt");

CREATE TABLE "SmsCampaign" (
  "id" VARCHAR(100) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "message" VARCHAR(1600) NOT NULL,
  "audience" "AnnouncementAudience" NOT NULL,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "status" "CommunicationCampaignStatus" NOT NULL DEFAULT 'draft',
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmsCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmsCampaign_status_scheduledAt_idx"
  ON "SmsCampaign"("status", "scheduledAt");
CREATE INDEX "SmsCampaign_createdAt_idx" ON "SmsCampaign"("createdAt");
