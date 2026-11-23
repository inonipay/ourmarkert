import "server-only";

import {
  AnnouncementAudience,
  CommunicationCampaignStatus,
  ConversationStatus,
  ConversationType,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function getCommunicationConversations(
  type?: ConversationType,
  query = "",
) {
  await requireSuperAdminPageUser("/super-admin/communication");
  const rows = await prisma.communicationConversation.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(query
        ? { subject: { contains: query, mode: "insensitive" } }
        : {}),
    },
    include: { _count: { select: { messages: true } } },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  const ids = [...new Set(rows.flatMap((row) => row.participantIds))];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true, role: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));
  return rows.map((row) => ({
    ...row,
    participants: row.participantIds
      .map((id) => userMap.get(id))
      .filter((user): user is (typeof users)[number] => Boolean(user)),
  }));
}

export async function getSupportTickets(query = "") {
  await requireSuperAdminPageUser("/super-admin/communication/support-tickets");
  const rows = await prisma.supportTicket.findMany({
    where: query
      ? {
          OR: [
            { subject: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {},
    include: { _count: { select: { messages: true } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  const ids = [
    ...new Set(
      rows.flatMap((row) =>
        [row.requesterId, row.assignedToId].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    ),
  ];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));
  return rows.map((row) => ({
    ...row,
    requester: row.requesterId
      ? userMap.get(row.requesterId) ?? null
      : null,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    assignee: row.assignedToId ? userMap.get(row.assignedToId) ?? null : null,
  }));
}

export async function getSupportTicketDetails(ticketId: string) {
  await requireSuperAdminPageUser("/super-admin/communication/support-tickets");
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
      },
    },
  });
  if (!ticket) return null;
  const ids = [
    ...new Set([
      ticket.requesterId,
      ticket.assignedToId,
      ...ticket.messages.map((message) => message.senderId),
    ].filter((id): id is string => Boolean(id))),
  ];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));
  return {
    ...ticket,
    requester: ticket.requesterId
      ? userMap.get(ticket.requesterId) ?? null
      : null,
    assignee: ticket.assignedToId
      ? userMap.get(ticket.assignedToId) ?? null
      : null,
    messages: ticket.messages.map((message) => ({
      ...message,
      sender: userMap.get(message.senderId) ?? null,
    })),
  };
}

export async function addSupportTicketMessage(
  ticketId: string,
  senderId: string,
  body: string,
) {
  await requireSuperAdminPageUser("/super-admin/communication/support-tickets");
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });
  if (!ticket || ticket.status === "closed") return null;
  return prisma.supportTicketMessage.create({
    data: { ticketId, senderId, body },
  });
}

export async function createSupportTicket(
  requesterId: string,
  input: {
    subject: string;
    description: string;
    category: string;
    priority: SupportTicketPriority;
  },
) {
  return prisma.supportTicket.create({
    data: { ...input, requesterId },
  });
}

export async function createPublicSupportTicket(
  requesterId: string | null,
  input: {
    name: string;
    email?: string;
    phone?: string;
    category: string;
    subject: string;
    message: string;
  },
) {
  return prisma.supportTicket.create({
    data: {
      subject: input.subject,
      description: input.message,
      category: input.category,
      priority: "normal",
      requesterId,
      guestName: input.name,
      guestEmail: input.email || null,
      guestPhone: input.phone || null,
    },
  });
}

export async function createCommunicationConversation(
  senderId: string,
  input: {
    subject: string;
    type: ConversationType;
    participantIds: string[];
  },
) {
  const participantIds = [...new Set([senderId, ...input.participantIds])];
  return prisma.communicationConversation.create({
    data: {
      subject: input.subject,
      type: input.type,
      participantIds,
      lastMessageAt: new Date(),
      messages: {
        create: {
          senderId,
          body: input.subject,
        },
      },
    },
  });
}

export async function addConversationMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  const conversation = await prisma.communicationConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation || conversation.status === ConversationStatus.closed) {
    return null;
  }
  const now = new Date();
  return prisma.$transaction(async (transaction) => {
    await transaction.communicationMessage.create({
      data: { conversationId, senderId, body },
    });
    await transaction.communicationConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });
  });
}

export async function getConversationDetails(conversationId: string) {
  await requireSuperAdminPageUser("/super-admin/communication");
  const conversation = await prisma.communicationConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
      },
    },
  });
  if (!conversation) return null;
  const senderIds = [
    ...new Set(conversation.messages.map((message) => message.senderId)),
  ];
  const senders = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, name: true, email: true },
  });
  const senderMap = new Map(senders.map((sender) => [sender.id, sender]));
  return {
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      sender: senderMap.get(message.senderId) ?? null,
    })),
  };
}

export async function closeCommunicationConversation(
  conversationId: string,
) {
  await requireSuperAdminPageUser("/super-admin/communication");
  const result = await prisma.communicationConversation.updateMany({
    where: { id: conversationId, status: ConversationStatus.open },
    data: { status: ConversationStatus.closed },
  });
  return result.count === 1;
}

export async function reopenCommunicationConversation(
  conversationId: string,
) {
  await requireSuperAdminPageUser("/super-admin/communication");
  const result = await prisma.communicationConversation.updateMany({
    where: { id: conversationId, status: ConversationStatus.closed },
    data: { status: ConversationStatus.open },
  });
  return result.count === 1;
}

export async function updateSupportTicket(
  id: string,
  input: {
    status: SupportTicketStatus;
    assignedToId?: string;
  },
) {
  const now = new Date();
  const result = await prisma.supportTicket.updateMany({
    where: { id },
    data: {
      status: input.status,
      assignedToId: input.assignedToId,
      resolvedAt:
        input.status === "resolved" || input.status === "closed" ? now : null,
      closedAt: input.status === "closed" ? now : null,
    },
  });
  return result.count === 1;
}

export async function getCommunicationCampaigns() {
  await requireSuperAdminPageUser("/super-admin/communication");
  const [email, sms] = await prisma.$transaction([
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.smsCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return { email, sms };
}

export async function createEmailCampaign(
  createdById: string,
  input: {
    subject: string;
    content: string;
    audience: AnnouncementAudience;
    scheduledAt?: string;
  },
) {
  const status = input.scheduledAt
    ? CommunicationCampaignStatus.scheduled
    : CommunicationCampaignStatus.draft;
  const recipientCount = await getCommunicationAudienceCount(input.audience);
  return prisma.emailCampaign.create({
    data: {
      subject: input.subject,
      content: input.content,
      audience: input.audience,
      recipientCount,
      status,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      createdById,
    },
  });
}

export async function createSmsCampaign(
  createdById: string,
  input: {
    name: string;
    message: string;
    audience: AnnouncementAudience;
    scheduledAt?: string;
  },
) {
  const status = input.scheduledAt
    ? CommunicationCampaignStatus.scheduled
    : CommunicationCampaignStatus.draft;
  const recipientCount = await getCommunicationAudienceCount(input.audience);
  return prisma.smsCampaign.create({
    data: {
      name: input.name,
      message: input.message,
      audience: input.audience,
      recipientCount,
      status,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      createdById,
    },
  });
}

export async function cancelEmailCampaign(id: string) {
  await requireSuperAdminPageUser("/super-admin/communication/email-campaigns");
  const result = await prisma.emailCampaign.updateMany({
    where: { id, status: { in: ["draft", "scheduled"] } },
    data: {
      status: CommunicationCampaignStatus.cancelled,
      cancelledAt: new Date(),
    },
  });
  return result.count === 1;
}

export async function cancelSmsCampaign(id: string) {
  await requireSuperAdminPageUser("/super-admin/communication/sms-campaigns");
  const result = await prisma.smsCampaign.updateMany({
    where: { id, status: { in: ["draft", "scheduled"] } },
    data: {
      status: CommunicationCampaignStatus.cancelled,
      cancelledAt: new Date(),
    },
  });
  return result.count === 1;
}

export async function getCommunicationAudienceCount(
  audience: AnnouncementAudience,
) {
  switch (audience) {
    case AnnouncementAudience.merchants:
      return prisma.user.count({
        where: { role: "seller", isSuspended: false, isAnonymized: false },
      });
    case AnnouncementAudience.customers:
      return prisma.user.count({
        where: { role: "customer", isSuspended: false, isAnonymized: false },
      });
    case AnnouncementAudience.admins:
      return prisma.user.count({
        where: {
          role: { in: ["admin", "super_admin"] },
          isSuspended: false,
          isAnonymized: false,
        },
      });
    case AnnouncementAudience.all_users:
      return prisma.user.count({
        where: { isSuspended: false, isAnonymized: false },
      });
    default:
      return 0;
  }
}
