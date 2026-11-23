import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { upsertMerchantStaff } from "@/lib/data-access/super-admin-merchant-management";
import { merchantStaffSchema } from "@/lib/validation/users";

export async function POST(request: Request) {
  try {
    await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, merchantStaffSchema);
    if (!body.success) return body.response;
    const staff = await upsertMerchantStaff(body.data);
    return Response.json(staff, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error, "Failed to save merchant staff", "Merchant staff could not be saved");
  }
}
