import { requireUserRole } from "@/lib/authorization";
import {
  createSuperAdminPaymentAccount,
  DuplicatePaymentAccountError,
} from "@/lib/data-access/super-admin-payment-accounts";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkPaymentAccountMutationLimit } from "@/lib/rate-limit";
import { paymentAccountSchema } from "@/lib/validation/payment-accounts";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const limit = await checkPaymentAccountMutationLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "payment account update");

    const body = await parseJsonRequest(request, paymentAccountSchema);
    if (!body.success) return body.response;

    const account = await createSuperAdminPaymentAccount(actor.id, body.data);
    return Response.json(
      { account },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof DuplicatePaymentAccountError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(
      error,
      "Failed to create payment account",
      "Payment account could not be created",
    );
  }
}
