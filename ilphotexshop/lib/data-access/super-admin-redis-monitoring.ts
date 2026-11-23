import "server-only";

import { requireSuperAdminPageUser } from "@/lib/authorization";
import { checkRedisHealth } from "@/lib/rate-limit";

export async function getSuperAdminRedisMonitoring() {
  await requireSuperAdminPageUser("/super-admin/monitoring/redis-monitoring");
  return {
    checkedAt: new Date(),
    ...(await checkRedisHealth()),
  };
}
