import "server-only";

import { PaymentAccountType, Prisma } from "@prisma/client";
import {
  AuthorizationDeniedError,
  requireSuperAdminPageUser,
} from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import type { PaymentAccountInput } from "@/lib/validation/payment-accounts";

export class DuplicatePaymentAccountError extends Error {
  constructor() {
    super("This payment account is already configured");
    this.name = "DuplicatePaymentAccountError";
  }
}

async function assertSuperAdmin(
  transaction: Prisma.TransactionClient,
  actorId: string,
) {
  const actor = await transaction.user.findUnique({
    where: { id: actorId },
    select: { role: true },
  });
  if (!actor || actor.role !== "super_admin") {
    throw new AuthorizationDeniedError();
  }
}

export async function getSuperAdminPaymentAccounts(
  type: PaymentAccountType,
) {
  await requireSuperAdminPageUser("/super-admin/payments/bank-accounts");
  return prisma.superAdminPaymentAccount.findMany({
    where: { type },
    orderBy: [{ isActive: "desc" }, { type: "asc" }, { provider: "asc" }],
  });
}

export async function getSuperAdminPaymentMethodStatuses() {
  await requireSuperAdminPageUser("/super-admin/payments/payment-methods");
  const [bankConfigured, bankActive, mobileConfigured, mobileActive] =
    await prisma.$transaction([
      prisma.superAdminPaymentAccount.count({
        where: { type: PaymentAccountType.bank },
      }),
      prisma.superAdminPaymentAccount.count({
        where: { type: PaymentAccountType.bank, isActive: true },
      }),
      prisma.superAdminPaymentAccount.count({
        where: { type: PaymentAccountType.mobile_money },
      }),
      prisma.superAdminPaymentAccount.count({
        where: { type: PaymentAccountType.mobile_money, isActive: true },
      }),
    ]);

  return [
    {
      type: PaymentAccountType.bank,
      configured: bankConfigured,
      active: bankActive,
    },
    {
      type: PaymentAccountType.mobile_money,
      configured: mobileConfigured,
      active: mobileActive,
    },
  ];
}

export async function createSuperAdminPaymentAccount(
  actorId: string,
  input: PaymentAccountInput,
) {
  try {
    return await prisma.$transaction(async (transaction) => {
      await assertSuperAdmin(transaction, actorId);
      return transaction.superAdminPaymentAccount.create({ data: input });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicatePaymentAccountError();
    }
    throw error;
  }
}

export async function updateSuperAdminPaymentAccountStatus(
  actorId: string,
  id: string,
  isActive: boolean,
) {
  return prisma.$transaction(async (transaction) => {
    await assertSuperAdmin(transaction, actorId);
    const result = await transaction.superAdminPaymentAccount.updateMany({
      where: { id },
      data: { isActive },
    });
    if (!result.count) return null;
    return transaction.superAdminPaymentAccount.findUnique({
      where: { id },
    });
  });
}
