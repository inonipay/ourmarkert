import "server-only";

import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function getSuperAdminDatabaseMonitoring() {
  await requireSuperAdminPageUser("/super-admin/monitoring/database-monitoring");
  const checkedAt = new Date();
  const startedAt = performance.now();

  try {
    const metadataRows = await prisma.$queryRaw<
      { serverTime: Date; serverVersion: string; databaseSizeBytes: bigint }[]
    >`
      SELECT
        CURRENT_TIMESTAMP AS "serverTime",
        current_setting('server_version') AS "serverVersion",
        pg_database_size(current_database()) AS "databaseSizeBytes"
    `;
    if (!metadataRows[0]) {
      throw new Error("Database monitoring query returned no result");
    }
    const latencyMs = Math.round(performance.now() - startedAt);

    const [users, products, orders, paymentProofs] = await prisma.$transaction([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.orderPaymentProof.count(),
    ]);

    return {
      status: "connected" as const,
      checkedAt,
      serverTime: metadataRows[0].serverTime,
      serverVersion: metadataRows[0].serverVersion,
      databaseSizeBytes: metadataRows[0].databaseSizeBytes.toString(),
      latencyMs,
      recordCounts: { users, products, orders, paymentProofs },
    };
  } catch (error) {
    console.error("Super admin database monitoring query failed", error);
    return {
      status: "unavailable" as const,
      checkedAt,
      serverTime: null,
      serverVersion: null,
      databaseSizeBytes: null,
      latencyMs: null,
      recordCounts: null,
    };
  }
}
