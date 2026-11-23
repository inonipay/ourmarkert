import "server-only";

import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function getSuperAdminStorageUsage() {
  await requireSuperAdminPageUser("/super-admin/monitoring/storage-usage");
  const checkedAt = new Date();

  try {
    const [metadataRows, relations] = await prisma.$transaction([
      prisma.$queryRaw<
        { databaseBytes: bigint; publicTableCount: number }[]
      >`
        SELECT
          pg_database_size(current_database()) AS "databaseBytes",
          COUNT(*)::int AS "publicTableCount"
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
      `,
      prisma.$queryRaw<{ relationName: string; sizeBytes: bigint }[]>`
        SELECT
          tablename AS "relationName",
          pg_total_relation_size(
            format('%I.%I', schemaname, tablename)::regclass
          ) AS "sizeBytes"
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        ORDER BY "sizeBytes" DESC, tablename ASC
        LIMIT 20
      `,
    ]);
    const metadata = metadataRows[0];
    if (!metadata) throw new Error("Storage monitoring query returned no result");

    return {
      status: "available" as const,
      checkedAt,
      databaseBytes: metadata.databaseBytes.toString(),
      publicTableCount: metadata.publicTableCount,
      relations: relations.map((relation) => ({
        name: relation.relationName,
        sizeBytes: relation.sizeBytes.toString(),
      })),
    };
  } catch (error) {
    console.error("Super admin storage usage query failed", error);
    return {
      status: "unavailable" as const,
      checkedAt,
      databaseBytes: null,
      publicTableCount: null,
      relations: [],
    };
  }
}
