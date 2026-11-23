import { requireUserRole } from "@/lib/authorization";
import {
  MerchantKycApplicantUnavailableError,
  MerchantKycReviewConflictError,
  reviewMerchantKycAsSuperAdmin,
} from "@/lib/data-access/merchant-kyc";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkMerchantKycReviewLimit } from "@/lib/rate-limit";
import { merchantKycReviewSchema, merchantKycIdSchema } from "@/lib/validation/merchant-kyc";

type MerchantKycReviewContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: MerchantKycReviewContext,
) {
  try {
    const actor = await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = merchantKycIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid application ID" }, { status: 400 });
    }

    const limit = await checkMerchantKycReviewLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "merchant KYC review");

    const body = await parseJsonRequest(request, merchantKycReviewSchema);
    if (!body.success) return body.response;

    const result = await reviewMerchantKycAsSuperAdmin(
      actor.id,
      parsedId.data,
      body.data,
    );
    if (!result) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof MerchantKycReviewConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof MerchantKycApplicantUnavailableError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(
      error,
      "Failed to review merchant application",
      "Merchant application could not be reviewed",
    );
  }
}
