import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { createSmsCampaign } from "@/lib/data-access/super-admin-communication";
import { createSmsCampaignSchema } from "@/lib/validation/communication";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, createSmsCampaignSchema);
    if (!body.success) return body.response;
    const campaign = await createSmsCampaign(actor.id, {
      ...body.data,
      audience: body.data.audience,
    });
    revalidatePath("/super-admin/communication/sms-campaigns");
    return Response.json({ campaign }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create SMS campaign", "SMS campaign could not be created");
  }
}
