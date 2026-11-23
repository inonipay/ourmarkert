import "server-only";

import { MerchantKycStatus, Prisma } from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const BUSINESS_INFORMATION_PAGE_SIZE = 20;

export async function getSuperAdminBusinessInformation(
  search: string,
  requestedPage: number,
) {
  await requireSuperAdminPageUser("/super-admin/merchants/business-information");
  const page = Math.max(1, Math.min(1000, requestedPage));
  const where: Prisma.MerchantKycWhereInput = search
    ? {
        OR: [
          {
            ownerFullName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            businessName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            businessAddress: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            taxId: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            user: {
              is: {
                email: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        ],
      }
    : {};

  const [total, pending, approved, rows] = await prisma.$transaction([
    prisma.merchantKyc.count({ where }),
    prisma.merchantKyc.count({
      where: { ...where, status: MerchantKycStatus.pending },
    }),
    prisma.merchantKyc.count({
      where: { ...where, status: MerchantKycStatus.approved },
    }),
    prisma.merchantKyc.findMany({
      where,
      select: {
        id: true,
        ownerFullName: true,
        businessName: true,
        businessAddress: true,
        taxId: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        user: {
          select: {
            email: true,
            isSuspended: true,
            isAnonymized: true,
          },
        },
      },
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      take: BUSINESS_INFORMATION_PAGE_SIZE,
      skip: (page - 1) * BUSINESS_INFORMATION_PAGE_SIZE,
    }),
  ]);

  return {
    total,
    pending,
    approved,
    page,
    pageSize: BUSINESS_INFORMATION_PAGE_SIZE,
    rows,
  };
}
