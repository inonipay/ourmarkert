import "server-only";

import { Prisma } from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const MERCHANT_LOCATION_PAGE_SIZE = 20;

export async function getSuperAdminMerchantLocations(
  search: string,
  requestedPage: number,
) {
  await requireSuperAdminPageUser("/super-admin/merchants/merchant-locations");
  const page = Math.max(1, Math.min(1000, requestedPage));
  const searchFilter = search
    ? Prisma.sql`
        WHERE (
          application."businessAddress" ILIKE ${`%${search}%`}
          OR application."businessName" ILIKE ${`%${search}%`}
          OR application."ownerFullName" ILIKE ${`%${search}%`}
          OR applicant."email" ILIKE ${`%${search}%`}
        )
      `
    : Prisma.empty;

  const [summaryRows, locations] = await prisma.$transaction([
    prisma.$queryRaw<
      {
        locationCount: number;
        businessCount: number;
        approvedCount: number;
        pendingCount: number;
      }[]
    >(Prisma.sql`
      SELECT
        COUNT(DISTINCT application."businessAddress")::int AS "locationCount",
        COUNT(*)::int AS "businessCount",
        COUNT(*) FILTER (
          WHERE application."status" = 'approved'::"MerchantKycStatus"
        )::int AS "approvedCount",
        COUNT(*) FILTER (
          WHERE application."status" = 'pending'::"MerchantKycStatus"
        )::int AS "pendingCount"
      FROM "MerchantKyc" application
      INNER JOIN "User" applicant ON applicant."id" = application."userId"
      ${searchFilter}
    `),
    prisma.$queryRaw<
      {
        address: string;
        businessCount: number;
        approvedCount: number;
        pendingCount: number;
      }[]
    >(Prisma.sql`
      SELECT
        application."businessAddress" AS address,
        COUNT(*)::int AS "businessCount",
        COUNT(*) FILTER (
          WHERE application."status" = 'approved'::"MerchantKycStatus"
        )::int AS "approvedCount",
        COUNT(*) FILTER (
          WHERE application."status" = 'pending'::"MerchantKycStatus"
        )::int AS "pendingCount"
      FROM "MerchantKyc" application
      INNER JOIN "User" applicant ON applicant."id" = application."userId"
      ${searchFilter}
      GROUP BY application."businessAddress"
      ORDER BY application."businessAddress" ASC
      LIMIT ${MERCHANT_LOCATION_PAGE_SIZE}
      OFFSET ${(page - 1) * MERCHANT_LOCATION_PAGE_SIZE}
    `),
  ]);
  const summary = summaryRows[0];
  if (!summary) throw new Error("Merchant location query returned no summary");

  return {
    ...summary,
    page,
    pageSize: MERCHANT_LOCATION_PAGE_SIZE,
    locations,
  };
}
