import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  AuthorizationDeniedError,
  requireSuperAdminPageUser,
} from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import type { merchantAccessActionSchema } from "@/lib/validation/users";
import type { z } from "zod";

type MerchantAccessAction = z.infer<typeof merchantAccessActionSchema>;

export class ConcurrentMerchantAccessChangeError extends Error {
  constructor() {
    super("This merchant's access changed; reload and try again");
    this.name = "ConcurrentMerchantAccessChangeError";
  }
}

export class AnonymizedMerchantAccessError extends Error {
  constructor() {
    super("An anonymized merchant account cannot be reactivated");
    this.name = "AnonymizedMerchantAccessError";
  }
}

export type MerchantAccessAuditRow = {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetId: string;
  targetName: string;
  targetEmail: string;
  action: "suspended" | "reactivated";
  reason: string | null;
  createdAt: Date;
};

export async function updateMerchantAccessAsSuperAdmin(
  actorId: string,
  merchantId: string,
  action: MerchantAccessAction,
) {
  return prisma.$transaction(async (transaction) => {
    const actor = await transaction.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });
    if (!actor || actor.role !== "super_admin") {
      throw new AuthorizationDeniedError();
    }

    const targetRows = await transaction.$queryRaw<
      { isSuspended: boolean; isAnonymized: boolean }[]
    >(
      Prisma.sql`
        SELECT "isSuspended", "isAnonymized"
        FROM "User"
        WHERE "id" = ${merchantId}
          AND "role" = 'seller'::"UserRole"
        FOR UPDATE
      `,
    );
    const target = targetRows[0];
    if (!target) return null;
    if (target.isAnonymized) throw new AnonymizedMerchantAccessError();

    const nextIsSuspended = action.action === "suspend";
    if (target.isSuspended === nextIsSuspended) {
      return { id: merchantId, isSuspended: target.isSuspended, changed: false };
    }

    const updated = await transaction.$executeRaw(
      Prisma.sql`
        UPDATE "User"
        SET "isSuspended" = ${nextIsSuspended}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${merchantId}
          AND "role" = 'seller'::"UserRole"
          AND "isSuspended" = ${target.isSuspended}
      `,
    );
    if (updated !== 1) throw new ConcurrentMerchantAccessChangeError();

    let unpublishedProductCount = 0;
    if (nextIsSuspended) {
      const unpublished = await transaction.product.updateMany({
        where: { ownerId: merchantId, isPublished: true },
        data: { isPublished: false },
      });
      unpublishedProductCount = unpublished.count;
    }

    await transaction.$executeRaw(
      Prisma.sql`
        INSERT INTO "MerchantAccessAudit"
          ("id", "actorId", "targetId", "action", "reason")
        VALUES (
          ${randomUUID()},
          ${actorId},
          ${merchantId},
          ${nextIsSuspended ? "suspended" : "reactivated"}::"MerchantAccessAction",
          ${action.reason ?? null}
        )
      `,
    );

    return {
      id: merchantId,
      isSuspended: nextIsSuspended,
      changed: true,
      unpublishedProductCount,
    };
  });
}

export async function getSuperAdminMerchantAccessAuditLogs() {
  await requireSuperAdminPageUser("/super-admin/security/merchant-access");
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 30);

  const [total, recent, rows] = await prisma.$transaction([
    prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM "MerchantAccessAudit"`,
    ),
    prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "MerchantAccessAudit"
        WHERE "createdAt" >= ${start}
      `,
    ),
    prisma.$queryRaw<MerchantAccessAuditRow[]>(
      Prisma.sql`
        SELECT
          log."id",
          log."actorId",
          actor."name" AS "actorName",
          actor."email" AS "actorEmail",
          log."targetId",
          target."name" AS "targetName",
          target."email" AS "targetEmail",
          log."action",
          log."reason",
          log."createdAt"
        FROM "MerchantAccessAudit" log
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

export async function getSuperAdminMerchantAccessAuditDetail(id: string) {
  await requireSuperAdminPageUser(
    `/super-admin/security/merchant-access/${id}`,
  );
  const rows = await prisma.$queryRaw<MerchantAccessAuditRow[]>(
    Prisma.sql`
      SELECT
        log."id",
        log."actorId",
        actor."name" AS "actorName",
        actor."email" AS "actorEmail",
        log."targetId",
        target."name" AS "targetName",
        target."email" AS "targetEmail",
        log."action",
        log."reason",
        log."createdAt"
      FROM "MerchantAccessAudit" log
      INNER JOIN "User" actor ON actor."id" = log."actorId"
      INNER JOIN "User" target ON target."id" = log."targetId"
      WHERE log."id" = ${id}
      LIMIT 1
    `,
  );
  return rows[0] ?? null;
}
