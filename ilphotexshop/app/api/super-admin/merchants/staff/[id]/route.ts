import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { setMerchantStaffStatus } from "@/lib/data-access/super-admin-merchant-management";
import { merchantStaffStatusSchema, staffInvitationIdSchema } from "@/lib/validation/users";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = staffInvitationIdSchema.safeParse(id);
    if (!parsedId.success) return Response.json({ error: "Invalid staff member ID" }, { status: 400 });
    const body = await parseJsonRequest(request, merchantStaffStatusSchema);
    if (!body.success) return body.response;
    const changed = await setMerchantStaffStatus(parsedId.data, body.data.status);
    if (!changed) return Response.json({ error: "Staff member not found" }, { status: 404 });
    return Response.json({ id: parsedId.data, status: body.data.status });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update merchant staff", "Merchant staff status could not be updated");
  }
}
