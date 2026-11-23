import {
  authorizationErrorResponse,
  requireAuthenticatedUser,
} from "@/lib/authorization";
import {
  revokeAccountSecuritySession,
} from "@/lib/data-access/super-admin-security";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSecurityAccountMutationLimit } from "@/lib/rate-limit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    if (!id || id.length > 100) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }
    const limit = await checkSecurityAccountMutationLimit(user.id);
    if (!limit.allowed) return rateLimitResponse(limit, "account session revocation");
    const revoked = await revokeAccountSecuritySession(user.id, id);
    if (!revoked) return Response.json({ error: "Active session not found" }, { status: 404 });
    return Response.json({ revoked: true });
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiErrorResponse(
      error,
      "Failed to revoke account session",
      "Session could not be revoked",
    );
  }
}
