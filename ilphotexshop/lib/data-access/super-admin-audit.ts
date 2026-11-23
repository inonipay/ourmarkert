import "server-only";

import { Prisma } from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export type SuperAdminAuditRow = {
  id: string;
  source: "role" | "merchant" | "kyc";
  module: string;
  actorName: string;
  actorEmail: string;
  subject: string;
  action: string;
  detail: string;
  reason: string | null;
  createdAt: Date;
};

export type SuperAdminAuditSource = SuperAdminAuditRow["source"];

export async function getSuperAdminAuditLog(
  search: string,
  source?: SuperAdminAuditSource,
) {
  await requireSuperAdminPageUser("/super-admin/security/audit-logs");

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 30);
  const searchPattern = search ? `%${search}%` : null;
  const eventFilter = Prisma.sql`
    WHERE (${source ?? null}::text IS NULL OR "source" = ${source ?? null})
      AND (
        ${searchPattern}::text IS NULL
        OR "actorName" ILIKE ${searchPattern}
        OR "actorEmail" ILIKE ${searchPattern}
        OR "subject" ILIKE ${searchPattern}
        OR "action" ILIKE ${searchPattern}
        OR "reason" ILIKE ${searchPattern}
      )
  `;
  const eventRows = Prisma.sql`
    SELECT
      log."id",
      'role'::text AS "source",
      'User roles'::text AS "module",
      actor."name" AS "actorName",
      actor."email" AS "actorEmail",
      target."name" || ' · ' || target."email" AS "subject",
      'Role change'::text AS "action",
      log."previousRole"::text || ' -> ' || log."newRole"::text AS "detail",
      NULL::text AS "reason",
      log."createdAt"
    FROM "UserRoleAudit" log
    INNER JOIN "User" actor ON actor."id" = log."actorId"
    INNER JOIN "User" target ON target."id" = log."targetId"

    UNION ALL

    SELECT
      log."id",
      'merchant'::text AS "source",
      'Merchant access'::text AS "module",
      actor."name" AS "actorName",
      actor."email" AS "actorEmail",
      target."name" || ' · ' || target."email" AS "subject",
      log."action"::text AS "action",
      'Merchant account access'::text AS "detail",
      log."reason",
      log."createdAt"
    FROM "MerchantAccessAudit" log
    INNER JOIN "User" actor ON actor."id" = log."actorId"
    INNER JOIN "User" target ON target."id" = log."targetId"

    UNION ALL

    SELECT
      log."id",
      'kyc'::text AS "source",
      'Merchant KYC'::text AS "module",
      actor."name" AS "actorName",
      actor."email" AS "actorEmail",
      'Application ' || log."applicationId" AS "subject",
      log."action"::text AS "action",
      'KYC decision'::text AS "detail",
      log."reason",
      log."createdAt"
    FROM "MerchantKycAudit" log
    INNER JOIN "User" actor ON actor."id" = log."actorId"
  `;

  const [counts, filteredCountRows, rows] = await prisma.$transaction([
    prisma.$queryRaw<
      {
        roleChanges: number;
        recentRoleChanges: number;
        merchantAccess: number;
        recentMerchantAccess: number;
        kycDecisions: number;
        recentKycDecisions: number;
      }[]
    >(
      Prisma.sql`
        SELECT
          (SELECT COUNT(*)::int FROM "UserRoleAudit") AS "roleChanges",
          (SELECT COUNT(*)::int FROM "UserRoleAudit"
            WHERE "createdAt" >= ${start}) AS "recentRoleChanges",
          (SELECT COUNT(*)::int FROM "MerchantAccessAudit") AS "merchantAccess",
          (SELECT COUNT(*)::int FROM "MerchantAccessAudit"
            WHERE "createdAt" >= ${start}) AS "recentMerchantAccess",
          (SELECT COUNT(*)::int FROM "MerchantKycAudit") AS "kycDecisions",
          (SELECT COUNT(*)::int FROM "MerchantKycAudit"
            WHERE "createdAt" >= ${start}) AS "recentKycDecisions"
      `,
    ),
    prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`
        WITH audit_events AS (${eventRows})
        SELECT COUNT(*)::int AS count
        FROM audit_events
        ${eventFilter}
      `,
    ),
    prisma.$queryRaw<SuperAdminAuditRow[]>(
      Prisma.sql`
        WITH audit_events AS (${eventRows})
        SELECT *
        FROM audit_events
        ${eventFilter}
        ORDER BY "createdAt" DESC
        LIMIT 200
      `,
    ),
  ]);
  const totals = counts[0];
  const roleChanges = totals?.roleChanges ?? 0;
  const merchantAccess = totals?.merchantAccess ?? 0;
  const kycDecisions = totals?.kycDecisions ?? 0;

  return {
    total: roleChanges + merchantAccess + kycDecisions,
    recent:
      (totals?.recentRoleChanges ?? 0) +
      (totals?.recentMerchantAccess ?? 0) +
      (totals?.recentKycDecisions ?? 0),
    filteredTotal: filteredCountRows[0]?.count ?? 0,
    roleChanges,
    merchantAccess,
    kycDecisions,
    rows,
  };
}
