import "server-only";

import { Prisma, UserRole } from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const MERCHANT_MANAGEMENT_PAGE_SIZE = 20;

export async function getMerchantStaffOptions() {
  await requireSuperAdminPageUser("/super-admin/merchants/merchant-staff");
  const [merchants, users] = await prisma.$transaction([
    prisma.user.findMany({
      where: { role: UserRole.seller, isSuspended: false, isAnonymized: false },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true, archivedAt: null, isAnonymized: false, role: { not: "super_admin" } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { merchants, users };
}

export async function getMerchantStaff(search: string, page: number) {
  await requireSuperAdminPageUser("/super-admin/merchants/merchant-staff");
  const safePage = Math.max(1, Math.min(page, 500));
  const where: Prisma.MerchantStaffWhereInput = search
    ? {
        OR: [
          { user: { is: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
          { user: { is: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
          { merchant: { is: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
        ],
      }
    : {};
  const [rows, total, active, inactive, merchants] = await prisma.$transaction([
    prisma.merchantStaff.findMany({
      where,
      select: {
        id: true,
        role: true,
        status: true,
        canManageProducts: true,
        canManageOrders: true,
        canManageStaff: true,
        canManageFinancialProfile: true,
        createdAt: true,
        merchant: { select: { id: true, name: true, email: true } },
        user: { select: { id: true, name: true, email: true, isActive: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MERCHANT_MANAGEMENT_PAGE_SIZE,
      skip: (safePage - 1) * MERCHANT_MANAGEMENT_PAGE_SIZE,
    }),
    prisma.merchantStaff.count({ where }),
    prisma.merchantStaff.count({ where: { status: "active" } }),
    prisma.merchantStaff.count({ where: { status: "inactive" } }),
    prisma.user.count({ where: { role: UserRole.seller } }),
  ]);
  return { rows, total, page: safePage, pageSize: MERCHANT_MANAGEMENT_PAGE_SIZE, active, inactive, merchants };
}

export async function getMerchantFinancialProfiles(search: string, page: number) {
  await requireSuperAdminPageUser("/super-admin/merchants/merchant-financial-profiles");
  const safePage = Math.max(1, Math.min(page, 500));
  const where: Prisma.MerchantFinancialProfileWhereInput = search
    ? {
        OR: [
          { accountName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { bankName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { bankAccountNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { mobileMoneyNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { merchant: { is: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
          { merchant: { is: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
        ],
      }
    : {};
  const [rows, total, verified, unverified] = await prisma.$transaction([
    prisma.merchantFinancialProfile.findMany({
      where,
      select: {
        id: true,
        accountName: true,
        bankName: true,
        bankAccountNumber: true,
        mobileMoneyProvider: true,
        mobileMoneyNumber: true,
        currency: true,
        isVerified: true,
        verifiedAt: true,
        merchant: { select: { id: true, name: true, email: true, isSuspended: true } },
        verifiedBy: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MERCHANT_MANAGEMENT_PAGE_SIZE,
      skip: (safePage - 1) * MERCHANT_MANAGEMENT_PAGE_SIZE,
    }),
    prisma.merchantFinancialProfile.count({ where }),
    prisma.merchantFinancialProfile.count({ where: { isVerified: true } }),
    prisma.merchantFinancialProfile.count({ where: { isVerified: false } }),
  ]);
  return { rows, total, page: safePage, pageSize: MERCHANT_MANAGEMENT_PAGE_SIZE, verified, unverified };
}

export async function upsertMerchantStaff(input: {
  merchantId: string;
  userId: string;
  role: "owner" | "manager" | "operations" | "support" | "finance";
  canManageProducts?: boolean;
  canManageOrders?: boolean;
  canManageStaff?: boolean;
  canManageFinancialProfile?: boolean;
}) {
  await requireSuperAdminPageUser("/super-admin/merchants/merchant-staff");
  const merchant = await prisma.user.findUnique({
    where: { id: input.merchantId },
    select: { role: true, isSuspended: true, isAnonymized: true },
  });
  if (!merchant || merchant.role !== UserRole.seller) {
    throw new Error("Merchant account not found");
  }
  if (merchant.isSuspended || merchant.isAnonymized) {
    throw new Error("Staff cannot be assigned to a suspended or anonymized merchant");
  }
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { role: true, isActive: true, archivedAt: true, isAnonymized: true },
  });
  if (!user || user.role === "super_admin" || !user.isActive || user.archivedAt || user.isAnonymized) {
    throw new Error("Only an active non-super-admin account can be added as merchant staff");
  }
  const roleDefaults =
    input.role === "owner"
      ? {
          canManageProducts: true,
          canManageOrders: true,
          canManageStaff: true,
          canManageFinancialProfile: true,
        }
      : input.role === "manager"
        ? {
            canManageProducts: true,
            canManageOrders: true,
            canManageStaff: true,
            canManageFinancialProfile: false,
          }
        : {
            canManageProducts: input.role === "operations",
            canManageOrders: input.role === "operations",
            canManageStaff: false,
            canManageFinancialProfile: input.role === "finance",
          };
  const permissions = {
    canManageProducts: input.canManageProducts ?? roleDefaults.canManageProducts,
    canManageOrders: input.canManageOrders ?? roleDefaults.canManageOrders,
    canManageStaff: input.canManageStaff ?? roleDefaults.canManageStaff,
    canManageFinancialProfile:
      input.canManageFinancialProfile ?? roleDefaults.canManageFinancialProfile,
  };
  return prisma.merchantStaff.upsert({
    where: { merchantId_userId: { merchantId: input.merchantId, userId: input.userId } },
    create: {
      merchantId: input.merchantId,
      userId: input.userId,
      role: input.role,
      status: "active",
      ...permissions,
    },
    update: { role: input.role, status: "active", ...permissions },
  });
}

export async function setMerchantStaffStatus(id: string, status: "active" | "inactive") {
  await requireSuperAdminPageUser("/super-admin/merchants/merchant-staff");
  const result = await prisma.merchantStaff.updateMany({
    where: { id },
    data: { status },
  });
  return result.count === 1;
}

export async function upsertMerchantFinancialProfile(actorId: string, input: {
  merchantId: string;
  accountName: string;
  bankName?: string;
  bankAccountNumber?: string;
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
  currency: string;
}) {
  await requireSuperAdminPageUser("/super-admin/merchants/merchant-financial-profiles");
  const merchant = await prisma.user.findUnique({
    where: { id: input.merchantId },
    select: { role: true, isAnonymized: true },
  });
  if (!merchant || merchant.role !== UserRole.seller || merchant.isAnonymized) {
    throw new Error("A valid identifiable merchant account is required");
  }
  if (!input.bankName && !input.bankAccountNumber && !input.mobileMoneyProvider && !input.mobileMoneyNumber) {
    throw new Error("Provide at least one bank or mobile-money destination");
  }
  return prisma.merchantFinancialProfile.upsert({
    where: { merchantId: input.merchantId },
    create: {
      merchantId: input.merchantId,
      accountName: input.accountName,
      bankName: input.bankName || null,
      bankAccountNumber: input.bankAccountNumber || null,
      mobileMoneyProvider: input.mobileMoneyProvider || null,
      mobileMoneyNumber: input.mobileMoneyNumber || null,
      currency: input.currency,
      isVerified: false,
      verifiedById: null,
    },
    update: {
      accountName: input.accountName,
      bankName: input.bankName || null,
      bankAccountNumber: input.bankAccountNumber || null,
      mobileMoneyProvider: input.mobileMoneyProvider || null,
      mobileMoneyNumber: input.mobileMoneyNumber || null,
      currency: input.currency,
      isVerified: false,
      verifiedAt: null,
      verifiedById: null,
    },
  });
}

export async function setMerchantFinancialProfileVerified(actorId: string, id: string, isVerified: boolean) {
  await requireSuperAdminPageUser("/super-admin/merchants/merchant-financial-profiles");
  const result = await prisma.merchantFinancialProfile.updateMany({
    where: { id },
    data: {
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
      verifiedById: isVerified ? actorId : null,
    },
  });
  return result.count === 1;
}

export async function getSuperAdminMerchantDetail(merchantId: string) {
  await requireSuperAdminPageUser(`/super-admin/merchants/${merchantId}`);
  const merchant = await prisma.user.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isSuspended: true,
      isAnonymized: true,
      isActive: true,
      archivedAt: true,
      lastLoginAt: true,
      createdAt: true,
      merchantKyc: true,
      merchantStaffMemberships: {
        select: {
          id: true,
          role: true,
          status: true,
          canManageProducts: true,
          canManageOrders: true,
          canManageStaff: true,
          canManageFinancialProfile: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      merchantFinancialProfile: true,
    },
  });
  if (!merchant || merchant.role !== UserRole.seller) return null;

  const [products, orders, accessAudit] = await prisma.$transaction([
    prisma.product.findMany({
      where: { ownerId: merchantId },
      select: { id: true, name: true, price: true, stockQuantity: true, isPublished: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.orderItem.findMany({
      where: { sellerId: merchantId },
      select: {
        id: true,
        productName: true,
        quantity: true,
        lineTotal: true,
        createdAt: true,
        order: { select: { id: true, status: true, customer: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.merchantAccessAudit.findMany({
      where: { targetId: merchantId },
      select: { id: true, action: true, reason: true, createdAt: true, actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const kycAudit = merchant.merchantKyc
    ? await prisma.merchantKycAudit.findMany({
        where: { applicationId: merchant.merchantKyc.id },
        select: {
          id: true,
          action: true,
          reason: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return { merchant, products, orders, accessAudit, kycAudit };
}
