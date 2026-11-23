import { updateMerchantProfile } from "@/lib/data-access/merchant-dashboard";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSellerProfileMutationLimit } from "@/lib/rate-limit";
import { updateSellerProfileSchema } from "@/lib/validation/users";

export async function PATCH(request: Request) {
  try {
    const seller = await requireUserRole("seller");
    const limit = await checkSellerProfileMutationLimit(seller.id);
    if (!limit.allowed) return rateLimitResponse(limit, "seller profile");

    const body = await parseJsonRequest(request, updateSellerProfileSchema);
    if (!body.success) return body.response;

    const profile = await updateMerchantProfile(seller, body.data);
    if (!profile) {
      return Response.json(
        { error: "Seller account is no longer available" },
        { status: 409 },
      );
    }

    return Response.json(
      { profile },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to update seller profile",
      "Profile could not be updated",
    );
  }
}
