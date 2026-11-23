import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  authorizationErrorResponse,
  requireAuthenticatedUser,
} from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSecurityAccountMutationLimit } from "@/lib/rate-limit";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  createTotpSecret,
  verifyTotp,
} from "@/lib/security-totp";
import { revokeUserSecuritySessions } from "@/lib/data-access/super-admin-security";
import { twoFactorActionSchema } from "@/lib/validation/security";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });
    return Response.json(
      { enabled: account?.twoFactorEnabled ?? false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiErrorResponse(
      error,
      "Failed to read two-factor status",
      "Security status could not be loaded",
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const limit = await checkSecurityAccountMutationLimit(user.id);
    if (!limit.allowed) return rateLimitResponse(limit, "two-factor update");

    const body = await parseJsonRequest(request, twoFactorActionSchema);
    if (!body.success) return body.response;

    if (body.data.action === "setup") {
      const secret = createTotpSecret();
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorPendingSecret: encryptTotpSecret(secret) },
      });
      const label = encodeURIComponent(`ILPhotoX Shop:${user.email}`);
      const issuer = encodeURIComponent("ILPhotoX Shop");
      return Response.json(
        {
          secret,
          otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorPendingSecret: true,
      },
    });
    if (!account) return Response.json({ error: "Account not found" }, { status: 404 });

    if (body.data.action === "enable") {
      if (!account.twoFactorPendingSecret) {
        return Response.json({ error: "Start two-factor setup first" }, { status: 409 });
      }
      const secret = decryptTotpSecret(account.twoFactorPendingSecret);
      if (!verifyTotp(secret, body.data.code)) {
        return Response.json({ error: "Authenticator code is invalid" }, { status: 422 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: account.twoFactorPendingSecret,
          twoFactorPendingSecret: null,
        },
      });
      return Response.json({ enabled: true });
    }

    if (
      !account.twoFactorEnabled ||
      !account.twoFactorSecret ||
      !(await bcrypt.compare(body.data.password, account.passwordHash)) ||
      !verifyTotp(decryptTotpSecret(account.twoFactorSecret), body.data.code)
    ) {
      return Response.json({ error: "Password or authenticator code is invalid" }, { status: 422 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorPendingSecret: null,
      },
    });
    await revokeUserSecuritySessions(user.id);
    return Response.json({ enabled: false, sessionsRevoked: true });
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiErrorResponse(
      error,
      "Failed to update two-factor authentication",
      "Two-factor settings could not be updated",
    );
  }
}
