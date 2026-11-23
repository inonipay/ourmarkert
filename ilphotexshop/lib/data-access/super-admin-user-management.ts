import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma, StaffInvitationStatus, UserRole, UserStateAuditAction } from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const USER_MANAGEMENT_PAGE_SIZE = 20;

export type UserManagementView =
  | "staff-members"
  | "pending-invitations"
  | "inactive-users"
  | "archived-users";

export async function getSuperAdminUserManagement(
  view: UserManagementView,
  query: string,
  page: number,
) {
  await requireSuperAdminPageUser(`/super-admin/users/${view}`);
  const safePage = Math.max(1, Math.min(page, 500));
  const offset = (safePage - 1) * USER_MANAGEMENT_PAGE_SIZE;

  if (view === "pending-invitations") {
    const search = query
      ? {
          OR: [
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};
    await prisma.staffInvitation.updateMany({
      where: {
        status: StaffInvitationStatus.pending,
        expiresAt: { lt: new Date() },
      },
      data: { status: StaffInvitationStatus.expired },
    });
    const where = {
      status: StaffInvitationStatus.pending,
      ...search,
    } satisfies Prisma.StaffInvitationWhereInput;
    const [rows, total, pending, accepted, cancelled, expired] =
      await prisma.$transaction([
        prisma.staffInvitation.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            expiresAt: true,
            createdAt: true,
            invitedBy: { select: { name: true } },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: USER_MANAGEMENT_PAGE_SIZE,
          skip: offset,
        }),
        prisma.staffInvitation.count({ where }),
        prisma.staffInvitation.count({
          where: { status: StaffInvitationStatus.pending },
        }),
        prisma.staffInvitation.count({
          where: { status: StaffInvitationStatus.accepted },
        }),
        prisma.staffInvitation.count({
          where: { status: StaffInvitationStatus.cancelled },
        }),
        prisma.staffInvitation.count({
          where: { status: StaffInvitationStatus.expired },
        }),
      ]);
    return { rows, total, page: safePage, pageSize: USER_MANAGEMENT_PAGE_SIZE, summary: { pending, accepted, cancelled, expired } };
  }

  const search = query
    ? {
        OR: [
          { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};
  const where =
    view === "staff-members"
      ? { role: UserRole.admin, archivedAt: null, isAnonymized: false, ...search }
      : view === "inactive-users"
        ? { isActive: false, archivedAt: null, isAnonymized: false, ...search }
        : { OR: [{ archivedAt: { not: null } }, { isAnonymized: true }], ...search } satisfies Prisma.UserWhereInput;

  const [rows, total, staffCount, inactiveCount, archivedCount] =
    await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          archivedAt: true,
          lastLoginAt: true,
          isSuspended: true,
          isAnonymized: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: USER_MANAGEMENT_PAGE_SIZE,
        skip: offset,
      }),
      prisma.user.count({ where }),
      prisma.user.count({
        where: { role: UserRole.admin, archivedAt: null, isAnonymized: false },
      }),
      prisma.user.count({
        where: { isActive: false, archivedAt: null, isAnonymized: false },
      }),
      prisma.user.count({
        where: { OR: [{ archivedAt: { not: null } }, { isAnonymized: true }] },
      }),
    ]);

  return {
    rows,
    total,
    page: safePage,
    pageSize: USER_MANAGEMENT_PAGE_SIZE,
    summary: { staffCount, inactiveCount, archivedCount },
  };
}

export async function setUserManagementState(
  actorId: string,
  targetId: string,
  action: "activate" | "deactivate" | "archive" | "restore",
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { role: true },
  });
  if (!actor || actor.role !== "super_admin") return null;
  if (actorId === targetId) throw new Error("You cannot change your own account state");

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, isAnonymized: true, archivedAt: true },
  });
  if (!target) return null;
  if (target.role === "super_admin") throw new Error("Super admin account states cannot be changed here");
  if (target.isAnonymized && action !== "restore") throw new Error("Anonymized accounts cannot be restored or changed");

  const data =
    action === "activate"
      ? { isActive: true, archivedAt: null }
      : action === "deactivate"
        ? { isActive: false, archivedAt: null }
        : action === "archive"
          ? { isActive: false, archivedAt: new Date() }
          : { isActive: true, archivedAt: null };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetId },
      data,
    }),
    prisma.userStateAudit.create({
      data: {
        id: randomUUID(),
        actorId,
        targetId,
        action:
          action === "activate"
            ? UserStateAuditAction.activated
            : action === "deactivate"
              ? UserStateAuditAction.deactivated
              : action === "archive"
                ? UserStateAuditAction.archived
                : UserStateAuditAction.restored,
      },
    }),
  ]);
  return { id: targetId, action };
}

export async function createStaffInvitation(
  actorId: string,
  input: { name: string; email: string; role: "admin" },
) {
  await requireSuperAdminPageUser("/super-admin/users/pending-invitations");
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existingUser) throw new Error("A user account already exists with this email");

  const pending = await prisma.staffInvitation.findFirst({
    where: { email: input.email, status: StaffInvitationStatus.pending },
    select: { id: true },
  });
  if (pending) throw new Error("A pending invitation already exists for this email");

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await prisma.staffInvitation.create({
    data: {
      name: input.name,
      email: input.email,
      role: UserRole.admin,
      tokenHash,
      invitedById: actorId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return { invitation, token };
}

export async function cancelStaffInvitation(invitationId: string) {
  await requireSuperAdminPageUser("/super-admin/users/pending-invitations");
  const updated = await prisma.staffInvitation.updateMany({
    where: { id: invitationId, status: StaffInvitationStatus.pending },
    data: {
      status: StaffInvitationStatus.cancelled,
      cancelledAt: new Date(),
    },
  });
  return updated.count === 1;
}
