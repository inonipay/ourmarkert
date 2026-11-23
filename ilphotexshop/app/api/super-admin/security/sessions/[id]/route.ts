import { requireUserRole, authorizationErrorResponse } from "@/lib/authorization";
import { revokeSecuritySession } from "@/lib/data-access/super-admin-security";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSecurityAccountMutationLimit } from "@/lib/rate-limit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireUserRole("super_admin");
    const { id } = await params;
    if (!id || id.length > 100) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }
    const limit = await checkSecurityAccountMutationLimit(admin.id);
    if (!limit.allowed) return rateLimitResponse(limit, "session revocation");
    const revoked = await revokeSecuritySession(id);
    if (!revoked) return Response.json({ error: "Active session not found" }, { status: 404 });
    return Response.json({ revoked: true });
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiErrorResponse(
      error,
      "Failed to revoke security session",
      "Session could not be revoked",
    );
  }
}
