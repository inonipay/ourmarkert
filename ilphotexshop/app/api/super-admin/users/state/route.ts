import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { setUserManagementState } from "@/lib/data-access/super-admin-user-management";
import { userIdSchema, userStateActionSchema } from "@/lib/validation/users";
import { checkUserStateWriteLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";

export async function PATCH(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const limit = await checkUserStateWriteLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "user account state update");
    const body = await parseJsonRequest(request, userStateActionSchema);
    if (!body.success) return body.response;
    const { searchParams } = new URL(request.url);
    const parsedId = userIdSchema.safeParse(searchParams.get("id"));
    if (!parsedId.success) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }
    const result = await setUserManagementState(
      actor.id,
      parsedId.data,
      body.data.action,
    );
    if (!result) return Response.json({ error: "User not found" }, { status: 404 });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to update user account state",
      "User account state could not be updated",
    );
  }
}
