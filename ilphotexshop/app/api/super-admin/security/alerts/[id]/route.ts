import { requireUserRole, authorizationErrorResponse } from "@/lib/authorization";
import { updateSecurityAlert } from "@/lib/data-access/super-admin-security";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSecurityAccountMutationLimit } from "@/lib/rate-limit";
import { securityAlertUpdateSchema } from "@/lib/validation/security";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireUserRole("super_admin");
    const { id } = await params;
    if (!id || id.length > 100) {
      return Response.json({ error: "Invalid alert ID" }, { status: 400 });
    }
    const limit = await checkSecurityAccountMutationLimit(admin.id);
    if (!limit.allowed) return rateLimitResponse(limit, "security alert update");
    const body = await parseJsonRequest(request, securityAlertUpdateSchema);
    if (!body.success) return body.response;
    const updated = await updateSecurityAlert(admin.id, id, body.data.status);
    if (!updated) return Response.json({ error: "Security alert not found" }, { status: 404 });
    return Response.json({ updated: true });
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiErrorResponse(
      error,
      "Failed to update security alert",
      "Security alert could not be updated",
    );
  }
}
