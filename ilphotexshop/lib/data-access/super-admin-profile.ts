import "server-only";

import { Prisma, UserRole } from "@prisma/client";
import type { User } from "@prisma/client";
import { AuthorizationDeniedError, requireSuperAdminPageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

type SuperAdminActor = Pick<User, "id" | "role">;

export async function getSuperAdminProfile() {
  const actor = await requireSuperAdminPageUser("/super-admin/account");
  return prisma.user.findUnique({
    where: { id: actor.id },
    select: {
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });
}

export async function updateSuperAdminProfile(
  actor: SuperAdminActor,
  input: { name: string; phone: string | null },
) {
  if (actor.role !== UserRole.super_admin) {
    throw new AuthorizationDeniedError();
  }

  const updated = await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "User"
      SET "name" = ${input.name},
          "phone" = ${input.phone},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${actor.id}
        AND "role" = ${UserRole.super_admin}::"UserRole"
        AND "isSuspended" = false
        AND "isAnonymized" = false
    `,
  );
  if (updated !== 1) return null;

  return prisma.user.findUnique({
    where: { id: actor.id },
    select: { name: true, email: true, phone: true, createdAt: true },
  });
}

export async function getSuperAdminPasswordHash(actor: SuperAdminActor) {
  if (actor.role !== UserRole.super_admin) {
    throw new AuthorizationDeniedError();
  }

  const rows = await prisma.$queryRaw<{ passwordHash: string }[]>(
    Prisma.sql`
      SELECT "passwordHash"
      FROM "User"
      WHERE "id" = ${actor.id}
        AND "role" = ${UserRole.super_admin}::"UserRole"
        AND "isSuspended" = false
        AND "isAnonymized" = false
      LIMIT 1
    `,
  );
  return rows[0]?.passwordHash ?? null;
}

export async function updateSuperAdminPassword(
  actor: SuperAdminActor,
  currentPasswordHash: string,
  nextPasswordHash: string,
) {
  if (actor.role !== UserRole.super_admin) {
    throw new AuthorizationDeniedError();
  }

  const updated = await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "User"
      SET "passwordHash" = ${nextPasswordHash},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${actor.id}
        AND "role" = ${UserRole.super_admin}::"UserRole"
        AND "passwordHash" = ${currentPasswordHash}
        AND "isSuspended" = false
        AND "isAnonymized" = false
    `,
  );
  return updated === 1;
}
