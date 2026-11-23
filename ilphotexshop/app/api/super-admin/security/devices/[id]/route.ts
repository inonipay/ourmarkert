import { requireUserRole, authorizationErrorResponse } from "@/lib/authorization";
import { updateSecurityDevice } from "@/lib/data-access/super-admin-security";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSecurityAccountMutationLimit } from "@/lib/rate-limit";
import { securityDeviceUpdateSchema } from "@/lib/validation/security";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireUserRole("super_admin");
    const { id } = await params;
    if (!id || id.length > 100) {
      return Response.json({ error: "Invalid device ID" }, { status: 400 });
    }
    const limit = await checkSecurityAccountMutationLimit(admin.id);
    if (!limit.allowed) return rateLimitResponse(limit, "security device update");
    const body = await parseJsonRequest(request, securityDeviceUpdateSchema);
    if (!body.success) return body.response;
    const updated = await updateSecurityDevice(id, body.data.action);
    if (!updated) return Response.json({ error: "Security device not found" }, { status: 404 });
    return Response.json({ updated: true });
  } catch (error) {
    return authorizationErrorResponse(error) ?? apiErrorResponse(
      error,
      "Failed to update security device",
      "Security device could not be updated",
    );
  }
}
