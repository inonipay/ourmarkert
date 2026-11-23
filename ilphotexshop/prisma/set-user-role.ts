import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const argumentsSchema = z.tuple([
  z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  z.enum(["seller", "admin", "super_admin"]),
]);

async function main() {
  const parsedArguments = argumentsSchema.safeParse(process.argv.slice(2));
  if (!parsedArguments.success) {
    console.error(
      "Usage: npm run db:set-role -- <user-email> <seller|admin|super_admin>",
    );
    process.exitCode = 1;
    return;
  }

  const [email, role] = parsedArguments.data;
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      throw new Error("No account exists for the supplied email");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role },
    });
    console.log(`Assigned the ${role} role to the requested account.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Failed to assign the user role", error);
  process.exitCode = 1;
});
