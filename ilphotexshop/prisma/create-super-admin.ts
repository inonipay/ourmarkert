import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { z } from "zod";
import {
  emailSchema,
  phoneNumberSchema,
  registrationPasswordSchema,
} from "@/lib/validation/auth";

const superAdminArgumentsSchema = z.tuple([
  emailSchema,
  phoneNumberSchema,
]);

async function main() {
  const parsedArguments = superAdminArgumentsSchema.safeParse(
    process.argv.slice(2),
  );
  if (!parsedArguments.success) {
    console.error(
      "Usage: npm run db:create-super-admin -- <email> <phone>",
    );
    process.exitCode = 1;
    return;
  }

  const password = registrationPasswordSchema.safeParse(
    process.env.SUPER_ADMIN_PASSWORD,
  );
  if (!password.success) {
    throw new Error(
      "Set a 12-72 character SUPER_ADMIN_PASSWORD in the ignored .env file",
    );
  }

  const [email, phone] = parsedArguments.data;
  const prisma = new PrismaClient();
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const passwordHash = await bcrypt.hash(password.data, 12);

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          phone,
          passwordHash,
          role: UserRole.super_admin,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name: "Super Admin",
          email,
          phone,
          passwordHash,
          role: UserRole.super_admin,
        },
      });
    }

    console.log("Super-admin account is ready.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Failed to provision the super-admin account", error);
  process.exitCode = 1;
});
