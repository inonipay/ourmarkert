import "server-only";

import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { checkRedisHealth } from "@/lib/rate-limit";

export async function getSuperAdminSystemHealth() {
  await requireSuperAdminPageUser("/super-admin/monitoring/system-health");

  const checkedAt = new Date();
  const startedAt = performance.now();
  const databaseCheck = (async () => {
    try {
      const rows = await prisma.$queryRaw<{ serverTime: Date }[]>`
        SELECT CURRENT_TIMESTAMP AS "serverTime"
      `;
      if (!rows[0]) throw new Error("Database health check returned no result");
      return {
        status: "connected" as const,
        latency: Math.round(performance.now() - startedAt),
        serverTime: rows[0].serverTime,
      };
    } catch (error) {
      console.error("PostgreSQL health check failed", error);
      return { status: "unavailable" as const, latency: null, serverTime: null };
    }
  })();
  const [database, redis] = await Promise.all([
    databaseCheck,
    checkRedisHealth(),
  ]);

  return { checkedAt, database, redis };
}
