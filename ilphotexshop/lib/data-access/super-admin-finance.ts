import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import type { AnalyticsDateRange } from "@/lib/validation/super-admin-analytics";

export async function getSuperAdminFinancialOverview(
  range: AnalyticsDateRange,
  path = "/super-admin/finance",
) {
  await requireSuperAdminPageUser(path);
  const [orders, paymentProofs] = await prisma.$transaction([
    prisma.$queryRaw<
      { currency: string; status: string; count: number; subtotal: string }[]
    >(Prisma.sql`
      SELECT
        "currency",
        "status"::text AS "status",
        COUNT(*)::int AS "count",
        COALESCE(SUM("subtotal"), 0)::text AS "subtotal"
      FROM "Order"
      WHERE "createdAt" >= ${range.start} AND "createdAt" < ${range.endExclusive}
      GROUP BY "currency", "status"
      ORDER BY "currency" ASC, "status" ASC
    `),
    prisma.$queryRaw<
      { currency: string; status: string; count: number; amount: string }[]
    >(Prisma.sql`
      SELECT
        "currency",
        "status"::text AS "status",
        COUNT(*)::int AS "count",
        COALESCE(SUM("amount"), 0)::text AS "amount"
      FROM "OrderPaymentProof"
      WHERE "createdAt" >= ${range.start} AND "createdAt" < ${range.endExclusive}
      GROUP BY "currency", "status"
      ORDER BY "currency" ASC, "status" ASC
    `),
  ]);

  return {
    orders: orders.map((entry) => ({
      currency: entry.currency.trim(),
      status: entry.status,
      count: entry.count,
      subtotal: entry.subtotal,
    })),
    paymentProofs: paymentProofs.map((entry) => ({
      currency: entry.currency.trim(),
      status: entry.status,
      count: entry.count,
      amount: entry.amount,
    })),
  };
}
