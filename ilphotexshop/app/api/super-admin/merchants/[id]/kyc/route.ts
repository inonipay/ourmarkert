import { requireUserRole } from "@/lib/authorization";
import { eraseMerchantKycAsSuperAdmin } from "@/lib/data-access/merchant-kyc";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkMerchantAccessWriteLimit } from "@/lib/rate-limit";
import { userIdSchema } from "@/lib/validation/users";
import { eraseMerchantKycSchema } from "@/lib/validation/merchant-kyc";

type MerchantKycEraseContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  request: Request,
  context: MerchantKycEraseContext,
) {
  try {
    const actor = await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = userIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid merchant ID" }, { status: 400 });
    }

    const limit = await checkMerchantAccessWriteLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "merchant KYC erasure");

    const body = await parseJsonRequest(request, eraseMerchantKycSchema);
    if (!body.success) return body.response;

    const result = await eraseMerchantKycAsSuperAdmin(
      actor.id,
      parsedId.data,
      body.data.reason,
    );
    if (!result) {
      return Response.json(
        { error: "Only a suspended merchant can be anonymized" },
        { status: 409 },
      );
    }
    if (result.alreadyAnonymized) {
      return Response.json(
        { error: "This merchant has already been anonymized" },
        { status: 409 },
      );
    }
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to erase merchant KYC data",
      "Merchant KYC data could not be erased",
    );
  }
}
