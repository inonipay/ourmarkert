import {
  authorizationErrorResponse,
  requireUserRole,
} from "@/lib/authorization";
import {
  PaymentProofReviewConflictError,
  reviewOrderPaymentProof,
} from "@/lib/data-access/order-payment-proofs";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkPaymentProofReviewLimit } from "@/lib/rate-limit";
import {
  paymentProofIdSchema,
  paymentProofReviewSchema,
} from "@/lib/validation/payment-proofs";

type PaymentProofReviewRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: PaymentProofReviewRouteContext,
) {
  try {
    const actor = await requireUserRole(["super_admin", "admin", "seller"]);
    const limit = await checkPaymentProofReviewLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "payment proof review");

    const { id } = await context.params;
    const parsedId = paymentProofIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid payment proof ID" }, { status: 400 });
    }

    const body = await parseJsonRequest(request, paymentProofReviewSchema);
    if (!body.success) return body.response;

    const proof = await reviewOrderPaymentProof(
      actor.id,
      parsedId.data,
      body.data,
    );
    if (!proof) {
      return Response.json({ error: "Payment proof not found" }, { status: 404 });
    }
    return Response.json(
      { proof },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof PaymentProofReviewConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    return apiErrorResponse(
      error,
      "Failed to review order payment proof",
      "Payment proof could not be reviewed",
    );
  }
}
