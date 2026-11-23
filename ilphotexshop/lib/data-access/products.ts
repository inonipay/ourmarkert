import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type UserRole } from "@prisma/client";
import type { Product } from "@/data/products";
import { AuthorizationDeniedError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import type { UploadedProductImage } from "@/lib/http/product-image-upload";
import type {
  CreateProductInput,
  CreateProductMetadataInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@/lib/validation/products";

const publicProductFields = {
  id: true,
  name: true,
  nameFr: true,
  nameRw: true,
  category: true,
  price: true,
  previousPrice: true,
  rating: true,
  reviewCount: true,
  badge: true,
  badgeFr: true,
  badgeRw: true,
  image: true,
  seller: true,
  location: true,
  stockQuantity: true,
  isFeatured: true,
  ownerId: true,
  owner: { select: { phone: true } },
} as const;

const managedProductFields = {
  ...publicProductFields,
  isPublished: true,
  moderationStatus: true,
  moderationReason: true,
  moderatedAt: true,
  moderatedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ProductActor = {
  id: string;
  name: string;
  role: UserRole;
};

export class InvalidProductPricingError extends Error {
  constructor() {
    super("Previous price must be greater than current price");
    this.name = "InvalidProductPricingError";
  }
}

export class SuspendedMerchantProductError extends Error {
  constructor() {
    super("Products owned by a suspended merchant cannot be published");
    this.name = "SuspendedMerchantProductError";
  }
}

export class ProductNotPublishedError extends Error {
  constructor() {
    super("Only published products can be featured");
    this.name = "ProductNotPublishedError";
  }
}

export class ProductImageUploadRequiredError extends Error {
  constructor() {
    super("Choose an image file before switching to upload");
    this.name = "ProductImageUploadRequiredError";
  }
}

function assertCanManageProducts(actor: ProductActor) {
  if (
    actor.role !== "seller" &&
    actor.role !== "admin" &&
    actor.role !== "super_admin"
  ) {
    throw new AuthorizationDeniedError();
  }
}

function getOwnerFilter(actor: ProductActor) {
  assertCanManageProducts(actor);
  return actor.role === "seller" ? { ownerId: actor.id } : {};
}

function getProductOrder(sort: ListProductsQuery["sort"]) {
  if (sort === "price-low") return { price: "asc" as const };
  if (sort === "price-high") return { price: "desc" as const };
  if (sort === "rating") return { rating: "desc" as const };
  return { createdAt: "desc" as const };
}

function getSearchFilter(q: string, category?: ListProductsQuery["category"]) {
  const search = q.trim();
  return {
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { nameFr: { contains: search, mode: "insensitive" as const } },
            { nameRw: { contains: search, mode: "insensitive" as const } },
            { seller: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function getPublishedProducts({
  q = "",
  category,
  sort = "recommended",
  limit = 50,
  offset = 0,
}: Partial<ListProductsQuery> = {}): Promise<{
  products: Product[];
  total: number;
}> {
  const where = {
    isPublished: true,
    ...getSearchFilter(q, category),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: publicProductFields,
      orderBy: getProductOrder(sort),
      take: limit,
      skip: offset,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

export async function getManagedProducts(
  actor: ProductActor,
  query: ListProductsQuery,
) {
  const where = {
    ...getOwnerFilter(actor),
    ...getSearchFilter(query.q, query.category),
  };
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: managedProductFields,
      orderBy: getProductOrder(query.sort),
      take: query.limit,
      skip: query.offset,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

export async function createSellerProduct(
  seller: ProductActor,
  input: CreateProductInput,
) {
  if (seller.role !== "seller") throw new AuthorizationDeniedError();

  return prisma.product.create({
    data: {
      ...input,
      seller: seller.name,
      ownerId: seller.id,
      isPublished: false,
      moderationStatus: "pending",
      moderationReason: null,
      moderatedAt: null,
      moderatedById: null,
    },
    select: managedProductFields,
  });
}

export async function createSellerProductWithImage(
  seller: ProductActor,
  input: CreateProductMetadataInput,
  uploadedImage: UploadedProductImage,
) {
  if (seller.role !== "seller") throw new AuthorizationDeniedError();

  const productId = randomUUID();
  const imageId = randomUUID();
  const image = `/api/products/images/${imageId}`;

  return prisma.$transaction(async (transaction) => {
    await transaction.product.create({
      data: {
        id: productId,
        ...input,
        image,
        seller: seller.name,
        ownerId: seller.id,
        isPublished: false,
        moderationStatus: "pending",
      },
      select: { id: true },
    });
    await transaction.productImage.create({
      data: {
        id: imageId,
        productId,
        imageData: new Uint8Array(uploadedImage.imageData),
        mimeType: uploadedImage.mimeType,
      },
    });
    return transaction.product.findUniqueOrThrow({
      where: { id: productId },
      select: managedProductFields,
    });
  });
}

async function deleteUnreferencedProductImages(
  transaction: Prisma.TransactionClient,
  imageIds: string[],
) {
  if (!imageIds.length) return;
  const images = await transaction.productImage.findMany({
    where: { id: { in: imageIds } },
    select: { id: true },
  });
  const imagePaths = images.map(({ id }) => `/api/products/images/${id}`);
  const referencedImages = await transaction.orderItem.findMany({
    where: { productImage: { in: imagePaths } },
    select: { productImage: true },
  });
  const referencedPaths = new Set(
    referencedImages.map(({ productImage }) => productImage),
  );
  const unusedIds = images
    .filter(({ id }) => !referencedPaths.has(`/api/products/images/${id}`))
    .map(({ id }) => id);
  if (unusedIds.length) {
    await transaction.productImage.deleteMany({
      where: { id: { in: unusedIds } },
    });
  }
}

export async function updateManagedProduct(
  actor: ProductActor,
  id: string,
  input: UpdateProductInput,
  uploadedImage?: UploadedProductImage,
  requireImageUpload = false,
) {
  const where = { id, ...getOwnerFilter(actor) };
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.product.findFirst({
      where,
      select: { price: true, previousPrice: true, image: true },
    });
    if (!current) return null;

    const currentImageId = current.image.match(
      /^\/api\/products\/images\/([a-f0-9-]{36})$/i,
    )?.[1];
    if (
      requireImageUpload &&
      !uploadedImage &&
      !currentImageId
    ) {
      throw new ProductImageUploadRequiredError();
    }

    const nextPrice = input.price ?? current.price;
    const nextPreviousPrice =
      input.previousPrice === undefined
        ? current.previousPrice
        : input.previousPrice;
    if (nextPreviousPrice !== null && nextPreviousPrice <= nextPrice) {
      throw new InvalidProductPricingError();
    }

    const imageId = uploadedImage ? randomUUID() : null;
    const result = await transaction.product.updateMany({
      where,
      data: {
        ...input,
        ...(imageId
          ? { image: `/api/products/images/${imageId}` }
          : {}),
        ...(actor.role === "seller" ? { isPublished: false } : {}),
        ...(actor.role === "seller" ? { isFeatured: false } : {}),
        ...(actor.role === "seller"
          ? {
              moderationStatus: "pending" as const,
              moderationReason: null,
              moderatedAt: null,
              moderatedById: null,
            }
          : {}),
      },
    });
    if (result.count === 0) return null;

    if (imageId && uploadedImage) {
      await transaction.productImage.create({
        data: {
          id: imageId,
          productId: id,
          imageData: new Uint8Array(uploadedImage.imageData),
          mimeType: uploadedImage.mimeType,
        },
      });
    }
    if (uploadedImage || input.image) {
      const oldImages = await transaction.productImage.findMany({
        where: {
          productId: id,
          ...(imageId ? { id: { not: imageId } } : {}),
        },
        select: { id: true },
      });
      await deleteUnreferencedProductImages(
        transaction,
        oldImages.map(({ id: oldImageId }) => oldImageId),
      );
    }

    return transaction.product.findUnique({
      where: { id },
      select: managedProductFields,
    });
  });
}

export async function deleteManagedProduct(actor: ProductActor, id: string) {
  const where = { id, ...getOwnerFilter(actor) };
  return prisma.$transaction(async (transaction) => {
    const images = await transaction.productImage.findMany({
      where: { productId: id },
      select: { id: true },
    });
    const result = await transaction.product.deleteMany({ where });
    if (!result.count) return false;
    await deleteUnreferencedProductImages(
      transaction,
      images.map(({ id: imageId }) => imageId),
    );
    return true;
  });
}

export async function getProductImageRecord(id: string) {
  return prisma.productImage.findUnique({
    where: { id },
    select: {
      imageData: true,
      mimeType: true,
      product: {
        select: { ownerId: true, isPublished: true, image: true },
      },
    },
  });
}

export async function isProductImageUsedByOrder(
  id: string,
  userId: string,
) {
  return prisma.orderItem.findFirst({
    where: {
      productImage: `/api/products/images/${id}`,
      OR: [{ sellerId: userId }, { order: { customerId: userId } }],
    },
    select: { id: true },
  });
}

export async function setProductPublishedState(
  admin: ProductActor,
  id: string,
  isPublished: boolean,
) {
  if (admin.role !== "admin" && admin.role !== "super_admin") {
    throw new AuthorizationDeniedError();
  }

  return prisma.$transaction(async (transaction) => {
    if (isPublished) {
      const ownerRows = await transaction.$queryRaw<
        { isSuspended: boolean }[]
      >(
        Prisma.sql`
          SELECT owner."isSuspended"
          FROM "Product" product
          INNER JOIN "User" owner ON owner."id" = product."ownerId"
          WHERE product."id" = ${id}
            AND owner."role" = 'seller'::"UserRole"
          FOR UPDATE OF owner
        `,
      );
      if (ownerRows[0]?.isSuspended) {
        throw new SuspendedMerchantProductError();
      }
    }

    const result = await transaction.product.updateMany({
      where: { id },
      data: {
        isPublished,
        ...(!isPublished ? { isFeatured: false } : {}),
        ...(isPublished
          ? { moderationStatus: "published" as const }
          : { moderationStatus: "hidden" as const }),
      },
    });
    return result.count > 0;
  });
}

export async function moderateProductAsSuperAdmin(
  actorId: string,
  id: string,
  action: "approve" | "reject",
  reason?: string,
) {
  return prisma.$transaction(async (transaction) => {
    const product = await transaction.product.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        isPublished: true,
        moderationStatus: true,
      },
    });
    if (!product) return null;

    if (action === "approve") {
      if (product.ownerId) {
        const owner = await transaction.user.findUnique({
          where: { id: product.ownerId },
          select: { role: true, isSuspended: true, isAnonymized: true, archivedAt: true },
        });
        if (
          owner?.role === "seller" &&
          (owner.isSuspended || owner.isAnonymized || owner.archivedAt)
        ) {
          throw new SuspendedMerchantProductError();
        }
      }
    }

    await transaction.product.update({
      where: { id },
      data: action === "approve"
        ? {
            isPublished: true,
            moderationStatus: "published",
            moderationReason: null,
            moderatedAt: new Date(),
            moderatedById: actorId,
          }
        : {
            isPublished: false,
            isFeatured: false,
            moderationStatus: "rejected",
            moderationReason: reason!,
            moderatedAt: new Date(),
            moderatedById: actorId,
          },
    });
    return { id, action };
  });
}

export async function setSuperAdminProductFeaturedState(
  id: string,
  isFeatured: boolean,
) {
  if (!isFeatured) {
    const result = await prisma.product.updateMany({
      where: { id },
      data: { isFeatured: false },
    });
    return result.count > 0;
  }

  const result = await prisma.product.updateMany({
    where: { id, isPublished: true },
    data: { isFeatured: true },
  });
  if (result.count > 0) return true;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!product) return false;
  throw new ProductNotPublishedError();
}
