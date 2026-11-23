import "server-only";

import {
  OrderPaymentProofStatus,
  PaymentProofMethod,
  Prisma,
} from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/validation/super-admin-analytics";

export const PAYMENT_REPORT_PAGE_SIZE = 50;

export async function getSuperAdminPaymentReport(
  range: AnalyticsDateRange,
  requestedPage: number,
) {
  await requireSuperAdminPageUser("/super-admin/payments/payment-reports");
  const page = Math.max(1, Math.min(10000, requestedPage));
  const offset = (page - 1) * PAYMENT_REPORT_PAGE_SIZE;
  const where: Prisma.OrderPaymentProofWhereInput = {
    createdAt: { gte: range.start, lt: range.endExclusive },
  };
  const approvedWhere: Prisma.OrderPaymentProofWhereInput = {
    ...where,
    status: OrderPaymentProofStatus.approved,
  };

  const [
    total,
    pending,
    approved,
    rejected,
    approvedAmounts,
    bankTransfers,
    mobileMoney,
    rows,
  ] = await prisma.$transaction([
    prisma.orderPaymentProof.count({ where }),
    prisma.orderPaymentProof.count({
      where: { ...where, status: OrderPaymentProofStatus.pending },
    }),
    prisma.orderPaymentProof.count({ where: approvedWhere }),
    prisma.orderPaymentProof.count({
      where: { ...where, status: OrderPaymentProofStatus.rejected },
    }),
    prisma.orderPaymentProof.groupBy({
      by: ["currency"],
      where: approvedWhere,
      _sum: { amount: true },
      orderBy: { currency: "asc" },
    }),
    prisma.orderPaymentProof.count({
      where: { ...where, method: PaymentProofMethod.bank_transfer },
    }),
    prisma.orderPaymentProof.count({
      where: { ...where, method: PaymentProofMethod.mobile_money },
    }),
    prisma.orderPaymentProof.findMany({
      where,
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        transactionReference: true,
        documentName: true,
        status: true,
        reviewReason: true,
        createdAt: true,
        customer: { select: { name: true, email: true } },
        order: { select: { id: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAYMENT_REPORT_PAGE_SIZE,
      skip: offset,
    }),
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
    approvedAmounts: approvedAmounts.map((entry) => ({
      currency: entry.currency.trim(),
      amount: entry._sum?.amount ?? 0,
    })),
    methods: [
      { method: PaymentProofMethod.bank_transfer, count: bankTransfers },
      { method: PaymentProofMethod.mobile_money, count: mobileMoney },
    ].filter((entry) => entry.count > 0),
    rows,
    page,
    pageSize: PAYMENT_REPORT_PAGE_SIZE,
  };
}
