import "server-only";

import {
  OrderPaymentProofStatus,
  OrderStatus,
  Prisma,
} from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const PENDING_PAYMENT_PAGE_SIZE = 20;

export async function getSuperAdminPendingPayments(
  search: string,
  requestedPage: number,
) {
  await requireSuperAdminPageUser("/super-admin/orders/pending-payments");
  const page = Math.max(1, Math.min(1000, requestedPage));
  const where: Prisma.OrderWhereInput = {
    status: OrderStatus.pending,
    paymentProofs: { none: { status: OrderPaymentProofStatus.approved } },
    ...(search
      ? {
          OR: [
            {
              id: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              customer: {
                is: {
                  OR: [
                    {
                      name: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                    {
                      email: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  ],
                },
              },
            },
            {
              paymentProofs: {
                some: {
                  transactionReference: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
  const noActiveProof = {
    paymentProofs: {
      none: {
        status: {
          in: [
            OrderPaymentProofStatus.pending,
            OrderPaymentProofStatus.rejected,
          ],
        },
      },
    },
  } satisfies Prisma.OrderWhereInput;
  const rejectedProof = {
    paymentProofs: {
      some: { status: OrderPaymentProofStatus.rejected },
      none: { status: OrderPaymentProofStatus.pending },
    },
  } satisfies Prisma.OrderWhereInput;

  const [total, awaitingVerification, rejectedProofs, noProofs, rows] =
    await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.count({
        where: {
          AND: [where, {
            paymentProofs: {
              some: { status: OrderPaymentProofStatus.pending },
            },
          }],
        },
      }),
      prisma.order.count({ where: { AND: [where, rejectedProof] } }),
      prisma.order.count({ where: { AND: [where, noActiveProof] } }),
      prisma.order.findMany({
        where,
        select: {
          id: true,
          subtotal: true,
          currency: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
          paymentProofs: {
            where: {
              status: {
                in: [
                  OrderPaymentProofStatus.pending,
                  OrderPaymentProofStatus.rejected,
                ],
              },
            },
            select: {
              status: true,
              transactionReference: true,
              reviewReason: true,
              createdAt: true,
            },
            orderBy: [{ createdAt: "desc" }],
            take: 1,
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: PENDING_PAYMENT_PAGE_SIZE,
        skip: (page - 1) * PENDING_PAYMENT_PAGE_SIZE,
      }),
    ]);

  return {
    total,
    awaitingVerification,
    rejectedProofs,
    noProofs,
    page,
    pageSize: PENDING_PAYMENT_PAGE_SIZE,
    rows,
  };
}
