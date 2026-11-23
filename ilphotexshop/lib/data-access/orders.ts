import "server-only";

import { createHash } from "node:crypto";
import {
  OrderPaymentProofStatus,
  OrderStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateOrderInput,
  ListOrdersQuery,
} from "@/lib/validation/orders";

const orderItemFields = {
  id: true,
  productId: true,
  productName: true,
  productImage: true,
  sellerName: true,
  unitPrice: true,
  quantity: true,
  lineTotal: true,
} as const;

const customerOrderFields = {
  id: true,
  status: true,
  deliveryName: true,
  deliveryPhone: true,
  deliveryAddress: true,
  subtotal: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: orderItemFields,
    orderBy: { createdAt: "asc" as const },
  },
  paymentProofs: {
    select: {
      id: true,
      method: true,
      amount: true,
      currency: true,
      status: true,
      transactionReference: true,
      documentName: true,
      reviewReason: true,
      createdAt: true,
      reviewedAt: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

const adminOrderFields = {
  ...customerOrderFields,
  paymentProofs: false,
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

const idempotentOrderFields = {
  ...customerOrderFields,
  requestHash: true,
} as const;

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["fulfilled"],
  fulfilled: [],
  cancelled: [],
};

const maxOrderSubtotal = 2_147_483_647;

export class OrderInventoryUnavailableError extends Error {
  constructor() {
    super("One or more products are unavailable or have insufficient stock");
    this.name = "OrderInventoryUnavailableError";
  }
}

export class OrderSubtotalTooLargeError extends Error {
  constructor() {
    super("Order subtotal exceeds the supported amount");
    this.name = "OrderSubtotalTooLargeError";
  }
}

export class IdempotencyKeyReuseError extends Error {
  constructor() {
    super("Idempotency key was already used for a different order");
    this.name = "IdempotencyKeyReuseError";
  }
}

export class OrderStatusConflictError extends Error {
  constructor() {
    super("Order status cannot be changed to the requested state");
    this.name = "OrderStatusConflictError";
  }
}

export class OrderPaymentProofConflictError extends OrderStatusConflictError {
  constructor(
    message = "An order with a payment proof awaiting review or approved cannot be cancelled",
  ) {
    super();
    this.message = message;
    this.name = "OrderPaymentProofConflictError";
  }
}

function isPrismaError(
  error: unknown,
  code: "P2002" | "P2034",
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}

function hashOrderInput(input: CreateOrderInput) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

async function findExistingOrder(
  customerId: string,
  idempotencyKey: string,
  requestHash: string,
) {
  const existing = await prisma.order.findUnique({
    where: {
      customerId_idempotencyKey: { customerId, idempotencyKey },
    },
    select: idempotentOrderFields,
  });
  if (!existing) return null;
  const { requestHash: storedHash, ...order } = existing;
  if (storedHash !== requestHash) {
    throw new IdempotencyKeyReuseError();
  }

  return { order, replayed: true };
}

async function restockOrderItems(
  transaction: Prisma.TransactionClient,
  items: { productId: string | null; quantity: number }[],
) {
  for (const item of items) {
    if (!item.productId) continue;

    await transaction.product.updateMany({
      where: { id: item.productId },
      data: { stockQuantity: { increment: item.quantity } },
    });
  }
}

export async function createCustomerOrder(
  customerId: string,
  idempotencyKey: string,
  input: CreateOrderInput,
) {
  const requestHash = hashOrderInput(input);
  const existing = await findExistingOrder(
    customerId,
    idempotencyKey,
    requestHash,
  );
  if (existing) return existing;

  try {
    const order = await prisma.$transaction(
      async (transaction) => {
        const duplicate = await transaction.order.findUnique({
          where: {
            customerId_idempotencyKey: { customerId, idempotencyKey },
          },
          select: idempotentOrderFields,
        });
        if (duplicate) {
          const { requestHash: storedHash, ...previousOrder } = duplicate;
          if (storedHash !== requestHash) {
            throw new IdempotencyKeyReuseError();
          }
          return { order: previousOrder, replayed: true };
        }

        const products = await transaction.product.findMany({
          where: {
            id: { in: input.items.map((item) => item.productId) },
            isPublished: true,
          },
          select: {
            id: true,
            name: true,
            image: true,
            seller: true,
            ownerId: true,
            price: true,
            stockQuantity: true,
            updatedAt: true,
          },
        });
        if (products.length !== input.items.length) {
          throw new OrderInventoryUnavailableError();
        }

        const productsById = new Map(products.map((product) => [product.id, product]));
        const subtotal = input.items.reduce((total, item) => {
          const product = productsById.get(item.productId);
          if (!product || product.stockQuantity < item.quantity) {
            throw new OrderInventoryUnavailableError();
          }
          return total + product.price * item.quantity;
        }, 0);
        if (!Number.isSafeInteger(subtotal) || subtotal > maxOrderSubtotal) {
          throw new OrderSubtotalTooLargeError();
        }

        let discountAmount = 0;
        let couponId: string | null = null;
        if (input.couponCode) {
          const coupon = await transaction.coupon.findUnique({
            where: { code: input.couponCode },
            select: {
              id: true,
              discountType: true,
              discountValue: true,
              minimumSubtotal: true,
              maximumDiscount: true,
              usageLimit: true,
              perUserLimit: true,
              startsAt: true,
              endsAt: true,
              status: true,
              _count: { select: { redemptions: true } },
            },
          });
          const now = new Date();
          if (
            !coupon ||
            coupon.status === "cancelled" ||
            coupon.status === "ended" ||
            coupon.status !== "active" ||
            coupon.startsAt > now ||
            coupon.endsAt < now ||
            subtotal < coupon.minimumSubtotal
          ) {
            throw new Error("Coupon is invalid or not active");
          }
          if (coupon.usageLimit !== null && coupon._count.redemptions >= coupon.usageLimit) {
            throw new Error("Coupon usage limit has been reached");
          }
          const userRedemptions = await transaction.couponRedemption.count({
            where: { couponId: coupon.id, userId: customerId },
          });
          if (userRedemptions >= coupon.perUserLimit) {
            throw new Error("Coupon usage limit for this account has been reached");
          }
          discountAmount =
            coupon.discountType === "percentage"
              ? Math.floor((subtotal * coupon.discountValue) / 100)
              : coupon.discountValue;
          if (coupon.maximumDiscount !== null) {
            discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
          }
          discountAmount = Math.min(discountAmount, subtotal);
          couponId = coupon.id;
        }


        const createdOrder = await transaction.order.create({
          data: {
            customerId,
            idempotencyKey,
            requestHash,
            fulfillmentMethod: input.fulfillmentMethod,
            pickupLocation: input.pickupLocation ?? null,
            deliveryLatitude: input.deliveryLatitude ?? null,
            deliveryLongitude: input.deliveryLongitude ?? null,
            deliveryName: input.deliveryName,
            deliveryPhone: input.deliveryPhone,
            deliveryAddress: input.deliveryAddress,
            subtotal,
            items: {
              create: input.items.map((item) => {
                const product = productsById.get(item.productId);
                if (!product) throw new OrderInventoryUnavailableError();

                return {
                  productId: product.id,
                  sellerId: product.ownerId,
                  productName: product.name,
                  productImage: product.image,
                  sellerName: product.seller,
                  unitPrice: product.price,
                  quantity: item.quantity,
                  lineTotal: product.price * item.quantity,
                };
              }),
            },
          },
          select: customerOrderFields,
        });
        if (couponId && discountAmount > 0) {
          await transaction.couponRedemption.create({
            data: {
              couponId,
              userId: customerId,
              orderId: createdOrder.id,
              discountAmount,
              currency: createdOrder.currency,
            },
          });
        }
        return { order: createdOrder, replayed: false };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return order;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      const duplicate = await findExistingOrder(
        customerId,
        idempotencyKey,
        requestHash,
      );
      if (duplicate) return duplicate;
    }
    if (isPrismaError(error, "P2034")) {
      const duplicate = await findExistingOrder(
        customerId,
        idempotencyKey,
        requestHash,
      );
      if (duplicate) return duplicate;
      throw new OrderInventoryUnavailableError();
    }
    throw error;
  }
}

export async function getCustomerOrders(
  customerId: string,
  query: ListOrdersQuery,
) {
  const where = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
  };
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: customerOrderFields,
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total };
}

export async function getCustomerOrder(customerId: string, id: string) {
  return prisma.order.findFirst({
    where: { id, customerId },
    select: customerOrderFields,
  });
}

export async function cancelCustomerOrder(customerId: string, id: string) {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const orderRows = await transaction.$queryRaw<
          { status: OrderStatus }[]
        >(
          Prisma.sql`
            SELECT "status"
            FROM "Order"
            WHERE "id" = ${id} AND "customerId" = ${customerId}
            FOR UPDATE
          `,
        );
        const orderState = orderRows[0];
        if (!orderState) return null;
        const order = await transaction.order.findUnique({
          where: { id },
          select: {
            status: true,
            items: {
              select: {
                productId: true,
                quantity: true,
              },
            },
          },
        });
        if (!order || orderState.status !== OrderStatus.pending) {
          throw new OrderStatusConflictError();
        }
        const approvedPayment = await transaction.orderPaymentProof.findFirst({
          where: {
            orderId: id,
            status: {
              in: [
                OrderPaymentProofStatus.pending,
                OrderPaymentProofStatus.approved,
              ],
            },
          },
          select: { id: true },
        });
        if (approvedPayment) throw new OrderPaymentProofConflictError();

        const updated = await transaction.order.updateMany({
          where: { id, customerId, status: OrderStatus.pending },
          data: { status: OrderStatus.cancelled },
        });
        if (updated.count !== 1) throw new OrderStatusConflictError();

        await restockOrderItems(transaction, order.items);
        return transaction.order.findUnique({
          where: { id },
          select: customerOrderFields,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (isPrismaError(error, "P2034")) {
      throw new OrderStatusConflictError();
    }
    throw error;
  }
}

export async function getAdminOrders(query: ListOrdersQuery) {
  const where = query.status ? { status: query.status } : {};
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: adminOrderFields,
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total };
}

export async function updateOrderStatusAsAdmin(
  id: string,
  nextStatus: OrderStatus,
) {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const orderRows = await transaction.$queryRaw<
          { status: OrderStatus }[]
        >(
          Prisma.sql`
            SELECT "status"
            FROM "Order"
            WHERE "id" = ${id}
            FOR UPDATE
          `,
        );
        const orderState = orderRows[0];
        if (!orderState) return null;
        const order = await transaction.order.findUnique({
          where: { id },
          select: {
            status: true,
            items: {
              select: {
                productId: true,
                quantity: true,
              },
            },
          },
        });
        if (!order) return null;
        if (orderState.status === nextStatus) {
          return transaction.order.findUnique({
            where: { id },
            select: adminOrderFields,
          });
        }
        if (nextStatus === OrderStatus.cancelled) {
          const approvedPayment = await transaction.orderPaymentProof.findFirst({
            where: {
              orderId: id,
              status: {
                in: [
                  OrderPaymentProofStatus.pending,
                  OrderPaymentProofStatus.approved,
                ],
              },
            },
            select: { id: true },
          });
          if (approvedPayment) throw new OrderPaymentProofConflictError();
        }
        if (nextStatus === OrderStatus.confirmed) {
          const pendingProof = await transaction.orderPaymentProof.findFirst({
            where: {
              orderId: id,
              status: OrderPaymentProofStatus.pending,
            },
            select: { id: true },
          });
          if (pendingProof) {
            throw new OrderPaymentProofConflictError(
              "Review or reject the pending payment proof before confirming the order",
            );
          }
        }
        if (!allowedTransitions[orderState.status].includes(nextStatus)) {
          throw new OrderStatusConflictError();
        }
        if (nextStatus === OrderStatus.confirmed) {
          const approvedPaymentProof = await transaction.orderPaymentProof.findFirst({
            where: {
              orderId: id,
              status: OrderPaymentProofStatus.approved,
            },
            select: { id: true },
          });
          if (!approvedPaymentProof) {
            for (const item of order.items) {
              if (!item.productId) continue;
              const stockUpdate = await transaction.product.updateMany({
                where: {
                  id: item.productId,
                  isPublished: true,
                  stockQuantity: { gte: item.quantity },
                },
                data: { stockQuantity: { decrement: item.quantity } },
              });
              if (stockUpdate.count !== 1) {
                throw new OrderStatusConflictError();
              }
            }
          }
        }

        const updated = await transaction.order.updateMany({
          where: { id, status: orderState.status },
          data: { status: nextStatus },
        });
        if (updated.count !== 1) throw new OrderStatusConflictError();

        if (nextStatus === OrderStatus.cancelled) {
          await restockOrderItems(transaction, order.items);
        }

        return transaction.order.findUnique({
          where: { id },
          select: adminOrderFields,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (isPrismaError(error, "P2034")) {
      throw new OrderStatusConflictError();
    }
    throw error;
  }
}
