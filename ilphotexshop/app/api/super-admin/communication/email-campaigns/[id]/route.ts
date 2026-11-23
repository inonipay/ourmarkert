import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { cancelEmailCampaign } from "@/lib/data-access/super-admin-communication";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUserRole("super_admin");
    const { id } = await context.params;
    const changed = await cancelEmailCampaign(id);
    if (!changed) {
      return Response.json({ error: "Campaign cannot be cancelled." }, { status: 409 });
    }
    revalidatePath("/super-admin/communication/email-campaigns");
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to cancel email campaign", "Email campaign could not be cancelled");
  }
}
