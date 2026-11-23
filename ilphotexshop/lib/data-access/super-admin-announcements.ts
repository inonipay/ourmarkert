import "server-only";

import {
  AnnouncementAudience,
  AnnouncementPriority,
  Prisma,
  UserRole,
} from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import type { CreateAnnouncementInput } from "@/lib/validation/announcements";

export class AnnouncementRecipientsNotFoundError extends Error {
  constructor() {
    super("One or more selected recipients cannot receive announcements");
    this.name = "AnnouncementRecipientsNotFoundError";
  }
}

export type SuperAdminAnnouncementItem = {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  startsAt: Date;
  endsAt: Date;
  cancelledAt: Date | null;
  createdAt: Date;
  createdByName: string;
  recipientCount: number;
  dismissalCount: number;
  status: "live" | "scheduled" | "expired" | "cancelled";
};

export async function getSuperAdminAnnouncements(): Promise<
  SuperAdminAnnouncementItem[]
> {
  return getSuperAdminAnnouncementHistory(
    "/super-admin/communication/announcements",
  );
}

export async function getSuperAdminAnnouncementHistory(
  path: string,
): Promise<SuperAdminAnnouncementItem[]> {
  await requireSuperAdminPageUser(
    path,
  );
  const announcements = await prisma.announcement.findMany({
    select: {
      id: true,
      title: true,
      message: true,
      audience: true,
      priority: true,
      startsAt: true,
      endsAt: true,
      cancelledAt: true,
      createdAt: true,
      createdBy: { select: { name: true } },
      _count: { select: { recipients: true, dismissals: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const now = new Date();
  return announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    audience: announcement.audience,
    priority: announcement.priority,
    startsAt: announcement.startsAt,
    endsAt: announcement.endsAt,
    cancelledAt: announcement.cancelledAt,
    createdAt: announcement.createdAt,
    createdByName: announcement.createdBy.name,
    recipientCount: announcement._count.recipients,
    dismissalCount: announcement._count.dismissals,
    status: announcement.cancelledAt
      ? "cancelled"
      : announcement.endsAt <= now
        ? "expired"
        : announcement.startsAt > now
          ? "scheduled"
          : "live",
  }));
}

export async function createSuperAdminAnnouncement(
  actorId: string,
  input: CreateAnnouncementInput,
) {
  return prisma.$transaction(async (transaction) => {
    const recipients =
      input.audience === AnnouncementAudience.specific_users
        ? await transaction.user.findMany({
            where: {
              email: {
                in: input.recipientEmails,
                mode: "insensitive",
              },
              isSuspended: false,
              isAnonymized: false,
            },
            select: { id: true, email: true },
          })
        : [];
    if (
      input.audience === AnnouncementAudience.specific_users &&
      (recipients.length !== input.recipientEmails.length ||
        new Set(recipients.map((recipient) => recipient.email.toLowerCase()))
          .size !== input.recipientEmails.length)
    ) {
      throw new AnnouncementRecipientsNotFoundError();
    }

    return transaction.announcement.create({
      data: {
        title: input.title,
        message: input.message,
        audience: input.audience,
        priority: input.priority,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        createdById: actorId,
        ...(input.audience === AnnouncementAudience.specific_users
          ? {
              recipients: {
                create: recipients.map((recipient) => ({
                  userId: recipient.id,
                })),
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        audience: true,
        priority: true,
        startsAt: true,
        endsAt: true,
      },
    });
  });
}

export async function cancelSuperAdminAnnouncement(
  actorId: string,
  id: string,
) {
  const now = new Date();
  const result = await prisma.announcement.updateMany({
    where: {
      id,
      cancelledAt: null,
      endsAt: { gt: now },
    },
    data: {
      cancelledAt: now,
      cancelledById: actorId,
    },
  });
  return result.count > 0;
}

function getUserAudienceFilter(userId: string, role: UserRole) {
  const audiences: Prisma.AnnouncementWhereInput[] = [
    { audience: AnnouncementAudience.all_users },
    {
      audience: AnnouncementAudience.specific_users,
      recipients: { some: { userId } },
    },
  ];
  if (role === UserRole.seller) {
    audiences.push({ audience: AnnouncementAudience.merchants });
  } else if (role === UserRole.customer) {
    audiences.push({ audience: AnnouncementAudience.customers });
  } else if (role === UserRole.admin || role === UserRole.super_admin) {
    audiences.push({ audience: AnnouncementAudience.admins });
  }
  return audiences;
}

export async function getActiveAnnouncementsForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isSuspended: true, isAnonymized: true },
  });
  if (!user || user.isSuspended || user.isAnonymized) return [];

  const now = new Date();
  return prisma.announcement.findMany({
    where: {
      cancelledAt: null,
      startsAt: { lte: now },
      endsAt: { gt: now },
      OR: getUserAudienceFilter(userId, user.role),
      dismissals: { none: { userId } },
    },
    select: {
      id: true,
      title: true,
      message: true,
      priority: true,
      endsAt: true,
    },
    orderBy: [{ priority: "asc" }, { startsAt: "desc" }],
    take: 5,
  });
}

export async function dismissAnnouncementForUser(
  userId: string,
  id: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isSuspended: true, isAnonymized: true },
  });
  if (!user || user.isSuspended || user.isAnonymized) return false;

  const now = new Date();
  const announcement = await prisma.announcement.findFirst({
    where: {
      id,
      cancelledAt: null,
      startsAt: { lte: now },
      endsAt: { gt: now },
      OR: getUserAudienceFilter(userId, user.role),
    },
    select: { id: true },
  });
  if (!announcement) return false;

  await prisma.announcementDismissal.upsert({
    where: { announcementId_userId: { announcementId: id, userId } },
    create: { announcementId: id, userId },
    update: { dismissedAt: now },
  });
  return true;
}
