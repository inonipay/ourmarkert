import "server-only";

import { availableParallelism } from "node:os";
import { requireSuperAdminPageUser } from "@/lib/authorization";

export async function getSuperAdminServerPerformance() {
  await requireSuperAdminPageUser("/super-admin/monitoring/server-performance");
  return {
    checkedAt: new Date(),
    uptimeSeconds: process.uptime(),
    memory: process.memoryUsage(),
    cpuTime: process.cpuUsage(),
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      logicalCpuCount: availableParallelism(),
    },
  };
}
