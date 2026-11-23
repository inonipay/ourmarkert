import { PrismaClient } from "@prisma/client";
import { products } from "../data/products";

const prisma = new PrismaClient();

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        ...product,
        previousPrice: product.previousPrice ?? null,
        badge: product.badge ?? null,
        badgeFr: product.badgeFr ?? null,
        badgeRw: product.badgeRw ?? null,
        stockQuantity: product.stockQuantity ?? 0,
        isPublished: true,
      },
      update: {
        ...product,
        previousPrice: product.previousPrice ?? null,
        badge: product.badge ?? null,
        badgeFr: product.badgeFr ?? null,
        badgeRw: product.badgeRw ?? null,
        stockQuantity: product.stockQuantity ?? 0,
        isPublished: true,
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed marketplace products", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
