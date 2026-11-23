import { requireUserRole } from "@/lib/authorization";
import { cancelStaffInvitation } from "@/lib/data-access/super-admin-user-management";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { staffInvitationIdSchema } from "@/lib/validation/users";
import { checkStaffInvitationWriteLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUserRole("super_admin");
    const limit = await checkStaffInvitationWriteLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "staff invitation cancellation");
    const { id } = await context.params;
    const parsedId = staffInvitationIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid invitation ID" }, { status: 400 });
    }
    const cancelled = await cancelStaffInvitation(parsedId.data);
    if (!cancelled) {
      return Response.json({ error: "Invitation not found" }, { status: 404 });
    }
    return Response.json({ id: parsedId.data, status: "cancelled" });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to cancel staff invitation",
      "Staff invitation could not be cancelled",
    );
  }
}
