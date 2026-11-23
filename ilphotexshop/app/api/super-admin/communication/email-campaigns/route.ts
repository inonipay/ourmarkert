import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { createEmailCampaign } from "@/lib/data-access/super-admin-communication";
import { createEmailCampaignSchema } from "@/lib/validation/communication";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, createEmailCampaignSchema);
    if (!body.success) return body.response;
    const campaign = await createEmailCampaign(actor.id, {
      ...body.data,
      audience: body.data.audience,
    });
    revalidatePath("/super-admin/communication/email-campaigns");
    return Response.json({ campaign }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create email campaign", "Email campaign could not be created");
  }
}
