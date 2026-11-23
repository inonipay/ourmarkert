import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { featuredMerchantSchema } from "@/lib/validation/marketing";
import { setFeaturedMerchant } from "@/lib/data-access/super-admin-marketing";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, featuredMerchantSchema);
    if (!body.success) return body.response;
    const result = await setFeaturedMerchant(
      body.data.merchantId,
      true,
      body.data.position,
      new Date(body.data.startsAt),
      body.data.endsAt ? new Date(body.data.endsAt) : null,
    );
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error, "Failed to feature merchant", "Merchant could not be featured");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUserRole("super_admin");
    const body = await parseJsonRequest(
      request,
      z.object({ merchantId: z.string().min(1), isFeatured: z.boolean(), position: z.number().int().min(0).max(100).optional() }).strict(),
    );
    if (!body.success) return body.response;
    const result = await setFeaturedMerchant(body.data.merchantId, body.data.isFeatured, body.data.position);
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update featured merchant", "Featured merchant status could not be updated");
  }
}
