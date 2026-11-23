import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type UserRole } from "@prisma/client";
import {
  AuthorizationDeniedError,
  requireSuperAdminPageUser,
} from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import type { AssignableUserRole } from "@/lib/validation/users";

export class SelfRoleChangeError extends Error {
  constructor() {
    super("You cannot change your own role");
    this.name = "SelfRoleChangeError";
  }
}

export class ProtectedSuperAdminRoleError extends Error {
  constructor() {
    super("Super admin roles can only be changed through local recovery");
    this.name = "ProtectedSuperAdminRoleError";
  }
}

export class UnavailableUserRoleChangeError extends Error {
  constructor() {
    super("Suspended or anonymized accounts cannot change roles");
    this.name = "UnavailableUserRoleChangeError";
  }
}

export class ConcurrentRoleChangeError extends Error {
  constructor() {
    super("This account role changed; reload and try again");
    this.name = "ConcurrentRoleChangeError";
  }
}

export type SuperAdminRoleAuditRow = {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetId: string;
  targetName: string;
  targetEmail: string;
  previousRole: UserRole;
  newRole: UserRole;
  createdAt: Date;
};

export async function updateUserRoleAsSuperAdmin(
  actorId: string,
  targetId: string,
  role: AssignableUserRole,
) {
  return prisma.$transaction(async (transaction) => {
    const actor = await transaction.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });
    if (!actor || actor.role !== "super_admin") {
      throw new AuthorizationDeniedError();
    }
    if (actorId === targetId) throw new SelfRoleChangeError();

    const targetRows = await transaction.$queryRaw<
      { id: string; role: UserRole; isSuspended: boolean; isAnonymized: boolean }[]
    >(
      Prisma.sql`
        SELECT "id", "role", "isSuspended", "isAnonymized"
        FROM "User"
        WHERE "id" = ${targetId}
        FOR UPDATE
      `,
    );
    const target = targetRows[0];
    if (!target) return null;
    if (target.role === "super_admin") {
      throw new ProtectedSuperAdminRoleError();
    }
    if (target.isSuspended || target.isAnonymized) {
      throw new UnavailableUserRoleChangeError();
    }
    if (target.role === role) {
      return { id: target.id, role: target.role, changed: false };
    }

    const updated = await transaction.user.updateMany({
      where: { id: target.id, role: target.role },
      data: { role },
    });
    if (updated.count !== 1) throw new ConcurrentRoleChangeError();

    await transaction.$executeRaw(
      Prisma.sql`
        INSERT INTO "UserRoleAudit"
          ("id", "actorId", "targetId", "previousRole", "newRole")
        VALUES (
          ${randomUUID()},
          ${actorId},
          ${target.id},
          ${target.role}::"UserRole",
          ${role}::"UserRole"
        )
      `,
    );

    return { id: target.id, role, changed: true };
  });
}

export async function getSuperAdminRoleAuditLogs() {
  await requireSuperAdminPageUser("/super-admin/security");
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 30);

  const [total, recent, rows] = await prisma.$transaction([
    prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM "UserRoleAudit"`,
    ),
    prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "UserRoleAudit"
        WHERE "createdAt" >= ${start}
      `,
    ),
    prisma.$queryRaw<SuperAdminRoleAuditRow[]>(
      Prisma.sql`
        SELECT
          log."id",
          log."actorId",
          actor."name" AS "actorName",
          actor."email" AS "actorEmail",
          log."targetId",
          target."name" AS "targetName",
          target."email" AS "targetEmail",
          log."previousRole",
          log."newRole",
          log."createdAt"
        FROM "UserRoleAudit" log
        INNER JOIN "User" actor ON actor."id" = log."actorId"
        INNER JOIN "User" target ON target."id" = log."targetId"
        ORDER BY log."createdAt" DESC
        LIMIT 100
      `,
    ),
  ]);

  return {
    total: total[0]?.count ?? 0,
    recent: recent[0]?.count ?? 0,
    rows,
  };
}

export async function getSuperAdminRoleAuditDetail(id: string) {
  await requireSuperAdminPageUser(`/super-admin/security/audit/${id}`);
  const rows = await prisma.$queryRaw<SuperAdminRoleAuditRow[]>(
    Prisma.sql`
      SELECT
        log."id",
        log."actorId",
        actor."name" AS "actorName",
        actor."email" AS "actorEmail",
        log."targetId",
        target."name" AS "targetName",
        target."email" AS "targetEmail",
        log."previousRole",
        log."newRole",
        log."createdAt"
      FROM "UserRoleAudit" log
      INNER JOIN "User" actor ON actor."id" = log."actorId"
      INNER JOIN "User" target ON target."id" = log."targetId"
      WHERE log."id" = ${id}
      LIMIT 1
    `,
  );
  return rows[0] ?? null;
}
