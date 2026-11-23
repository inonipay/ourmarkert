import { requireUserRole } from "@/lib/authorization";
import { updateSuperAdminPaymentAccountStatus } from "@/lib/data-access/super-admin-payment-accounts";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkPaymentAccountMutationLimit } from "@/lib/rate-limit";
import {
  paymentAccountIdSchema,
  paymentAccountStatusSchema,
} from "@/lib/validation/payment-accounts";

type PaymentAccountStatusContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: PaymentAccountStatusContext,
) {
  try {
    const actor = await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = paymentAccountIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid payment account ID" }, { status: 400 });
    }

    const limit = await checkPaymentAccountMutationLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "payment account update");

    const body = await parseJsonRequest(request, paymentAccountStatusSchema);
    if (!body.success) return body.response;

    const account = await updateSuperAdminPaymentAccountStatus(
      actor.id,
      parsedId.data,
      body.data.isActive,
    );
    if (!account) {
      return Response.json({ error: "Payment account not found" }, { status: 404 });
    }
    return Response.json(
      { account },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to update payment account",
      "Payment account could not be updated",
    );
  }
}
