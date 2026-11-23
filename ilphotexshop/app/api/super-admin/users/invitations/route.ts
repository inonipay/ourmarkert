import { requireUserRole } from "@/lib/authorization";
import {
  createStaffInvitation,
} from "@/lib/data-access/super-admin-user-management";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { createStaffInvitationSchema } from "@/lib/validation/users";
import { checkStaffInvitationWriteLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const limit = await checkStaffInvitationWriteLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "staff invitation");
    const body = await parseJsonRequest(request, createStaffInvitationSchema);
    if (!body.success) return body.response;
    const result = await createStaffInvitation(actor.id, body.data);
    return Response.json(
      {
        id: result.invitation.id,
        email: result.invitation.email,
        status: result.invitation.status,
        expiresAt: result.invitation.expiresAt,
        acceptUrl: `/staff-invite/${result.token}`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to create staff invitation",
      "Staff invitation could not be created",
    );
  }
}
