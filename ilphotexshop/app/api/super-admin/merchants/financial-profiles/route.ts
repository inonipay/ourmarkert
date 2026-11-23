import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { upsertMerchantFinancialProfile } from "@/lib/data-access/super-admin-merchant-management";
import { merchantFinancialProfileSchema } from "@/lib/validation/users";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, merchantFinancialProfileSchema);
    if (!body.success) return body.response;
    const profile = await upsertMerchantFinancialProfile(actor.id, body.data);
    return Response.json(profile, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error, "Failed to save merchant financial profile", "Financial profile could not be saved");
  }
}
