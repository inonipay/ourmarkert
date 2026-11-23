import "server-only";

import { Prisma, ProductCategory } from "@prisma/client";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE = 20;

export type ProductManagementView = "scheduled" | "rejected" | "hidden";

export async function getSuperAdminProductManagement(
  view: ProductManagementView,
  query: string,
  page: number,
) {
  await requireSuperAdminPageUser(`/super-admin/products/${view === "scheduled" ? "scheduled-products" : `${view}-products`}`);
  const safePage = Math.max(1, Math.min(page, 500));
  const search = query
    ? {
        OR: [
          { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { seller: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { location: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};
  const where =
    view === "scheduled"
      ? { scheduledAt: { not: null }, ...search }
      : view === "rejected"
        ? { moderationStatus: "rejected" as const, ...search }
        : { moderationStatus: "hidden" as const, ...search };
  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        image: true,
        seller: true,
        category: true,
        price: true,
        stockQuantity: true,
        isPublished: true,
        scheduledAt: true,
        moderationStatus: true,
        moderationReason: true,
        moderatedAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE,
      skip: (safePage - 1) * SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  return {
    rows,
    total,
    page: safePage,
    pageSize: SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE,
  };
}

export async function setProductScheduledState(
  actorId: string,
  productId: string,
  scheduledAt: Date | null,
) {
  await requireSuperAdminPageUser("/super-admin/products/scheduled-products");
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, ownerId: true, isPublished: true },
  });
  if (!product) return null;
  if (scheduledAt) {
    if (scheduledAt.getTime() <= Date.now()) throw new Error("Schedule time must be in the future");
    if (!product.isPublished) throw new Error("Only published products can be scheduled");
  }
  await prisma.product.update({
    where: { id: productId },
    data: { scheduledAt },
  });
  return { id: productId, scheduledAt };
}

export async function getProductSubcategories(search: string) {
  await requireSuperAdminPageUser("/super-admin/products/subcategories");
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};
  const [rows, active, inactive] = await prisma.$transaction([
    prisma.productSubcategory.findMany({
      where,
      select: {
        id: true,
        category: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.productSubcategory.count({ where: { isActive: true } }),
    prisma.productSubcategory.count({ where: { isActive: false } }),
  ]);
  return { rows, active, inactive };
}

export async function upsertProductSubcategory(input: {
  id?: string;
  category: ProductCategory;
  name: string;
  slug: string;
}) {
  await requireSuperAdminPageUser("/super-admin/products/subcategories");
  if (input.id) {
    return prisma.productSubcategory.update({
      where: { id: input.id },
      data: { category: input.category, name: input.name, slug: input.slug },
    });
  }
  return prisma.productSubcategory.create({
    data: { category: input.category, name: input.name, slug: input.slug },
  });
}

export async function setProductSubcategoryStatus(id: string, isActive: boolean) {
  await requireSuperAdminPageUser("/super-admin/products/subcategories");
  const result = await prisma.productSubcategory.updateMany({
    where: { id },
    data: { isActive },
  });
  return result.count === 1;
}

export async function createProductReport(
  reporterId: string,
  productId: string,
  reason: string,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId, isPublished: true },
    select: { id: true },
  });
  if (!product) return null;
  return prisma.productReport.create({
    data: { productId, reporterId, reason, status: "pending" },
  });
}

export async function getSuperAdminProductReports(query: string, page: number) {
  await requireSuperAdminPageUser("/super-admin/products/reported-products");
  const safePage = Math.max(1, Math.min(page, 500));
  const where = query
    ? {
        OR: [
          { reason: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { product: { is: { name: { contains: query, mode: Prisma.QueryMode.insensitive } } } },
          { reporter: { is: { name: { contains: query, mode: Prisma.QueryMode.insensitive } } } },
        ],
      }
    : {};
  const [rows, total, pending, reviewed, dismissed] = await prisma.$transaction([
    prisma.productReport.findMany({
      where,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        reviewNote: true,
        reviewedAt: true,
        product: { select: { id: true, name: true, image: true, seller: true } },
        reporter: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE,
      skip: (safePage - 1) * SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE,
    }),
    prisma.productReport.count({ where }),
    prisma.productReport.count({ where: { status: "pending" } }),
    prisma.productReport.count({ where: { status: "reviewed" } }),
    prisma.productReport.count({ where: { status: "dismissed" } }),
  ]);
  return { rows, total, page: safePage, pageSize: SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE, pending, reviewed, dismissed };
}

export async function reviewProductReport(
  actorId: string,
  reportId: string,
  action: "review" | "dismiss",
  note?: string,
) {
  await requireSuperAdminPageUser("/super-admin/products/reported-products");
  const result = await prisma.productReport.updateMany({
    where: { id: reportId, status: "pending" },
    data: {
      status: action === "review" ? "reviewed" : "dismissed",
      reviewedById: actorId,
      reviewedAt: new Date(),
      reviewNote: note || null,
    },
  });
  return result.count === 1;
}
